import { useState } from "react";
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Plus,
  RefreshCw,
  CloudUpload,
  CloudDownload,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  ChevronRight,
  Terminal,
  Search,
  Tag,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
} from "lucide-react";

const FONT = "'NaN Jaune', 'Plus Jakarta Sans', -apple-system, sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', monospace";

const commits = [
  { hash: "a4f2c8e", message: "Fix equation numbering in Chapter 3", author: "Alex Chen", date: "2 hours ago", branch: "main", tags: [] },
  { hash: "9d31b7f", message: "Add bibliography entries for related work", author: "Alex Chen", date: "Yesterday", branch: "main", tags: ["v0.9"] },
  { hash: "e82a1c4", message: "Restructure introduction section", author: "Alex Chen", date: "3 days ago", branch: "feature/intro-rewrite", tags: [] },
  { hash: "c61f903", message: "Add abstract and keywords", author: "Alex Chen", date: "5 days ago", branch: "main", tags: [] },
  { hash: "f7b2d45", message: "Initial thesis structure", author: "Alex Chen", date: "1 week ago", branch: "main", tags: ["v0.1"] },
];

const branches = [
  { name: "main", current: true, ahead: 2, behind: 0, lastCommit: "a4f2c8e", protected: true },
  { name: "feature/intro-rewrite", current: false, ahead: 3, behind: 1, lastCommit: "e82a1c4", protected: false },
  { name: "hotfix/eq-numbering", current: false, ahead: 1, behind: 0, lastCommit: "b23c541", protected: false },
  { name: "experiment/new-proof", current: false, ahead: 0, behind: 5, lastCommit: "d45e678", protected: false },
];

const diffLines = [
  { type: "context", content: "\\section{Introduction}", lineOld: 24, lineNew: 24 },
  { type: "context", content: "", lineOld: 25, lineNew: 25 },
  { type: "removed", content: "Consider the optimization problem:", lineOld: 26, lineNew: null },
  { type: "added", content: "We consider the following optimization problem:", lineOld: null, lineNew: 26 },
  { type: "context", content: "\\begin{equation}", lineOld: 27, lineNew: 27 },
  { type: "context", content: "  \\min_{x \\in \\mathbb{R}^n} f(x)", lineOld: 28, lineNew: 28 },
  { type: "removed", content: "\\end{equation}", lineOld: 29, lineNew: null },
  { type: "added", content: "\\end{equation} % Fixed label reference", lineOld: null, lineNew: 29 },
  { type: "context", content: "", lineOld: 30, lineNew: 30 },
];

