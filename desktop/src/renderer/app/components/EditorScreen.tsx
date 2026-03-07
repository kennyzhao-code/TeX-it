import { useState } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  X,
  ChevronDown,
  Play,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Info,
  CheckCircle,
  FolderOpen,
  Plus,
  BookOpen,
  Maximize2,
} from "lucide-react";

const FONT = "'NaN Jaune', 'Plus Jakarta Sans', -apple-system, sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', monospace";

const SAMPLE_LATEX = `\\documentclass[12pt]{article}

\\usepackage{amsmath, amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{\\textbf{On the Convergence of Gradient Descent\\\\
  in Non-Convex Optimization}}
\\author{Author Name\\\\
  Department of Computer Science\\\\
  University of Excellence}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
  We present a comprehensive analysis of gradient descent
  convergence in non-convex optimization landscapes. Our
  approach leverages recent advances in stochastic methods
  to establish novel convergence bounds.
\\end{abstract}

\\section{Introduction}

Consider the optimization problem:
\\begin{equation}
  \\min_{x \\in \\mathbb{R}^n} f(x)
  \\label{eq:opt}
\\end{equation}

where $f: \\mathbb{R}^n \\to \\mathbb{R}$ is smooth but
potentially non-convex. The gradient descent update is:

\\begin{equation}
  x_{t+1} = x_t - \\eta_t \\nabla f(x_t)
\\end{equation}

\\section{Main Results}

\\begin{theorem}[Convergence Rate]
  Let $f$ satisfy the $L$-smoothness condition. Under
  step size $\\eta = 1/L$, gradient descent satisfies:
  \\[
    \\frac{1}{T} \\sum_{t=0}^{T-1} \\|\\nabla f(x_t)\\|^2
    \\leq \\frac{2L(f(x_0) - f^*)}{T}
  \\]
\\end{theorem}

\\end{document}`;

type Token = { type: string; value: string };

// Light sepia LaTeX syntax colors
const TOKEN_COLORS: Record<string, string> = {
  command:  "#9B3FBE",   // purple
  math:     "#B07800",   // warm amber
  comment:  "#A8998A",   // muted warm grey
  brace:    "#2C6FAC",   // blue
  bracket:  "#2C6FAC",
  text:     "#3C2A18",   // dark brown text
  newline:  "#3C2A18",
};

function tokenizeLatex(code: string): Token[] {
  const tokens: Token[] = [];
  for (const line of code.split("\n")) {
    let i = 0;
    while (i < line.length) {
      if (line[i] === "%") {
        tokens.push({ type: "comment", value: line.slice(i) });
        i = line.length;
        continue;
      }
      if (line[i] === "\\") {
        let j = i + 1;
        while (j < line.length && /[a-zA-Z]/.test(line[j])) j++;
        if (j === i + 1 && j < line.length) j++;
        tokens.push({ type: "command", value: line.slice(i, j) });
        i = j;
        continue;
      }
      if (line[i] === "$") {
        let j = i + 1;
        const end = line.indexOf("$", j);
        j = end > -1 ? end + 1 : line.length;
        tokens.push({ type: "math", value: line.slice(i, j) });
        i = j;
        continue;
      }
      if (/[{}]/.test(line[i])) { tokens.push({ type: "brace", value: line[i] }); i++; continue; }
      if (/[\[\]]/.test(line[i])) { tokens.push({ type: "bracket", value: line[i] }); i++; continue; }
      let j = i;
      while (j < line.length && !"%\\${}[]".includes(line[j])) j++;
      tokens.push({ type: "text", value: line.slice(i, j) });
      i = j;
    }
    tokens.push({ type: "newline", value: "\n" });
  }
  return tokens;
}

