import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  FilePlus,
  FolderOpen,
  Upload,
  GitBranch,
  Clock,
  FileText,
  BookOpen,
  ChevronRight,
  Star,
  Sparkles,
  ImagePlus,
  Archive,
  Globe,
  Code2,
  ExternalLink,
  Plus,
  GitCommit,
  GitMerge,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  CloudUpload,
  ChevronDown,
  CloudOff,
  Volume2,
  ScanLine,
} from "lucide-react";

const FONT = "'NaN Jaune', 'Plus Jakarta Sans', -apple-system, sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', monospace";

const recentFiles = [
  { name: "thesis_main.tex", path: "~/Documents/Thesis", date: "2 hours ago", size: "48 KB", modified: true },
  { name: "paper_algorithms.tex", path: "~/Research/Algorithms", date: "Yesterday", size: "22 KB", modified: false },
  { name: "cv_academic.tex", path: "~/Documents/CV", date: "3 days ago", size: "8 KB", modified: false },
  { name: "lecture_notes_03.tex", path: "~/Classes/CS501", date: "1 week ago", size: "15 KB", modified: false },
  { name: "bibliography.bib", path: "~/Documents/Thesis", date: "1 week ago", size: "34 KB", modified: true },
];

const gitCommits = [
  { hash: "a4f2c8e", message: "Fix equation numbering in Chapter 3", date: "2 hours ago", branch: "main" },
  { hash: "9d31b7f", message: "Add bibliography entries for related work", date: "Yesterday", branch: "main" },
  { hash: "e82a1c4", message: "Restructure introduction section", date: "3 days ago", branch: "feature/intro" },
  { hash: "c61f903", message: "Initial thesis structure", date: "1 week ago", branch: "main" },
];