export function VersionControlScreen() {
  const [activeSection, setActiveSection] = useState<"commits" | "branches" | "diff">("commits");
  const [selectedCommit, setSelectedCommit] = useState(commits[0]);
  const [commitMessage, setCommitMessage] = useState("");
  const [syncing, setSyncing] = useState(false);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#F9F3EC" }}>
      {/* Left Panel: Stage + Commit */}
      <div
        className="flex flex-col shrink-0"
        style={{
          width: "254px",
          background: "#F2EBE1",
          borderRight: "1px solid #E4D9CC",
        }}
      >
        {/* Repo header */}
        <div className="px-3 py-3" style={{ borderBottom: "1px solid #E4D9CC" }}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <GitBranch style={{ width: "13px", height: "13px", color: "#C8532A" }} />
              <span style={{ fontSize: "12px", fontFamily: MONO, color: "#C8532A" }}>main</span>
              <span
                className="rounded-full px-1.5"
                style={{
                  background: "#FAE5D8",
                  border: "1px solid #F0C9B4",
                  fontSize: "10px",
                  fontFamily: FONT,
                  color: "#C8532A",
                }}
              >
                ↑2
              </span>
            </div>
            <button
              onClick={() => { setSyncing(true); setTimeout(() => setSyncing(false), 1800); }}
              className="flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-black/5 transition-colors"
              style={{ fontSize: "11px", fontFamily: FONT, color: "#7A6858", border: "1.5px solid #E4D9CC" }}
            >
              <RefreshCw style={{ width: "11px", height: "11px", animation: syncing ? "spin 1s linear infinite" : "none" }} />
              Sync
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl transition-colors"
              style={{ background: "#FAFAF8", border: "1.5px solid #E4D9CC", fontSize: "12px", fontFamily: FONT, color: "#7A6858" }}
            >
              <CloudDownload style={{ width: "11px", height: "11px" }} />
              Pull
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl transition-colors"
              style={{ background: "#FAE5D8", border: "1.5px solid #F0C9B4", fontSize: "12px", fontFamily: FONT, color: "#C8532A", fontWeight: 500 }}
            >
              <CloudUpload style={{ width: "11px", height: "11px" }} />
              Push
            </button>
          </div>
        </div>

        {/* Changes */}
        <div className="px-3 py-2.5" style={{ borderBottom: "1px solid #E4D9CC" }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: "#A08870", fontSize: "10px", fontFamily: FONT, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Changes (4)
            </span>
            <button
              className="flex items-center gap-1 px-2 py-0.5 rounded-xl hover:bg-black/5 transition-colors"
              style={{ fontSize: "10px", fontFamily: FONT, color: "#C8532A", background: "#FAE5D8", border: "1px solid #F0C9B4" }}
            >
              <Plus style={{ width: "9px", height: "9px" }} />
              Stage All
            </button>
          </div>
          {[
            { name: "thesis_main.tex", status: "M", color: "#D4800A" },
            { name: "chapter_03.tex", status: "M", color: "#D4800A" },
            { name: "bibliography.bib", status: "M", color: "#D4800A" },
            { name: "figures/diagram_01.png", status: "A", color: "#3D9A6A" },
          ].map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/50 cursor-pointer group transition-colors"
              onClick={() => setActiveSection("diff")}
            >
              <span style={{ fontSize: "10px", fontFamily: MONO, color: file.color, width: "10px", flexShrink: 0, fontWeight: 700 }}>
                {file.status}
              </span>
              <span style={{ fontSize: "11px", fontFamily: MONO, color: "#7A6858", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {file.name}
              </span>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#C8532A" }}>
                <Plus style={{ width: "11px", height: "11px" }} />
              </button>
            </div>
          ))}
        </div>

        {/* Commit input */}
        <div className="px-3 py-2.5 flex-1 flex flex-col">
          <span style={{ color: "#A08870", fontSize: "10px", fontFamily: FONT, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            Commit
          </span>
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Summary (required)"
            rows={2}
            className="w-full resize-none outline-none rounded-xl p-2.5 mb-2"
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #E4D9CC",
              color: "#2C1F12",
              fontSize: "12px",
              fontFamily: FONT,
            }}
          />
          <textarea
            placeholder="Description (optional)"
            rows={2}
            className="w-full resize-none outline-none rounded-xl p-2.5 mb-3"
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #E4D9CC",
              color: "#2C1F12",
              fontSize: "12px",
              fontFamily: FONT,
            }}
          />
          <button
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl transition-all"
            style={{
              background: commitMessage.trim() ? "#FAE5D8" : "#F2EBE1",
              border: `1.5px solid ${commitMessage.trim() ? "#F0C9B4" : "#E4D9CC"}`,
              color: commitMessage.trim() ? "#C8532A" : "#C8BEB0",
              fontSize: "12px",
              fontFamily: FONT,
              fontWeight: commitMessage.trim() ? 500 : 400,
            }}
          >
            <GitCommit style={{ width: "12px", height: "12px" }} />
            Commit to main
          </button>
        </div>
      </div>

      {/* Center: Nav + History */}
      <div
        className="flex flex-col shrink-0"
        style={{ width: "270px", borderRight: "1px solid #E4D9CC", background: "#F9F3EC" }}
      >
        {/* Section tabs */}
        <div
          className="flex p-2 gap-1 shrink-0"
          style={{ borderBottom: "1px solid #E4D9CC", background: "#F2EBE1" }}
        >
          {(
            [
              { id: "commits", label: "Commits", icon: GitCommit },
              { id: "branches", label: "Branches", icon: GitBranch },
              { id: "diff", label: "Diff", icon: FileText },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl transition-all"
              style={{
                fontSize: "11px",
                fontFamily: FONT,
                fontWeight: activeSection === id ? 500 : 400,
                color: activeSection === id ? "#2C1F12" : "#A08870",
                background: activeSection === id ? "#FFFFFF" : "transparent",
                border: activeSection === id ? "1.5px solid #EDE5D8" : "1.5px solid transparent",
                boxShadow: activeSection === id ? "0 1px 4px rgba(44,31,18,0.07)" : "none",
              }}
            >
              <Icon style={{ width: "11px", height: "11px" }} />
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          className="px-3 py-2 flex items-center gap-2 shrink-0"
          style={{ borderBottom: "1px solid #E4D9CC" }}
        >
          <Search style={{ width: "12px", height: "12px", color: "#C8BEB0" }} />
          <input
            placeholder={`Search ${activeSection}…`}
            className="flex-1 outline-none bg-transparent"
            style={{ fontSize: "12px", fontFamily: FONT, color: "#7A6858" }}
          />
        </div>

        {/* Commits */}
        <div className="flex-1 overflow-auto">
          {activeSection === "commits" && (
            <div className="py-2 relative">
              <div
                className="absolute"
                style={{ left: "27px", top: 0, bottom: 0, width: "1px", background: "#E4D9CC" }}
              />
              {commits.map((commit, i) => (
                <button
                  key={commit.hash}
                  onClick={() => setSelectedCommit(commit)}
                  className="w-full flex items-start gap-3 px-4 py-2.5 text-left transition-all"
                  style={{
                    background: selectedCommit.hash === commit.hash ? "#FFFFFF" : "transparent",
                    borderRight: selectedCommit.hash === commit.hash ? "2px solid #C8532A" : "2px solid transparent",
                  }}
                >
                  <div
                    className="rounded-full shrink-0 z-10"
                    style={{
                      width: "8px",
                      height: "8px",
                      background: i === 0 ? "#C8532A" : "#E4D9CC",
                      border: `2px solid ${i === 0 ? "#F0C9B4" : "#D4C8B8"}`,
                      marginTop: "4px",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      style={{
                        fontSize: "12px",
                        fontFamily: FONT,
                        color: "#3C2A18",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {commit.message}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span style={{ fontSize: "10px", fontFamily: MONO, color: "#C8532A" }}>
                        {commit.hash}
                      </span>
                      {commit.branch !== "main" && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontFamily: FONT,
                            color: "#3D9A6A",
                            background: "#DDF2E8",
                            border: "1px solid #BDE5CF",
                            borderRadius: "99px",
                            padding: "0px 6px",
                          }}
                        >
                          {commit.branch}
                        </span>
                      )}
                      {commit.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: "10px",
                            fontFamily: FONT,
                            color: "#D4800A",
                            background: "#FEF0DC",
                            border: "1px solid #F0D4A0",
                            borderRadius: "99px",
                            padding: "0px 6px",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      <span style={{ fontSize: "10px", fontFamily: FONT, color: "#C8BEB0" }}>
                        {commit.date}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Branches */}
          {activeSection === "branches" && (
            <div className="py-2 px-2">
              <div className="flex items-center justify-between px-2 mb-2 mt-1">
                <span style={{ color: "#A08870", fontSize: "10px", fontFamily: FONT, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Local
                </span>
                <button
                  className="flex items-center gap-1 px-2 py-0.5 rounded-xl transition-colors"
                  style={{ fontSize: "10px", fontFamily: FONT, color: "#C8532A", background: "#FAE5D8", border: "1px solid #F0C9B4" }}
                >
                  <Plus style={{ width: "10px", height: "10px" }} />
                  New
                </button>
              </div>
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/60 transition-all cursor-pointer group mb-1"
                  style={{
                    background: branch.current ? "#FAE5D8" : "transparent",
                    border: branch.current ? "1.5px solid #F0C9B4" : "1.5px solid transparent",
                  }}
                >
                  <GitBranch
                    style={{
                      width: "12px",
                      height: "12px",
                      color: branch.current ? "#C8532A" : "#C8BEB0",
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{
                          fontSize: "12px",
                          fontFamily: MONO,
                          color: branch.current ? "#C8532A" : "#7A6858",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {branch.name}
                      </span>
                      {branch.protected && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontFamily: FONT,
                            color: "#D4800A",
                            background: "#FEF0DC",
                            border: "1px solid #F0D4A0",
                            borderRadius: "99px",
                            padding: "0 5px",
                          }}
                        >
                          protected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {branch.ahead > 0 && (
                        <span style={{ fontSize: "10px", fontFamily: FONT, color: "#3D9A6A" }}>↑{branch.ahead}</span>
                      )}
                      {branch.behind > 0 && (
                        <span style={{ fontSize: "10px", fontFamily: FONT, color: "#D4800A" }}>↓{branch.behind}</span>
                      )}
                    </div>
                  </div>
                  {branch.current && (
                    <CheckCircle style={{ width: "11px", height: "11px", color: "#3D9A6A" }} />
                  )}
                  {!branch.current && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded-lg hover:bg-black/5" style={{ color: "#C8BEB0" }}>
                        <Trash2 style={{ width: "10px", height: "10px" }} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div className="px-2 mt-4 mb-2">
                <span style={{ color: "#A08870", fontSize: "10px", fontFamily: FONT, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Tags
                </span>
              </div>
              {[
                { name: "v0.9", date: "Yesterday" },
                { name: "v0.1", date: "1 week ago" },
              ].map((tag) => (
                <div
                  key={tag.name}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer mb-1"
                >
                  <Tag style={{ width: "12px", height: "12px", color: "#D4800A", flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontFamily: MONO, color: "#7A6858", flex: 1 }}>{tag.name}</span>
                  <span style={{ fontSize: "10px", fontFamily: FONT, color: "#C8BEB0" }}>{tag.date}</span>
                </div>
              ))}
            </div>
          )}

          {/* Diff */}
          {activeSection === "diff" && (
            <div className="py-3 px-3">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                style={{ background: "#FFFFFF", border: "1.5px solid #EDE5D8" }}
              >
                <FileText style={{ width: "12px", height: "12px", color: "#B5A08A" }} />
                <span style={{ fontSize: "11px", fontFamily: MONO, color: "#7A6858", flex: 1 }}>chapter_03.tex</span>
                <span style={{ fontSize: "10px", fontFamily: FONT, color: "#D4800A", fontWeight: 600 }}>M</span>
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "#FFFFFF", border: "1.5px solid #EDE5D8" }}
              >
                <div
                  className="px-3 py-2 flex items-center justify-between"
                  style={{ background: "#FAF5EF", borderBottom: "1px solid #EDE5D8" }}
                >
                  <span style={{ fontSize: "10px", fontFamily: MONO, color: "#A08870" }}>@@ -24,8 +24,8 @@</span>
                  <div className="flex gap-2">
                    <span style={{ fontSize: "10px", fontFamily: FONT, color: "#D04040" }}>-2</span>
                    <span style={{ fontSize: "10px", fontFamily: FONT, color: "#3D9A6A" }}>+2</span>
                  </div>
                </div>
                {diffLines.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-start"
                    style={{
                      background:
                        line.type === "added"
                          ? "#F0FBF4"
                          : line.type === "removed"
                          ? "#FEF5F5"
                          : "transparent",
                    }}
                  >
                    <div style={{ width: "28px", fontSize: "9px", fontFamily: MONO, color: line.type === "removed" ? "#D04040" : "#C8BEB0", padding: "2px 4px", flexShrink: 0, textAlign: "right" }}>
                      {line.lineOld ?? ""}
                    </div>
                    <div style={{ width: "28px", fontSize: "9px", fontFamily: MONO, color: line.type === "added" ? "#3D9A6A" : "#C8BEB0", padding: "2px 4px", flexShrink: 0, textAlign: "right" }}>
                      {line.lineNew ?? ""}
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontFamily: MONO,
                        color: line.type === "added" ? "#2E7D52" : line.type === "removed" ? "#B03030" : "#7A6858",
                        padding: "2px 4px",
                      }}
                    >
                      {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
                      {line.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Commit Detail */}
      <div className="flex-1 overflow-auto" style={{ background: "#F9F3EC" }}>
        {selectedCommit && (
          <div className="p-7">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-3">
                <h2
                  style={{
                    fontFamily: FONT,
                    fontSize: "20px",
                    color: "#2C1F12",
                    lineHeight: 1.3,
                    fontWeight: 600,
                    maxWidth: "460px",
                  }}
                >
                  {selectedCommit.message}
                </h2>
                <button className="p-1.5 rounded-xl hover:bg-black/5 transition-colors" style={{ color: "#B5A08A" }}>
                  <MoreHorizontal style={{ width: "14px", height: "14px" }} />
                </button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-xl flex items-center justify-center"
                    style={{
                      width: "26px",
                      height: "26px",
                      background: "#FAE5D8",
                      border: "1.5px solid #F0C9B4",
                      color: "#C8532A",
                      fontFamily: FONT,
                      fontSize: "10px",
                      fontWeight: 600,
                    }}
                  >
                    AC
                  </div>
                  <span style={{ fontSize: "12px", fontFamily: FONT, color: "#7A6858" }}>
                    {selectedCommit.author}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontFamily: MONO,
                    color: "#C8532A",
                    background: "#FAE5D8",
                    border: "1.5px solid #F0C9B4",
                    borderRadius: "99px",
                    padding: "2px 10px",
                  }}
                >
                  {selectedCommit.hash}
                </span>
                <div className="flex items-center gap-1.5">
                  <Clock style={{ width: "11px", height: "11px", color: "#C8BEB0" }} />
                  <span style={{ fontSize: "12px", fontFamily: FONT, color: "#A08870" }}>{selectedCommit.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <GitBranch style={{ width: "11px", height: "11px", color: "#C8BEB0" }} />
                  <span style={{ fontSize: "12px", fontFamily: FONT, color: "#A08870" }}>{selectedCommit.branch}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Files Changed", value: "3", icon: FileText, color: "#C8532A", bg: "#FAE5D8", border: "#F0C9B4" },
                { label: "Insertions", value: "+12", icon: ArrowUpRight, color: "#3D9A6A", bg: "#DDF2E8", border: "#BDE5CF" },
                { label: "Deletions", value: "-7", icon: ArrowDownLeft, color: "#D04040", bg: "#FDEAEA", border: "#F5C8C8" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-4"
                  style={{
                    background: "#FFFFFF",
                    border: "1.5px solid #EDE5D8",
                    boxShadow: "0 1px 4px rgba(44,31,18,0.05)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="rounded-xl flex items-center justify-center"
                      style={{ width: "24px", height: "24px", background: stat.bg, border: `1px solid ${stat.border}` }}
                    >
                      <stat.icon style={{ width: "12px", height: "12px", color: stat.color }} />
                    </div>
                    <span style={{ fontSize: "11px", fontFamily: FONT, color: "#A08870" }}>{stat.label}</span>
                  </div>
                  <span style={{ fontSize: "22px", fontFamily: FONT, color: stat.color, fontWeight: 600 }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Files in commit */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText style={{ width: "13px", height: "13px", color: "#B5A08A" }} />
                <span style={{ color: "#A08870", fontSize: "11px", fontFamily: FONT, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Files in this commit
                </span>
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "#FFFFFF", border: "1.5px solid #EDE5D8" }}
              >
                {[
                  { name: "thesis_main.tex", added: 8, removed: 5 },
                  { name: "chapter_03.tex", added: 2, removed: 2 },
                  { name: "bibliography.bib", added: 2, removed: 0 },
                ].map((file, i, arr) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAF5EF] transition-colors cursor-pointer"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #F0E9DF" : "none" }}
                  >
                    <span style={{ fontSize: "10px", fontFamily: FONT, fontWeight: 700, color: "#D4800A", width: "12px" }}>M</span>
                    <FileText style={{ width: "12px", height: "12px", color: "#C8BEB0" }} />
                    <span style={{ fontSize: "12px", fontFamily: MONO, color: "#5A4A3A", flex: 1 }}>
                      {file.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "11px", fontFamily: FONT, color: "#3D9A6A", fontWeight: 500 }}>+{file.added}</span>
                      <span style={{ fontSize: "11px", fontFamily: FONT, color: "#D04040", fontWeight: 500 }}>-{file.removed}</span>
                    </div>
                    <div className="w-20">
                      <div className="rounded-full overflow-hidden" style={{ height: "4px", background: "#EDE5D8" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(file.added / (file.added + file.removed || 1)) * 100}%`,
                            background: "linear-gradient(to right, #3D9A6A, #C8532A)",
                          }}
                        />
                      </div>
                    </div>
                    <ChevronRight style={{ width: "11px", height: "11px", color: "#C8BEB0" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal log */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Terminal style={{ width: "13px", height: "13px", color: "#B5A08A" }} />
                <span style={{ color: "#A08870", fontSize: "11px", fontFamily: FONT, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Git Output
                </span>
              </div>
              <div
                className="rounded-2xl p-4"
                style={{ background: "#2C1F12", border: "1.5px solid #3C2A18" }}
              >
                <div style={{ color: "#3D9A6A", fontSize: "11px", fontFamily: MONO }}>
                  $ git commit -m "Fix equation numbering in Chapter 3"
                </div>
                <div style={{ color: "#C8BEB0", fontSize: "11px", fontFamily: MONO, marginTop: "6px" }}>
                  [main a4f2c8e] Fix equation numbering in Chapter 3
                </div>
                <div style={{ color: "#C8BEB0", fontSize: "11px", fontFamily: MONO }}>
                  {" "}3 files changed, 12 insertions(+), 7 deletions(-)
                </div>
                <div style={{ color: "#C8BEB0", fontSize: "11px", fontFamily: MONO }}>
                  {" "}modify thesis_main.tex
                </div>
                <div style={{ color: "#C8BEB0", fontSize: "11px", fontFamily: MONO }}>
                  {" "}modify chapter_03.tex
                </div>
                <div style={{ color: "#F0C9B4", fontSize: "11px", fontFamily: MONO, marginTop: "8px" }}>$ _</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
