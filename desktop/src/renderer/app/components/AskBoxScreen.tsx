import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Loader2, Send, Mic, MicOff } from "lucide-react";

const FONT = "'NaN Jaune', 'Plus Jakarta Sans', sans-serif";

export function AskBoxScreen() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentCode, setCurrentCode] = useState("");

    // Deepgram / microphone state
    const [isRecording, setIsRecording] = useState(false);
    const [interimText, setInterimText] = useState("");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const deepgramConnectionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const stableTextRef = useRef(""); // accumulates only final transcripts
    const lastFinalRef = useRef(""); // to prevent duplicate sequential chunks

    useEffect(() => {
        if (window.api) {
            // Pull the current code immediately on mount
            window.api.getEditorCode().then((result: { code?: string }) => {
                if (result.code) setCurrentCode(result.code);
            });
            // Also listen for live updates if the user switches files while the box is open
            window.api.onInitAskBox((code: string) => {
                setCurrentCode(code);
            });
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (deepgramConnectionRef.current) {
            deepgramConnectionRef.current.close();
            deepgramConnectionRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setInterimText((currInterim) => {
            if (currInterim) {
                const updated = (stableTextRef.current + " " + currInterim).trim();
                stableTextRef.current = updated;
                setPrompt(updated);
            }
            return "";
        });
        setIsRecording(false);
    }, []);

    const startRecording = useCallback(async () => {
        setError(null);

        // 1. Fetch Deepgram key via IPC from the backend .env
        const result = await window.api.getDeepgramKey();
        if (result.error || !result.key) {
            setError(result.error || "Deepgram key missing. Add DEEPGRAM_API_KEY to backend/.env");
            return;
        }

        // 2. Request microphone permission
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
        } catch {
            setError("Microphone permission denied. Please allow microphone access.");
            return;
        }

        // 3. Open a WebSocket to Deepgram's live transcription endpoint
        const ws = new WebSocket(
            "wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true&utterance_end_ms=1000",
            ["token", result.key]
        );
        deepgramConnectionRef.current = ws;

        ws.onopen = () => {
            // 4. Start sending audio chunks
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                    ws.send(e.data);
                }
            };

            recorder.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
            };

            recorder.start(250); // send 250ms audio chunks
            setIsRecording(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const transcript = data?.channel?.alternatives?.[0]?.transcript ?? "";
                const isFinal = data?.is_final;

                if (isFinal && transcript) {
                    // Prevent Deepgram sending identical "is_final: true" blocks back to back mapping to the same chunk
                    if (transcript !== lastFinalRef.current) {
                        stableTextRef.current = (stableTextRef.current + " " + transcript).trim();
                        setPrompt(stableTextRef.current);
                        lastFinalRef.current = transcript;
                    }
                    setInterimText("");
                } else if (!isFinal && transcript) {
                    setInterimText(transcript);
                    // Reset the duplicate tracker because moving on to interim means a new utterance chunk has genuinely started
                    if (lastFinalRef.current !== "") {
                        lastFinalRef.current = "";
                    }
                }
            } catch { /* ignore parse errors */ }
        };

        ws.onerror = () => {
            setError("Deepgram connection error. Check your DEEPGRAM_API_KEY.");
            stopRecording();
        };

        ws.onclose = () => {
            setIsRecording(false);
            setInterimText("");
        };
    }, [stopRecording]);

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            // Reset stable text ref to current prompt when starting fresh
            stableTextRef.current = prompt;
            startRecording();
        }
    };

    // The full displayed text = stable finalized text + live interim
    const displayedPrompt = isRecording && interimText
        ? (prompt ? prompt + " " : "") + interimText
        : prompt;

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        const finalPrompt = displayedPrompt.trim();
        if (isRecording) stopRecording();

        if (!finalPrompt || !window.api) return;

        if (!currentCode) {
            setError("No file is open in the editor. Please open a .tex file and try again.");
            return;
        }

        setPrompt(finalPrompt);
        setLoading(true);
        setError(null);

        try {
            const response = await window.api.askGeminiEdit({ prompt: finalPrompt, content: currentCode });
            if (response.error) {
                setError(response.error);
                setLoading(false);
            } else if (response.content) {
                await window.api.sendProposal(response.content);
            }
        } catch (err: any) {
            setError(err.message || String(err));
            setLoading(false);
        }
    };


    return (
        <div className="flex flex-col h-screen w-full" style={{ background: "#FEFCF8", padding: "16px", boxSizing: "border-box" }}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Sparkles style={{ width: "16px", height: "16px", color: "#C8532A" }} />
                <h2 style={{ fontSize: "14px", fontFamily: FONT, fontWeight: 600, color: "#3C2A18" }}>
                    Ask Gemini to Edit
                </h2>
            </div>

            <div className="flex-1 flex flex-col gap-2 min-h-0">
                {/* Prompt textarea & Animated Overlay */}
                <div className="flex-1 relative overflow-hidden bg-[#F9F3EC] rounded-xl border border-[#E4D9CC]"
                    style={{
                        background: isRecording ? "#FFF8F4" : "#F9F3EC",
                        borderColor: isRecording ? "#F0A882" : "#E4D9CC",
                        transition: "border 0.2s, background 0.2s",
                    }}>

                    {/* Render text with animation overlay */}
                    {isRecording ? (
                        <div
                            className="absolute inset-0 p-3 pointer-events-none overflow-y-auto whitespace-pre-wrap break-words"
                            style={{
                                fontSize: "13px",
                                fontFamily: FONT,
                                color: "#3C2A18",
                                boxSizing: "border-box",
                            }}
                        >
                            <span>{prompt}{prompt && interimText ? " " : ""}</span>
                            <span
                                key={interimText} // forces re-animation on new text
                                style={{
                                    color: "#C8532A",
                                    animation: "fadeInWord 0.3s ease-out forwards",
                                    opacity: 0,
                                    display: "inline-block"
                                }}
                            >
                                {interimText}
                            </span>
                        </div>
                    ) : null}

                    <textarea
                        autoFocus
                        value={displayedPrompt}
                        onChange={(e) => {
                            if (!isRecording) {
                                setPrompt(e.target.value);
                                stableTextRef.current = e.target.value;
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        placeholder="e.g. Translate the abstract to Spanish..."
                        disabled={loading}
                        className="w-full h-full p-3 resize-none outline-none"
                        style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "13px",
                            fontFamily: FONT,
                            color: isRecording ? "transparent" : "#3C2A18",
                            caretColor: "#C8532A",
                            boxSizing: "border-box",
                        }}
                    />
                    {/* Pulsing mic indicator while recording */}
                    {isRecording && (
                        <div
                            style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#C8532A",
                                animation: "pulse 1s ease-in-out infinite",
                            }}
                        />
                    )}
                </div>

                {error && (
                    <div style={{ fontSize: "11px", color: "#c0392b", background: "#fef0ef", border: "1px solid #f5c6c2", padding: "8px 10px", borderRadius: "8px" }}>
                        {error}
                    </div>
                )}

                {/* Bottom bar: mic + submit */}
                <div className="flex items-center justify-between gap-2">
                    {/* Mic button */}
                    <button
                        onClick={toggleRecording}
                        disabled={loading}
                        title={isRecording ? "Stop recording" : "Speak your prompt"}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
                        style={{
                            background: isRecording ? "#FAE5D8" : "#F5EDE3",
                            border: isRecording ? "1.5px solid #F0C9B4" : "1.5px solid #EDE5D8",
                            color: isRecording ? "#C8532A" : "#A08870",
                            fontSize: "12px",
                            fontFamily: FONT,
                            fontWeight: 500,
                        }}
                    >
                        {isRecording ? (
                            <>
                                <MicOff style={{ width: "13px", height: "13px" }} />
                                Stop
                            </>
                        ) : (
                            <>
                                <Mic style={{ width: "13px", height: "13px" }} />
                                Speak
                            </>
                        )}
                    </button>

                    <span style={{ fontSize: "10px", color: "#A08870", fontFamily: FONT }}>
                        {isRecording ? "Listening…" : "Enter to submit"}
                    </span>

                    {/* Submit button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !displayedPrompt.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                        style={{
                            background: loading ? "#FAF0E8" : "#C8532A",
                            color: loading ? "#C8532A" : "#FFFFFF",
                            fontSize: "12px",
                            fontFamily: FONT,
                            fontWeight: 500,
                            opacity: !displayedPrompt.trim() && !loading ? 0.5 : 1,
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" style={{ width: "12px", height: "12px" }} />
                                Thinking…
                            </>
                        ) : (
                            <>
                                <Send style={{ width: "12px", height: "12px" }} />
                                Submit
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.4); }
                }
                @keyframes fadeInWord {
                    0% { opacity: 0; transform: translateY(4px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