const changedFiles = [
  { name: "thesis_main.tex", status: "M", color: "#D4800A" },
  { name: "chapter_03.tex", status: "M", color: "#D4800A" },
  { name: "bibliography.bib", status: "M", color: "#D4800A" },
  { name: "figures/diagram_01.png", status: "A", color: "#3D9A6A" },
];

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"start" | "vcs">("start");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [speechMode, setSpeechMode] = useState<"text" | "image">("text");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) setUploadedFiles((p) => [...p, ...files.map((f) => f.name)]);
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#F9F3EC" }}>
      {/* Sidebar */}
      <div
        className="flex flex-col shrink-0"
        style={{
          width: "210px",
          background: "#F2EBE1",
          borderRight: "1px solid #E4D9CC",
        }}
      >
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ borderBottom: "1px solid #E4D9CC" }}
        >
          <span
            style={{
              color: "#A08870",
              fontSize: "10px",
              fontFamily: FONT,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Explorer
          </span>
          <button
            className="rounded-lg p-0.5 hover:bg-black/5 transition-colors"
            style={{ color: "#A08870" }}
          >
            <Plus style={{ width: "12px", height: "12px" }} />
          </button>
        </div>

        <div className="overflow-auto flex-1 py-2">
          {/* Workspace */}
          <div className="px-2">
            <div className="flex items-center gap-1 px-2 mb-1">
              <ChevronDown style={{ width: "10px", height: "10px", color: "#C8532A" }} />
              <span
                style={{
                  color: "#C8532A",
                  fontSize: "10px",
                  fontFamily: FONT,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Thesis Project
              </span>
            </div>
            {[
              { name: "thesis_main.tex", modified: true },
              { name: "chapter_01.tex", modified: false },
              { name: "chapter_02.tex", modified: false },
              { name: "chapter_03.tex", modified: true },
              { name: "bibliography.bib", modified: true },
              { name: "figures/", isDir: true },
              { name: "appendix.tex", modified: false },
            ].map((file) => (
              <button
                key={file.name}
                onClick={() => !file.isDir && navigate("/editor")}
                className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-black/5 transition-colors text-left"
              >
                {file.isDir ? (
                  <FolderOpen style={{ width: "12px", height: "12px", color: "#C8532A", flexShrink: 0 }} />
                ) : (
                  <FileText style={{ width: "12px", height: "12px", color: "#C8BEB0", flexShrink: 0 }} />
                )}
                <span
                  style={{
                    fontSize: "12px",
                    fontFamily: FONT,
                    color: file.modified ? "#C8532A" : "#7A6858",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </span>
                {file.modified && (
                  <div
                    className="ml-auto shrink-0 rounded-full"
                    style={{ width: "5px", height: "5px", background: "#D4800A" }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Subtle background texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 70% 0%, rgba(200,83,42,0.05) 0%, transparent 55%), radial-gradient(ellipse at 5% 90%, rgba(61,154,106,0.04) 0%, transparent 45%)",
          }}
        />

        <div className="relative max-w-3xl mx-auto px-10 py-10">
          {/* Header */}
          <div className="mb-7">
            <div className="flex items-end gap-3 mb-1.5">
              <h1
                style={{
                  fontFamily: FONT,
                  fontSize: "36px",
                  color: "#2C1F12",
                  lineHeight: 1.1,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                }}
              >
                L'TeXch
              </h1>
              <span
                style={{
                  fontSize: "11px",
                  color: "#C8532A",
                  background: "#FAE5D8",
                  border: "1.5px solid #F0C9B4",
                  borderRadius: "99px",
                  padding: "2px 10px",
                  marginBottom: "7px",
                  fontFamily: FONT,
                  fontWeight: 500,
                }}
              >
                v1.0.0
              </span>
            </div>
            <p style={{ color: "#A08870", fontSize: "13px", fontFamily: FONT }}>
              Your intelligent LaTeX workspace — beautifully composed.
            </p>
          </div>

          {/* Tabs */}
          <div
            className="flex items-center gap-1 mb-6 p-1 rounded-2xl w-fit"
            style={{ background: "#EDE5D8" }}
          >
            {(
              [
                { id: "start", label: "Start", icon: Sparkles },
                { id: "vcs", label: "Version Control", icon: GitBranch },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all"
                style={{
                  fontSize: "13px",
                  fontFamily: FONT,
                  fontWeight: activeTab === id ? 500 : 400,
                  color: activeTab === id ? "#2C1F12" : "#A08870",
                  background: activeTab === id ? "#FFFFFF" : "transparent",
                  boxShadow:
                    activeTab === id
                      ? "0 1px 6px rgba(44,31,18,0.1), 0 1px 2px rgba(44,31,18,0.06)"
                      : "none",
                }}
              >
                <Icon style={{ width: "13px", height: "13px" }} />
                {label}
              </button>
            ))}
          </div>

          {/* ─────────── TAB: START ─────────── */}
          {activeTab === "start" && (
            <div className="flex gap-7">
              {/* Recent Files */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <Clock style={{ width: "13px", height: "13px", color: "#B5A08A" }} />
                  <span
                    style={{
                      color: "#A08870",
                      fontSize: "11px",
                      fontFamily: FONT,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Recent
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {recentFiles.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => navigate("/editor")}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/70 transition-all group text-left w-full"
                      style={{
                        border: "1.5px solid transparent",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.border = "1.5px solid #E8DDD0";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(44,31,18,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.border = "1.5px solid transparent";
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      }}
                    >
                      <div
                        className="rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          width: "30px",
                          height: "30px",
                          background: "#FAE5D8",
                          border: "1.5px solid #F0C9B4",
                        }}
                      >
                        <FileText style={{ width: "13px", height: "13px", color: "#C8532A" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            style={{
                              fontSize: "13px",
                              fontFamily: MONO,
                              color: "#2C1F12",
                            }}
                          >
                            {file.name}
                          </span>
                          {file.modified && (
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#D4800A",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#B5A08A",
                            fontFamily: FONT,
                          }}
                        >
                          {file.path}
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#C8BEB0", flexShrink: 0, fontFamily: FONT }}>
                        {file.date}
                      </span>
                      <ChevronRight
                        style={{ width: "12px", height: "12px", color: "#C8BEB0", flexShrink: 0 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </button>
                  ))}
                </div>

                {/* Templates */}
                <div className="flex items-center gap-2 mb-3 mt-6">
                  <Star style={{ width: "13px", height: "13px", color: "#B5A08A" }} />
                  <span
                    style={{
                      color: "#A08870",
                      fontSize: "11px",
                      fontFamily: FONT,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Pinned Templates
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "IEEE Paper", desc: "Conference paper template", dot: "#C8532A", bg: "#FAE5D8", border: "#F0C9B4" },
                    { name: "ACM Article", desc: "Journal article format", dot: "#3D9A6A", bg: "#DDF2E8", border: "#BDE5CF" },
                    { name: "Beamer Slides", desc: "Presentation deck", dot: "#2C6FAC", bg: "#DDEEF8", border: "#BDD9EE" },
                    { name: "PhD Thesis", desc: "Full thesis structure", dot: "#9B5CF6", bg: "#EDE5FB", border: "#D5C4F6" },
                  ].map((tmpl) => (
                    <button
                      key={tmpl.name}
                      className="flex items-start gap-3 p-3 rounded-2xl hover:shadow-sm transition-all text-left"
                      style={{
                        background: "#FFFFFF",
                        border: "1.5px solid #EDE5D8",
                      }}
                    >
                      <div
                        className="rounded-full shrink-0"
                        style={{
                          width: "8px",
                          height: "8px",
                          background: tmpl.dot,
                          marginTop: "4px",
                        }}
                      />
                      <div>
                        <div style={{ fontSize: "12px", fontFamily: FONT, fontWeight: 500, color: "#2C1F12" }}>
                          {tmpl.name}
                        </div>
                        <div style={{ fontSize: "11px", fontFamily: FONT, color: "#A08870" }}>
                          {tmpl.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Actions */}
              <div style={{ width: "210px", flexShrink: 0 }}>
                {/* New */}
                <div className="mb-5">
                  <span
                    style={{
                      color: "#A08870",
                      fontSize: "11px",
                      fontFamily: FONT,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    New
                  </span>
                  <div className="flex flex-col gap-1 mt-2">
                    {[
                      { icon: FilePlus, label: "New File", shortcut: "⌘N", action: () => navigate("/editor"), accent: true },
                      { icon: FolderOpen, label: "Open Folder", shortcut: "⌘O", action: () => {}, accent: false },
                      { icon: Globe, label: "Clone Repo", shortcut: "", action: () => navigate("/version-control"), accent: false },
                      { icon: Archive, label: "Open Archive", shortcut: "", action: () => {}, accent: false },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left group"
                        style={{
                          background: item.accent ? "#FAE5D8" : "transparent",
                          border: item.accent ? "1.5px solid #F0C9B4" : "1.5px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!item.accent) {
                            (e.currentTarget as HTMLElement).style.background = "#FFFFFF";
                            (e.currentTarget as HTMLElement).style.border = "1.5px solid #EDE5D8";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!item.accent) {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.border = "1.5px solid transparent";
                          }
                        }}
                      >
                        <item.icon
                          style={{
                            width: "14px",
                            height: "14px",
                            color: item.accent ? "#C8532A" : "#A08870",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "13px",
                            fontFamily: FONT,
                            color: item.accent ? "#C8532A" : "#7A6858",
                            flex: 1,
                            fontWeight: item.accent ? 500 : 400,
                          }}
                        >
                          {item.label}
                        </span>
                        {item.shortcut && (
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#B5A08A",
                              background: "#EDE5D8",
                              borderRadius: "6px",
                              padding: "1px 5px",
                              fontFamily: FONT,
                            }}
                          >
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload / Import — OpenLeaf style */}
                <div className="mb-5">
                  <span
                    style={{
                      color: "#A08870",
                      fontSize: "11px",
                      fontFamily: FONT,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Import
                  </span>
                  <div
                    className="mt-2 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      height: "108px",
                      background: dragOver ? "#FAE5D8" : "#FFFFFF",
                      border: `2px dashed ${dragOver ? "#C8532A" : "#E4D9CC"}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      className="rounded-2xl flex items-center justify-center"
                      style={{
                        width: "36px",
                        height: "36px",
                        background: dragOver ? "#F0C9B4" : "#FAF0E8",
                        border: `1.5px solid ${dragOver ? "#C8532A" : "#E8DDD0"}`,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ImagePlus
                        style={{
                          width: "16px",
                          height: "16px",
                          color: dragOver ? "#C8532A" : "#C8BEB0",
                          transition: "color 0.2s",
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p
                        style={{
                          fontSize: "12px",
                          fontFamily: FONT,
                          color: dragOver ? "#C8532A" : "#A08870",
                          fontWeight: dragOver ? 500 : 400,
                        }}
                      >
                        {dragOver ? "Drop to import" : "Drop image or PDF"}
                      </p>
                      <p style={{ fontSize: "10px", fontFamily: FONT, color: "#C8BEB0", marginTop: "2px" }}>
                        PNG · JPG · PDF · SVG · .tex
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.tex,.bib"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length) setUploadedFiles((p) => [...p, ...files.map((f) => f.name)]);
                      }}
                    />
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {uploadedFiles.map((name, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
                          style={{ background: "#DDF2E8", border: "1.5px solid #BDE5CF" }}
                        >
                          <CheckCircle style={{ width: "11px", height: "11px", color: "#3D9A6A" }} />
                          <span style={{ fontSize: "11px", fontFamily: MONO, color: "#2E7D52" }}>{name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Help */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      style={{
                        color: "#A08870",
                        fontSize: "11px",
                        fontFamily: FONT,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Help
                    </span>

                    {/* OpenLeaf-style switchable speech bubble */}
                    <div
                      className="flex items-center p-0.5 rounded-xl gap-0.5"
                      style={{
                        background: "#EDE5D8",
                        border: "1.5px solid #E0D5C5",
                      }}
                    >
                      {(
                        [
                          {
                            mode: "text" as const,
                            Icon: Volume2,
                            label: "Text to Speech",
                          },
                          {
                            mode: "image" as const,
                            Icon: ScanLine,
                            label: "Image to Speech",
                          },
                        ] as const
                      ).map(({ mode, Icon, label }) => {
                        const isActive = speechMode === mode;
                        return (
                          <button
                            key={mode}
                            title={label}
                            onClick={() => setSpeechMode(mode)}
                            className="flex items-center gap-1.5 rounded-lg transition-all"
                            style={{
                              padding: "4px 9px",
                              background: isActive ? "#FFFFFF" : "transparent",
                              color: isActive ? "#C8532A" : "#B5A08A",
                              fontSize: "11px",
                              fontFamily: FONT,
                              fontWeight: isActive ? 500 : 400,
                              boxShadow: isActive
                                ? "0 1px 4px rgba(44,31,18,0.10), 0 0.5px 1px rgba(44,31,18,0.06)"
                                : "none",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Icon
                              style={{
                                width: "12px",
                                height: "12px",
                                flexShrink: 0,
                                strokeWidth: isActive ? 2.2 : 1.8,
                              }}
                            />
                            <span style={{ lineHeight: 1 }}>{label.split(" ")[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Speech mode indicator */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
                    style={{
                      background: speechMode === "text" ? "#FAE5D8" : "#DDF2E8",
                      border: `1.5px solid ${speechMode === "text" ? "#F0C9B4" : "#BDE5CF"}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {speechMode === "text" ? (
                      <Volume2
                        style={{ width: "12px", height: "12px", color: "#C8532A", flexShrink: 0 }}
                      />
                    ) : (
                      <ScanLine
                        style={{ width: "12px", height: "12px", color: "#3D9A6A", flexShrink: 0 }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: "11px",
                        fontFamily: FONT,
                        color: speechMode === "text" ? "#C8532A" : "#2E7D52",
                      }}
                    >
                      {speechMode === "text"
                        ? "Read document aloud with TTS"
                        : "Describe image content via AI"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {[
                      { label: "LaTeX Reference", icon: BookOpen },
                      { label: "Keyboard Shortcuts", icon: Code2 },
                      { label: "What's New", icon: Sparkles },
                      { label: "Documentation", icon: ExternalLink },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/60 transition-colors text-left"
                      >
                        <item.icon style={{ width: "12px", height: "12px", color: "#C8BEB0" }} />
                        <span style={{ fontSize: "12px", fontFamily: FONT, color: "#A08870" }}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────── TAB: VERSION CONTROL ─────────── */}
          {activeTab === "vcs" && (
            <div className="flex gap-7">
              {/* Left: Changes + Commit */}
              <div className="flex-1 min-w-0">
                {/* Repo header */}
                <div
                  className="flex items-center justify-between p-3 rounded-2xl mb-4"
                  style={{
                    background: "#FFFFFF",
                    border: "1.5px solid #EDE5D8",
                    boxShadow: "0 1px 6px rgba(44,31,18,0.05)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-xl flex items-center justify-center"
                      style={{
                        width: "38px",
                        height: "38px",
                        background: "#FAE5D8",
                        border: "1.5px solid #F0C9B4",
                      }}
                    >
                      <GitBranch style={{ width: "16px", height: "16px", color: "#C8532A" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontFamily: FONT, fontWeight: 500, color: "#2C1F12" }}>
                        Thesis Project
                      </div>
                      <div style={{ fontSize: "11px", fontFamily: FONT, color: "#B5A08A" }}>
                        github.com/you/thesis
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors hover:bg-black/5"
                      style={{
                        fontSize: "12px",
                        fontFamily: FONT,
                        color: "#7A6858",
                        border: "1.5px solid #E4D9CC",
                        background: "#FAFAF8",
                      }}
                    >
                      <RefreshCw style={{ width: "11px", height: "11px" }} />
                      Fetch
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors"
                      style={{
                        fontSize: "12px",
                        fontFamily: FONT,
                        color: "#C8532A",
                        background: "#FAE5D8",
                        border: "1.5px solid #F0C9B4",
                        fontWeight: 500,
                      }}
                    >
                      <CloudUpload style={{ width: "11px", height: "11px" }} />
                      Push
                    </button>
                  </div>
                </div>

                {/* Changed files */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle style={{ width: "13px", height: "13px", color: "#D4800A" }} />
                      <span
                        style={{
                          color: "#A08870",
                          fontSize: "11px",
                          fontFamily: FONT,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Changes ({changedFiles.length})
                      </span>
                    </div>
                    <button
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs hover:bg-black/5 transition-colors"
                      style={{ fontSize: "11px", fontFamily: FONT, color: "#C8532A", border: "1.5px solid #F0C9B4", background: "#FAE5D8" }}
                    >
                      <Plus style={{ width: "10px", height: "10px" }} />
                      Stage All
                    </button>
                  </div>
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "#FFFFFF",
                      border: "1.5px solid #EDE5D8",
                    }}
                  >
                    {changedFiles.map((file, i) => (
                      <div
                        key={file.name}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAF5EF] transition-colors cursor-pointer group"
                        style={{ borderBottom: i < changedFiles.length - 1 ? "1px solid #F0E9DF" : "none" }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            fontFamily: MONO,
                            color: file.color,
                            width: "12px",
                            flexShrink: 0,
                            fontWeight: 600,
                          }}
                        >
                          {file.status}
                        </span>
                        <FileText style={{ width: "12px", height: "12px", color: "#C8BEB0" }} />
                        <span
                          style={{
                            fontSize: "12px",
                            fontFamily: MONO,
                            color: "#7A6858",
                            flex: 1,
                          }}
                        >
                          {file.name}
                        </span>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-lg"
                          style={{
                            fontSize: "10px",
                            fontFamily: FONT,
                            color: "#C8532A",
                            background: "#FAE5D8",
                            border: "1px solid #F0C9B4",
                          }}
                        >
                          Stage
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Commit message */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "#FFFFFF",
                    border: "1.5px solid #EDE5D8",
                  }}
                >
                  <div
                    className="px-4 py-2"
                    style={{ borderBottom: "1px solid #F0E9DF" }}
                  >
                    <span
                      style={{
                        color: "#A08870",
                        fontSize: "11px",
                        fontFamily: FONT,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Commit Message
                    </span>
                  </div>
                  <textarea
                    placeholder="Describe your changes..."
                    className="w-full resize-none outline-none p-4"
                    rows={3}
                    style={{
                      background: "transparent",
                      color: "#2C1F12",
                      fontSize: "13px",
                      fontFamily: FONT,
                    }}
                  />
                  <div
                    className="px-4 py-3 flex justify-end"
                    style={{ borderTop: "1px solid #F0E9DF" }}
                  >
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors"
                      style={{
                        background: "#FAE5D8",
                        border: "1.5px solid #F0C9B4",
                        color: "#C8532A",
                        fontSize: "12px",
                        fontFamily: FONT,
                        fontWeight: 500,
                      }}
                    >
                      <GitCommit style={{ width: "13px", height: "13px" }} />
                      Commit to main
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Branches + History */}
              <div style={{ width: "230px", flexShrink: 0 }}>
                {/* Branches */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <GitMerge style={{ width: "13px", height: "13px", color: "#B5A08A" }} />
                    <span
                      style={{
                        color: "#A08870",
                        fontSize: "11px",
                        fontFamily: FONT,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Branches
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      { name: "main", active: true, ahead: 2, behind: 0 },
                      { name: "feature/intro-rewrite", active: false, ahead: 3, behind: 1 },
                      { name: "hotfix/eq-numbering", active: false, ahead: 1, behind: 0 },
                    ].map((branch) => (
                      <button
                        key={branch.name}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all"
                        style={{
                          background: branch.active ? "#FAE5D8" : "#FFFFFF",
                          border: `1.5px solid ${branch.active ? "#F0C9B4" : "#EDE5D8"}`,
                        }}
                      >
                        <GitBranch
                          style={{
                            width: "12px",
                            height: "12px",
                            color: branch.active ? "#C8532A" : "#C8BEB0",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "11px",
                            fontFamily: MONO,
                            color: branch.active ? "#C8532A" : "#7A6858",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {branch.name}
                        </span>
                        {branch.active && (
                          <CheckCircle style={{ width: "11px", height: "11px", color: "#3D9A6A" }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commit History */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <GitCommit style={{ width: "13px", height: "13px", color: "#B5A08A" }} />
                    <span
                      style={{
                        color: "#A08870",
                        fontSize: "11px",
                        fontFamily: FONT,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      History
                    </span>
                  </div>
                  <div className="flex flex-col gap-0 relative">
                    <div
                      className="absolute"
                      style={{ left: "13px", top: "8px", bottom: "8px", width: "1px", background: "#E4D9CC" }}
                    />
                    {gitCommits.map((commit, i) => (
                      <button
                        key={commit.hash}
                        className="flex items-start gap-2.5 px-2 py-2 rounded-xl hover:bg-white/60 transition-colors text-left relative"
                      >
                        <div
                          className="rounded-full shrink-0 z-10"
                          style={{
                            width: "8px",
                            height: "8px",
                            background: i === 0 ? "#C8532A" : "#E8DDD0",
                            border: `2px solid ${i === 0 ? "#F0C9B4" : "#D4C8B8"}`,
                            marginTop: "3px",
                            flexShrink: 0,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            style={{
                              fontSize: "12px",
                              fontFamily: FONT,
                              color: "#5A4A3A",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {commit.message}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              style={{
                                fontSize: "10px",
                                fontFamily: MONO,
                                color: "#C8532A",
                              }}
                            >
                              {commit.hash}
                            </span>
                            <span style={{ fontSize: "10px", fontFamily: FONT, color: "#C8BEB0" }}>
                              {commit.date}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}