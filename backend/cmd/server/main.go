package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

type EditRequest struct {
	Prompt  string `json:"prompt"`
	Content string `json:"content"`
}

type EditResponse struct {
	Content string `json:"content"`
	Error   string `json:"error,omitempty"`
}

type ImageToLatexRequest struct {
	ImageBase64 string `json:"imageBase64"`
	MimeType    string `json:"mimeType"`
	FileName    string `json:"fileName"`
}

func main() {
	// Load .env if present
	_ = godotenv.Load()

	http.HandleFunc("/api/compile", func(w http.ResponseWriter, r *http.Request) {
		// Temporary dummy response
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status": "success", "message": "Dummy compile endpoint hit"}`)
	})

	http.HandleFunc("/api/ai/edit", handleAIEdit)
	http.HandleFunc("/api/ai/image-to-latex", handleImageToLatex)

	port := 8080
	fmt.Printf("LTeXch Backend running on :%d\n", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), nil))
}

func handleAIEdit(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req EditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(EditResponse{Error: "Invalid request payload"})
		return
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		json.NewEncoder(w).Encode(EditResponse{Error: "GEMINI_API_KEY is not set on the backend"})
		return
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		json.NewEncoder(w).Encode(EditResponse{Error: fmt.Sprintf("Failed to create client: %v", err)})
		return
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-2.5-flash")
	model.SetTemperature(0.2) // Low temperature for more deterministic coding tasks

	// Construct exactly what we want out of Gemini
	promptText := fmt.Sprintf(`You are an expert LaTeX editor. Your task is to apply a requested edit to the provided LaTeX content.
You must output ONLY the final modified LaTeX code. Do not include any explanations, do not wrap the output in markdown code blocks like <wrapper>`+"```"+`latex</wrapper>, and do not make unrelated changes.

User Request: %s

------ LaTeX Content ------
%s
---------------------------`, req.Prompt, req.Content)

	resp, err := model.GenerateContent(ctx, genai.Text(promptText))
	if err != nil {
		json.NewEncoder(w).Encode(EditResponse{Error: fmt.Sprintf("Failed to generate content: %v", err)})
		return
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		json.NewEncoder(w).Encode(EditResponse{Error: "No response generated"})
		return
	}

	var resultText string
	for _, part := range resp.Candidates[0].Content.Parts {
		if txt, ok := part.(genai.Text); ok {
			resultText += string(txt)
		}
	}

	json.NewEncoder(w).Encode(EditResponse{Content: resultText})
}

func handleImageToLatex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req ImageToLatexRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(EditResponse{Error: "Invalid request payload"})
		return
	}

	if req.ImageBase64 == "" {
		json.NewEncoder(w).Encode(EditResponse{Error: "No image data provided"})
		return
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		json.NewEncoder(w).Encode(EditResponse{Error: "GEMINI_API_KEY is not set on the backend"})
		return
	}

	// Decode the base64 image
	imageBytes, err := base64.StdEncoding.DecodeString(req.ImageBase64)
	if err != nil {
		json.NewEncoder(w).Encode(EditResponse{Error: "Failed to decode image: " + err.Error()})
		return
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		json.NewEncoder(w).Encode(EditResponse{Error: fmt.Sprintf("Failed to create Gemini client: %v", err)})
		return
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-2.5-flash")
	model.SetTemperature(0.1)

	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "png"
	} else if strings.HasPrefix(mimeType, "image/") {
		mimeType = strings.TrimPrefix(mimeType, "image/")
	}
	// Gemini API accepts "jpeg" not "jpg"
	if mimeType == "jpg" {
		mimeType = "jpeg"
	}

	prompt := genai.Text(`You are an expert mathematician and LaTeX typesetter.
Look at this image carefully. It contains handwritten or printed mathematical content.
Your task is to transcribe ALL content from this image into a complete, valid LaTeX document.

Rules:
- Output ONLY valid LaTeX code. No explanations, no markdown code fences.
- Wrap the content in a proper \documentclass{article} ... \end{document} structure.
- Use standard LaTeX packages as needed (amsmath, amssymb, etc.).
- Preserve all equations, text, diagrams descriptions, and structure from the image.
- Use \[ \] for display math and \( \) for inline math.
- If there are multiple problems or sections, use \section* or \subsection* to organize them.`)

	imageData := genai.ImageData(mimeType, imageBytes)

	resp, err := model.GenerateContent(ctx, prompt, imageData)
	if err != nil {
		json.NewEncoder(w).Encode(EditResponse{Error: fmt.Sprintf("Gemini Vision error: %v", err)})
		return
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		json.NewEncoder(w).Encode(EditResponse{Error: "No LaTeX was generated from the image"})
		return
	}

	var resultText string
	for _, part := range resp.Candidates[0].Content.Parts {
		if txt, ok := part.(genai.Text); ok {
			resultText += string(txt)
		}
	}

	json.NewEncoder(w).Encode(EditResponse{Content: resultText})
}