export function EditorScreen() {
  const navigate = useNavigate();
  const [code] = useState(SAMPLE_LATEX);
  const [activeTab, setActiveTab] = useState("thesis_main.tex");
  const [zoom, setZoom] = useState(100);
  const [compiling, setCompiling] = useState(false);
  const [compiled, setCompiled] = useState(true);

  const openTabs = [
    { name: "thesis_main.tex", modified: true },
    { name: "chapter_03.tex", modified: false },
    { name: "bibliography.bib", modified: false },
  ];

  const lines = code.split("\n");
  const tokens = tokenizeLatex(code);

  const handleCompile = () => {
    setCompiling(true);
    setTimeout(() => { setCompiling(false); setCompiled(true); }, 1400);
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#F9F3EC" }}>
      {/* File Sidebar */}
      <div
        className="flex flex-col shrink-0"
        style={{
          width: "196px",
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
          <button className="hover:bg-black/5 rounded-lg p-0.5 transition-colors" style={{ color: "#A08870" }}>
            <Plus style={{ width: "12px", height: "12px" }} />
          </button>
        </div>
        <div className="overflow-auto flex-1 py-2 px-2">
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
            { name: "thesis_main.tex", active: true, modified: true },
            { name: "chapter_01.tex", active: false, modified: false },
            { name: "chapter_02.tex", active: false, modified: false },
            { name: "chapter_03.tex", active: false, modified: true },
            { name: "bibliography.bib", active: false, modified: true },
            { name: "figures/", isDir: true },
            { name: "appendix.tex", active: false, modified: false },
          ].map((file) => (
            <button
              key={file.name}
              className="w-full flex items-center gap-2 px-2 py-1 rounded-xl transition-all text-left"
              style={{
                background: file.active ? "#FAE5D8" : "transparent",
                border: file.active ? "1px solid #F0C9B4" : "1px solid transparent",
              }}
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
                  color: file.active ? "#C8532A" : file.modified ? "#D4800A" : "#7A6858",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div
          className="flex items-stretch shrink-0 overflow-x-auto"
          style={{
            background: "#F2EBE1",
            borderBottom: "1px solid #E4D9CC",
            height: "36px",
          }}
        >
          {openTabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className="flex items-center gap-2 px-4 shrink-0 relative group"
              style={{
                background: activeTab === tab.name ? "#F9F3EC" : "transparent",
                borderRight: "1px solid #E4D9CC",
                borderTop: activeTab === tab.name ? "2px solid #C8532A" : "2px solid transparent",
              }}
            >
              <FileText
                style={{
                  width: "11px",
                  height: "11px",
                  color: tab.modified ? "#D4800A" : "#C8BEB0",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: MONO,
                  color: activeTab === tab.name ? "#2C1F12" : "#A08870",
                }}
              >
                {tab.name}
              </span>
              {tab.modified && (
                <div
                  style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D4800A" }}
                />
              )}
              <X
                style={{ width: "10px", height: "10px", color: "#C8BEB0" }}
                className="group-hover:text-red-400 transition-colors"
              />
            </button>
          ))}
          <div className="flex-1" />
          {/* Compile button */}
          <div className="flex items-center px-3">
            <button
              onClick={handleCompile}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all"
              style={{
                background: compiling ? "#FAF0E8" : "#FAE5D8",
                border: "1.5px solid #F0C9B4",
                color: "#C8532A",
                fontSize: "12px",
                fontFamily: FONT,
                fontWeight: 500,
              }}
            >
              {compiling ? (
                <RefreshCw
                  style={{ width: "11px", height: "11px", animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Play style={{ width: "11px", height: "11px" }} />
              )}
              {compiling ? "Compiling…" : "Compile"}
            </button>
          </div>
        </div>

        {/* Editor + Preview Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor */}
          <div
            className="flex-1 overflow-auto"
            style={{ background: "#FEFCF8" }}
          >
            <div className="flex" style={{ minHeight: "100%" }}>
              {/* Line numbers */}
              <div
                className="shrink-0 text-right pr-4 pt-4 pb-4 select-none"
                style={{
                  width: "48px",
                  color: "#D4C8B0",
                  fontSize: "12px",
                  fontFamily: MONO,
                  lineHeight: "1.65",
                  background: "#FAF6F0",
                  borderRight: "1px solid #EDE5D8",
                }}
              >
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Code */}
              <div className="flex-1 pt-4 pb-4 pl-5 overflow-x-auto">
                <pre
                  style={{
                    fontSize: "12px",
                    fontFamily: MONO,
                    lineHeight: "1.65",
                    margin: 0,
                    whiteSpace: "pre",
                    color: "#3C2A18",
                  }}
                >
                  {tokens.map((token, i) =>
                    token.type === "newline" ? (
                      <br key={i} />
                    ) : (
                      <span key={i} style={{ color: TOKEN_COLORS[token.type] }}>
                        {token.value}
                      </span>
                    )
                  )}
                </pre>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: "1px", background: "#E4D9CC", flexShrink: 0 }} />

          {/* PDF Preview */}
          <div
            className="flex flex-col"
            style={{ width: "42%", background: "#F2EBE1" }}
          >
            {/* Preview toolbar */}
            <div
              className="flex items-center justify-between px-3 py-2 shrink-0"
              style={{
                borderBottom: "1px solid #E4D9CC",
                background: "#F2EBE1",
              }}
            >
              <div className="flex items-center gap-2">
                <BookOpen style={{ width: "12px", height: "12px", color: "#B5A08A" }} />
                <span style={{ fontSize: "11px", fontFamily: FONT, color: "#A08870" }}>
                  PDF Preview
                </span>
                {compiled && (
                  <CheckCircle style={{ width: "11px", height: "11px", color: "#3D9A6A" }} />
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="p-1 rounded-lg hover:bg-black/5 transition-colors"
                  style={{ color: "#B5A08A" }}
                >
                  <ZoomOut style={{ width: "12px", height: "12px" }} />
                </button>
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: FONT,
                    color: "#A08870",
                    width: "36px",
                    textAlign: "center",
                  }}
                >
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  className="p-1 rounded-lg hover:bg-black/5 transition-colors"
                  style={{ color: "#B5A08A" }}
                >
                  <ZoomIn style={{ width: "12px", height: "12px" }} />
                </button>
                <button
                  className="p-1 rounded-lg hover:bg-black/5 transition-colors ml-1"
                  style={{ color: "#B5A08A" }}
                >
                  <Maximize2 style={{ width: "12px", height: "12px" }} />
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-auto p-5 flex justify-center">
              <div
                className="shadow-md rounded-sm overflow-hidden"
                style={{
                  width: `${zoom}%`,
                  maxWidth: "560px",
                  minWidth: "260px",
                  background: "#FEFCFA",
                  padding: "44px 48px",
                  color: "#1a1a1a",
                  border: "1px solid #E8E0D4",
                }}
              >
                {/* Mock PDF */}
                <div className="text-center mb-5">
                  <h2
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "14px",
                      color: "#1a1a1a",
                      lineHeight: 1.4,
                      marginBottom: "8px",
                    }}
                  >
                    On the Convergence of Gradient Descent in Non-Convex Optimization
                  </h2>
                  <p style={{ fontSize: "11px", color: "#4a4a4a", marginBottom: "2px" }}>Author Name</p>
                  <p style={{ fontSize: "10px", color: "#6a6a6a" }}>Department of Computer Science · University of Excellence</p>
                  <p style={{ fontSize: "10px", color: "#6a6a6a", marginTop: "3px" }}>March 7, 2026</p>
                </div>

                <div style={{ borderTop: "0.5px solid #ccc", paddingTop: "10px", marginBottom: "10px" }}>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: "10px", color: "#1a1a1a", marginBottom: "4px", fontVariant: "small-caps" }}>Abstract</p>
                  <p style={{ fontSize: "9.5px", color: "#3a3a3a", lineHeight: "1.55", textAlign: "justify" }}>
                    We present a comprehensive analysis of gradient descent convergence in non-convex
                    optimization landscapes. Our approach leverages recent advances in stochastic methods
                    to establish novel convergence bounds.
                  </p>
                </div>

                <div style={{ borderTop: "0.5px solid #ccc", paddingTop: "9px" }}>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: "11px", marginBottom: "5px", color: "#1a1a1a", fontWeight: 600 }}>
                    1. Introduction
                  </p>
                  <p style={{ fontSize: "9.5px", color: "#3a3a3a", lineHeight: "1.6", textAlign: "justify" }}>
                    Consider the optimization problem:
                  </p>
                  <div className="my-2.5 text-center" style={{ fontSize: "11px", fontFamily: "Georgia, serif", color: "#1a1a1a" }}>
                    min<sub>x∈ℝⁿ</sub> f(x) &nbsp;&nbsp;&nbsp; (1)
                  </div>
                  <p style={{ fontSize: "9.5px", color: "#3a3a3a", lineHeight: "1.6", textAlign: "justify" }}>
                    where f: ℝⁿ → ℝ is a smooth but potentially non-convex function. The gradient
                    descent update rule is defined as:
                  </p>
                  <div className="my-2.5 text-center" style={{ fontSize: "11px", fontFamily: "Georgia, serif", color: "#1a1a1a" }}>
                    x<sub>t+1</sub> = x<sub>t</sub> − η<sub>t</sub>∇f(x<sub>t</sub>) &nbsp;&nbsp;&nbsp; (2)
                  </div>
                </div>

                <div style={{ borderTop: "0.5px solid #ccc", paddingTop: "9px" }}>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: "11px", marginBottom: "5px", color: "#1a1a1a", fontWeight: 600 }}>
                    2. Main Results
                  </p>
                  <div
                    className="p-3 rounded-sm"
                    style={{ background: "#F5F0E8", border: "0.5px solid #DDD5C0" }}
                  >
                    <p style={{ fontSize: "9.5px", color: "#1a1a1a", fontStyle: "italic", lineHeight: 1.5 }}>
                      <strong>Theorem 1</strong> (Convergence Rate). Let f satisfy the L-smoothness
                      condition. Under step size η = 1/L, gradient descent satisfies...
                    </p>
                  </div>
                </div>

                <div className="text-center mt-7">
                  <span style={{ fontSize: "10px", color: "#9a9a9a" }}>1</span>
                </div>
              </div>
            </div>

            {/* Diagnostics */}
            <div
              className="shrink-0 px-3 py-1.5 flex items-center gap-3"
              style={{ borderTop: "1px solid #E4D9CC", background: "#EDE5D8" }}
            >
              <div className="flex items-center gap-1">
                <AlertTriangle style={{ width: "11px", height: "11px", color: "#D4800A" }} />
                <span style={{ fontSize: "11px", fontFamily: FONT, color: "#A08870" }}>0 warnings</span>
              </div>
              <div className="flex items-center gap-1">
                <Info style={{ width: "11px", height: "11px", color: "#B5A08A" }} />
                <span style={{ fontSize: "11px", fontFamily: FONT, color: "#A08870" }}>2 info</span>
              </div>
              <div className="flex-1" />
              <span style={{ fontSize: "11px", fontFamily: FONT, color: "#3D9A6A", fontWeight: 500 }}>
                ✓ Build successful — 0.84s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
