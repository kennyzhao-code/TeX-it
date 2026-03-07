import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    api: {
      compileDocument: (filePath: string) => Promise<{ data?: string; error?: string }>;
      openDirectory: () => Promise<{ canceled: boolean; path?: string; files?: any[]; error?: string }>;
      createProjectFolder: () => Promise<{ canceled: boolean; path?: string; files?: any[]; error?: string }>;
      readDirectory: (dirPath: string) => Promise<{ files?: any[]; error?: string }>;
      readFile: (filePath: string) => Promise<{ content?: string; error?: string }>;
      saveFile: (filePath: string, content: string) => Promise<{ success?: boolean; error?: string }>;
      createItem: (dirPath: string, name: string, isDir: boolean) => Promise<{ success?: boolean; path?: string; error?: string }>;
      renameItem: (oldPath: string, newName: string) => Promise<{ success?: boolean; newPath?: string; error?: string }>;
      deleteItem: (itemPath: string) => Promise<{ success?: boolean; error?: string }>;
      openAskBox: (code: string) => Promise<void>;
      askGeminiEdit: (payload: { prompt: string, content: string }) => Promise<{ content?: string; error?: string }>;
      sendProposal: (newCode: string) => Promise<{ success: boolean }>;
      onInitAskBox: (cb: (code: string) => void) => void;
      onProposalReceived: (cb: (code: string) => void) => void;
      getDeepgramKey: () => Promise<{ key?: string; error?: string }>;
      getEditorCode: () => Promise<{ code?: string }>;
      imageToLatex: (payload: { imageBase64: string, mimeType: string, fileName: string }) => Promise<{ content?: string; error?: string }>;
    };
  }
}
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
  ImagePlus,
  GitBranch,
  GitCommit,
  Upload,
  Image,
  File,
  Mic,
  Sparkles,
  Bot,
  Send,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2,
  Check,
  Loader2
} from "lucide-react";

import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

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
  command: "#9B3FBE",   // purple
  math: "#B07800",   // warm amber
  comment: "#A8998A",   // muted warm grey
  brace: "#2C6FAC",   // blue
  bracket: "#2C6FAC",
  text: "#3C2A18",   // dark brown text
  newline: "#3C2A18",
};

function tokenizeLatex(code: string): Token[][] {
  const lines: Token[][] = [];
  const rawLines = code.split("\n");
  for (const lineText of rawLines) {
    const tokens: Token[] = [];
    let i = 0;
    while (i < lineText.length) {
      if (lineText[i] === "%") {
        tokens.push({ type: "comment", value: lineText.slice(i) });
        i = lineText.length;
        continue;
      }
      if (lineText[i] === "\\") {
        let j = i + 1;
        while (j < lineText.length && /[a-zA-Z]/.test(lineText[j])) j++;
        if (j === i + 1 && j < lineText.length) j++;
        tokens.push({ type: "command", value: lineText.slice(i, j) });
        i = j;
        continue;
      }
      if (lineText[i] === "$") {
        let j = i + 1;
        const end = lineText.indexOf("$", j);
        j = end > -1 ? end + 1 : lineText.length;
        tokens.push({ type: "math", value: lineText.slice(i, j) });
        i = j;
        continue;
      }
      if (/[{}]/.test(lineText[i])) { tokens.push({ type: "brace", value: lineText[i] }); i++; continue; }
      if (/[\[\]]/.test(lineText[i])) { tokens.push({ type: "bracket", value: lineText[i] }); i++; continue; }
      let j = i;
      while (j < lineText.length && !"%\\${}[]".includes(lineText[j])) j++;
      tokens.push({ type: "text", value: lineText.slice(i, j) });
      i = j;
    }
    lines.push(tokens);
  }
  return lines;
}

/* ─────────── File tree data ─────────── */
type FileEntry = {
  name: string;
  isDir: boolean;
  path: string;
};

type UploadStatus = "uploading" | "success" | "error";

type UploadedFile = {
  id: string;
  name: string;
  isImage: boolean;
  status: UploadStatus;
  error?: string;
};

/* ─────────── Assets data ─────────── */
const assetFiles: { name: string; type: string }[] = [
  { name: "diagram_01.png", type: "image" },
  { name: "graph_results.svg", type: "image" },
  { name: "logo.pdf", type: "pdf" },
];

/* ─────────── Git data for Version Control tab ─────────── */
const changedFiles = [
  { name: "thesis_main.tex", status: "M" as const, color: "#D4800A" },
  { name: "chapter_03.tex", status: "M" as const, color: "#D4800A" },
  { name: "bibliography.bib", status: "M" as const, color: "#D4800A" },
  { name: "figures/diagram_01.png", status: "A" as const, color: "#3D9A6A" },
];

const recentCommits = [
  { hash: "a4f2c8e", message: "Fix equation numbering in Ch. 3", date: "2h ago" },
  { hash: "9d31b7f", message: "Add bibliography entries", date: "Yesterday" },
  { hash: "e82a1c4", message: "Restructure introduction", date: "3 days ago" },
];

export function EditorScreen() {
  const [currentDir, setCurrentDir] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);
  const [openTabs, setOpenTabs] = useState<{ name: string, path: string, modified: boolean }[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState<{ path: string, x: number, y: number } | null>(null); // tracks target dir for + menu
  const [isCreatingItem, setIsCreatingItem] = useState<{ isDir: boolean, targetDir: string } | null>(null);
  const [newItemName, setNewItemName] = useState("");

  // Nested Tree State
  const [folderContents, setFolderContents] = useState<Record<string, FileEntry[]>>({});
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileEntry } | null>(null);
  const [renamingFile, setRenamingFile] = useState<FileEntry | null>(null);
  const [renameInput, setRenameInput] = useState("");

  const [code, setCode] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const [diffMode, setDiffMode] = useState(false);
  const [proposedCode, setProposedCode] = useState("");

  useEffect(() => {
    if (window.api) {
      window.api.onProposalReceived((newCode: string) => {
        setProposedCode(newCode);
        setDiffMode(true);
      });
    }
  }, []);

  // Sync scroll between textarea and highlighted pre
  const handleEditorScroll = useCallback(() => {
    const ta = textareaRef.current;
    const container = editorContainerRef.current;
    const lineNums = lineNumbersRef.current;
    if (!ta || !container) return;
    const pre = container.querySelector("pre");
    if (pre) {
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
    }
    if (lineNums) {
      lineNums.scrollTop = ta.scrollTop;
    }
  }, []);
  const [pdfData, setPdfData] = useState<string | null>(null);

  const [zoom, setZoom] = useState(100);
  const [compiling, setCompiling] = useState(false);
  const [compiled, setCompiled] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"files" | "vcs">("files");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenFolder = async () => {
    if (!window.api) return;
    const result = await window.api.openDirectory();
    if (result.canceled) return;
    if (result.error) {
      toast.error("Failed to open folder", { description: result.error });
      return;
    }
    if (result.path && result.files) {
      setCurrentDir(result.path);
      setFileTree(result.files);
      setFolderContents({ [result.path]: result.files });
      setExpandedFolders(new Set());
      setOpenTabs([]);
      setActiveTabPath(null);
      setCode("");
    }
  };

  const handleCreateProjectFolder = async () => {
    if (!window.api?.createProjectFolder) return;
    const result = await window.api.createProjectFolder();
    if (result.canceled) return;
    if (result.error) {
      toast.error("Failed to create folder", { description: result.error });
      return;
    }
    if (result.path && result.files) {
      setCurrentDir(result.path);
      setFileTree(result.files);
      setFolderContents({ [result.path]: result.files });
      setExpandedFolders(new Set());
      setOpenTabs([]);
      setActiveTabPath(null);
      setCode("");
    }
  };

  const refreshWorkspace = async () => {
    if (!window.api || !currentDir) return;
    const res = await window.api.readDirectory(currentDir);
    if (!res.error && res.files) {
      setFileTree(res.files);
    }
    const newContents = { ...folderContents };
    for (const dir of Array.from(expandedFolders)) {
      const subRes = await window.api.readDirectory(dir);
      if (!subRes.error && subRes.files) {
        newContents[dir] = subRes.files;
      }
    }
    setFolderContents(newContents);
  };

  const handleToggleFolder = async (file: FileEntry) => {
    if (!file.isDir || !window.api) return;

    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(file.path)) {
      newExpanded.delete(file.path);
      setExpandedFolders(newExpanded);
    } else {
      newExpanded.add(file.path);
      setExpandedFolders(newExpanded);

      if (!folderContents[file.path]) {
        const res = await window.api.readDirectory(file.path);
        if (res.error) {
          toast.error("Failed to read folder", { description: res.error });
        } else if (res.files) {
          setFolderContents(prev => ({ ...prev, [file.path]: res.files! }));
        }
      }
    }
  };

  const handleOpenFile = async (file: FileEntry) => {
    if (file.isDir) return;
    if (!window.api) return;

    if (!openTabs.find(t => t.path === file.path)) {
      setOpenTabs([...openTabs, { name: file.name, path: file.path, modified: false }]);
    }

    setActiveTabPath(file.path);

    const result = await window.api.readFile(file.path);
    if (result.error) {
      toast.error("Failed to read file", { description: result.error });
    } else if (result.content !== undefined) {
      setCode(result.content);
      setOpenTabs(tabs => tabs.map(t => t.path === file.path ? { ...t, modified: false } : t));
    }
  };

  const handleSaveFile = useCallback(async () => {
    if (!activeTabPath || !window.api) return;

    const result = await window.api.saveFile(activeTabPath, code);
    if (result.error) {
      toast.error("Failed to save file", { description: result.error });
      return;
    }
    toast.success("File saved!");
    setOpenTabs(tabs => tabs.map(t => t.path === activeTabPath ? { ...t, modified: false } : t));
  }, [activeTabPath, code]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };
    const handleMenuClick = () => handleOpenFolder();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-folder-menu-click', handleMenuClick);
    window.addEventListener('create-folder-menu-click', handleCreateProjectFolder);
    const handleGlobalClick = () => {
      setContextMenu(null);
      setCreateMenuOpen(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-folder-menu-click', handleMenuClick);
      window.removeEventListener('create-folder-menu-click', handleCreateProjectFolder);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [handleSaveFile]);

  const handleCreateItemInit = (isDir: boolean, targetDir: string) => {
    setIsCreatingItem({ isDir, targetDir });
    setNewItemName("");
    setCreateMenuOpen(null);
    if (!expandedFolders.has(targetDir)) {
      const newExpanded = new Set(expandedFolders);
      newExpanded.add(targetDir);
      setExpandedFolders(newExpanded);
    }
  };

  const handleCreateItemSubmit = async () => {
    if (!currentDir || !window.api || !isCreatingItem) return;

    let name = newItemName.trim();
    if (!name) {
      setIsCreatingItem(null);
      return;
    }

    if (!isCreatingItem.isDir && !name.includes(".")) {
      name += ".tex";
    }

    const result = await window.api.createItem(isCreatingItem.targetDir, name, isCreatingItem.isDir);
    if (result.error) {
      toast.error("Failed to create", { description: result.error });
    } else {
      toast.success(`${isCreatingItem.isDir ? 'Folder' : 'File'} created!`);
      const newFile: FileEntry = { name, isDir: isCreatingItem.isDir, path: result.path! };

      // Update folderContents for the targeted directory
      setFolderContents(prev => {
        const list = prev[isCreatingItem.targetDir] || [];
        const newList = [...list, newFile].sort((a, b) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name);
        });
        return { ...prev, [isCreatingItem.targetDir]: newList };
      });

      // Also update fileTree if we added to root
      if (isCreatingItem.targetDir === currentDir) {
        setFileTree(prev => {
          return [...prev, newFile].sort((a, b) => {
            if (a.isDir && !b.isDir) return -1;
            if (!a.isDir && b.isDir) return 1;
            return a.name.localeCompare(b.name);
          });
        });
      }
    }
    setIsCreatingItem(null);
    setNewItemName("");
  };

  const handleRenameSubmit = async () => {
    if (!window.api || !renamingFile || !renameInput.trim()) {
      setRenamingFile(null);
      return;
    }
    const newName = renameInput.trim();
    if (newName === renamingFile.name) {
      setRenamingFile(null);
      return;
    }

    const result = await window.api.renameItem(renamingFile.path, newName);
    if (result.error) {
      toast.error("Failed to rename", { description: result.error });
    } else if (result.newPath) {
      toast.success("Renamed successfully");
      if (currentDir) {
        queueMicrotask(() => refreshWorkspace());
      }
    }
    setRenamingFile(null);
  };

  const handleDeleteItem = async (file: FileEntry) => {
    if (!window.api) return;
    const result = await window.api.deleteItem(file.path);
    if (result.error) {
      toast.error("Failed to delete", { description: result.error });
    } else {
      toast.success("Deleted successfully");
      if (currentDir) queueMicrotask(() => refreshWorkspace());
      
      setOpenTabs(tabs => tabs.filter(t => t.path !== file.path && !t.path.startsWith(file.path + '/')));
      if (activeTabPath === file.path || (activeTabPath && activeTabPath.startsWith(file.path + '/'))) {
        setActiveTabPath(null);
        setCode("");
      }
    }
  };

  const linesOfTokens = tokenizeLatex(code);

  const handleCompile = async () => {
    if (!activeTabPath) {
      toast.error("No file selected", { description: "Please open a .tex file to compile." });
      return;
    }

    // Auto-save the file if it's modified since node-latex compiles from the physical file
    const tabState = openTabs.find(t => t.path === activeTabPath);
    if (tabState?.modified) {
      await handleSaveFile();
    }

    setCompiling(true);
    setCompiled(false);
    try {
      if (!window.api) {
        throw new Error("Electron API is not available (running in browser instead of desktop application).");
      }
      const result = await window.api.compileDocument(activeTabPath);
      if (result.error) {
        toast.error("LaTeX Compilation Failed", {
          description: result.error,
          duration: 10000,
        });
      } else if (result.data) {
        setPdfData(result.data);
        setCompiled(true);
        toast.success("Compiled successfully!");
      }
    } catch (e: any) {
      toast.error("IPC Error", { description: e.message || String(e) });
    } finally {
      setCompiling(false);
    }
  };

  const handleFileUploads = async (files: File[]) => {
    if (!files.length) return;

    // Add dummy entries so UI updates immediately
    const newUploads = files.map(file => {
      const isImage = file.type.startsWith("image/");
      return {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        isImage,
        status: (isImage ? "uploading" : "success") as UploadStatus
      };
    });

    setUploadedFiles(newUploads);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadState = newUploads[i];

      if (!uploadState.isImage) continue;

      try {
        if (!window.api || !currentDir) {
          throw new Error("Cannot process image: No folder opened or API unavailable.");
        }

        // Convert to base64
        const fileToBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });

        const dataUrl = await fileToBase64(file);
        const base64Str = dataUrl.split(",")[1];

        // Process with Gemini
        const result = await window.api.imageToLatex({
          imageBase64: base64Str,
          mimeType: file.type,
          fileName: file.name
        });

        if (result.error) throw new Error(result.error);
        if (!result.content) throw new Error("No LaTeX content returned");

        // Save as new .tex file
        const newFileName = file.name.split('.')[0] + '.tex';
        const createRes = await window.api.createItem(currentDir, newFileName, false);

        if (createRes.error) throw new Error("Failed to create file: " + createRes.error);
        if (!createRes.path) throw new Error("Creation returned no path.");

        const saveRes = await window.api.saveFile(createRes.path, result.content);
        if (saveRes.error) throw new Error("Failed to save content: " + saveRes.error);

        // Update successful status
        setUploadedFiles(prev => prev.map(u => u.id === uploadState.id ? { ...u, status: "success", name: newFileName } : u));

        // Refresh root folder efficiently (if inside a subdirectory we'd need to expand, but for now root refresh is enough)
        if (currentDir) refreshWorkspace();

      } catch (err: any) {
        setUploadedFiles(prev => prev.map(u => u.id === uploadState.id ? { ...u, status: "error", error: err.message || String(err) } : u));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUploads(files);
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#F9F3EC" }}>
      {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
      <div
        className="flex flex-col shrink-0"
        style={{
          width: "210px",
          background: "#F2EBE1",
          borderRight: "1px solid #E4D9CC",
        }}
      >
        {/* Sidebar header with pill toggle */}
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ borderBottom: "1px solid #E4D9CC" }}
        >
          {/* Files / Version Control pill toggle */}
          <div
            className="flex items-center p-0.5 rounded-xl gap-0.5"
            style={{ background: "#E8DDD0", border: "1px solid #DED3C4" }}
          >
            {([
              { id: "files" as const, label: "Files" },
              { id: "vcs" as const, label: "VCS" },
            ]).map(({ id, label }) => {
              const isActive = sidebarTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setSidebarTab(id)}
                  className="flex items-center gap-1.5 rounded-lg transition-all"
                  style={{
                    padding: "3px 10px",
                    background: isActive ? "#FFFFFF" : "transparent",
                    color: isActive ? "#C8532A" : "#A08870",
                    fontSize: "10px",
                    fontFamily: FONT,
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    boxShadow: isActive
                      ? "0 1px 3px rgba(44,31,18,0.10)"
                      : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {id === "vcs" && (
                    <GitBranch style={{ width: "10px", height: "10px", flexShrink: 0 }} />
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar content area */}
        <div className="overflow-auto flex-1">
          {/* ────── FILES TAB ────── */}
          {sidebarTab === "files" && (
            <div className="flex flex-col h-full">
              {/* File tree */}
              <div className="py-2 px-2 flex-1 relative">
                {!currentDir ? (
                  <div className="flex flex-col items-center justify-center p-4 gap-3 h-full text-center">
                    <button onClick={handleOpenFolder} className="px-4 py-2 w-full rounded-xl transition-colors font-medium text-xs shadow-sm hover:opacity-90 active:scale-95" style={{ background: "#C8532A", color: "#FFF" }}>
                      Open Folder
                    </button>
                    <button onClick={handleCreateProjectFolder} className="px-4 py-2 w-full rounded-xl transition-colors font-medium text-xs shadow-sm hover:opacity-90 active:scale-95" style={{ background: "transparent", color: "#C8532A", border: "1px solid #C8532A" }}>
                      Create New Folder
                    </button>
                    <span style={{ fontSize: "10px", color: "#A08870", fontFamily: FONT }}>No folder opened.</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-2 mb-1 group">
                      <div className="flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-70" onClick={handleOpenFolder} title="Click to open a different folder">
                        <FolderOpen style={{ width: "10px", height: "10px", color: "#C8532A" }} />
                        <span
                          style={{
                            color: "#C8532A",
                            fontSize: "10px",
                            fontFamily: FONT,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {currentDir?.split(/[/\\]/).pop() || "Project"}
                        </span>
                      </div>
                      <div className="relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (createMenuOpen?.path === currentDir) {
                              setCreateMenuOpen(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setCreateMenuOpen({ path: currentDir!, x: rect.left, y: rect.bottom });
                            }
                          }}
                          className="hover:bg-black/5 rounded-md p-0.5 transition-colors"
                          style={{ color: "#A08870" }}
                        >
                          <Plus style={{ width: "12px", height: "12px" }} />
                        </button>
                        {createMenuOpen && (
                          <div className="absolute top-full right-0 mt-1 w-32 rounded-lg shadow-lg py-1 z-50 overflow-hidden" style={{ background: "#FDFBF7", border: "1px solid #EAE0D5" }}>
                            <button
                              className="w-full text-left px-3 py-1.5 hover:bg-black/5 flex items-center gap-2 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCreateItemInit(false, createMenuOpen.path);
                              }}
                            >
                              <FileText style={{ width: "12px", height: "12px", color: "#C8BEB0" }} />
                              <span style={{ fontSize: "11px", color: "#7A6858", fontFamily: FONT }}>New File</span>
                            </button>
                            <button
                              className="w-full text-left px-3 py-1.5 hover:bg-black/5 flex items-center gap-2 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCreateItemInit(true, createMenuOpen.path);
                              }}
                            >
                              <FolderOpen style={{ width: "12px", height: "12px", color: "#C8532A" }} />
                              <span style={{ fontSize: "11px", color: "#7A6858", fontFamily: FONT }}>New Folder</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {fileTree.length === 0 && !isCreatingItem ? (
                      <div className="text-center py-4 opacity-60">
                        <span style={{ fontSize: "10px", color: "#A08870", fontFamily: FONT }}>Folder is empty</span>
                      </div>
                    ) : (
                      <>
                        {isCreatingItem?.targetDir === currentDir && (
                          <div
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl mt-0.5"
                            style={{ background: "#FAE5D8", border: "1px solid #F0C9B4" }}
                          >
                            {isCreatingItem.isDir ? (
                              <FolderOpen style={{ width: "12px", height: "12px", color: "#C8532A", flexShrink: 0 }} />
                            ) : (
                              <FileText style={{ width: "12px", height: "12px", color: "#C8BEB0", flexShrink: 0 }} />
                            )}
                            <input
                              autoFocus
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleCreateItemSubmit();
                                } else if (e.key === "Escape") {
                                  setIsCreatingItem(null);
                                  setNewItemName("");
                                }
                              }}
                              onBlur={() => {
                                setTimeout(handleCreateItemSubmit, 100);
                              }}
                              className="bg-transparent border-none outline-none w-full"
                              style={{
                                fontSize: "12px",
                                fontFamily: FONT,
                                color: "#C8532A",
                              }}
                              placeholder={isCreatingItem.isDir ? "Folder name..." : "file.tex"}
                            />
                          </div>
                        )}
                        {(() => {
                          const renderFileTree = (files: FileEntry[], depth = 0) => {
                            return files.map((file) => {
                              const isActive = activeTabPath === file.path;
                              const isModified = openTabs.find((t) => t.path === file.path)?.modified;
                              const isExpanded = expandedFolders.has(file.path);
                              const isTargetDir = isCreatingItem?.targetDir === file.path;

                              return (
                                <div key={file.path}>
                                  <div
                                    className="w-full flex items-center justify-between py-1 rounded-xl transition-all mt-0.5 group"
                                    style={{
                                      background: isActive ? "#FAE5D8" : "transparent",
                                      border: isActive ? "1px solid #F0C9B4" : "1px solid transparent",
                                      paddingLeft: `${8 + depth * 12}px`,
                                      paddingRight: "8px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => file.isDir ? handleToggleFolder(file) : handleOpenFile(file)}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setContextMenu({ x: e.clientX, y: e.clientY, file });
                                    }}
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                      {file.isDir ? (
                                        <div className="flex items-center gap-0.5 shrink-0">
                                          {isExpanded ? (
                                            <ChevronDown style={{ width: "12px", height: "12px", color: "#C8532A" }} />
                                          ) : (
                                            <ChevronRight style={{ width: "12px", height: "12px", color: "#C8BEB0" }} />
                                          )}
                                          <FolderOpen style={{ width: "12px", height: "12px", color: "#C8532A" }} />
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-0.5 shrink-0 pl-3">
                                          <FileText style={{ width: "12px", height: "12px", color: "#C8BEB0" }} />
                                        </div>
                                      )}

                                      {renamingFile?.path === file.path ? (
                                        <input
                                          autoFocus
                                          value={renameInput}
                                          onChange={(e) => setRenameInput(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleRenameSubmit();
                                            if (e.key === "Escape") setRenamingFile(null);
                                          }}
                                          onBlur={() => setTimeout(handleRenameSubmit, 150)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="bg-transparent border-none outline-none w-full"
                                          style={{ fontSize: "12px", fontFamily: FONT, color: "#C8532A" }}
                                        />
                                      ) : (
                                        <span
                                          style={{
                                            fontSize: "12px",
                                            fontFamily: FONT,
                                            color: isActive ? "#C8532A" : isModified ? "#D4800A" : "#7A6858",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {file.name}
                                        </span>
                                      )}
                                    </div>

                                    {file.isDir && (
                                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (createMenuOpen?.path === file.path) {
                                              setCreateMenuOpen(null);
                                            } else {
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              setCreateMenuOpen({ path: file.path, x: rect.left, y: rect.bottom });
                                            }
                                          }}
                                          className="hover:bg-black/5 rounded-md p-0.5"
                                        >
                                          <Plus style={{ width: "12px", height: "12px", color: "#A08870" }} />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Inline create input if creating in this dir */}
                                  {isTargetDir && (
                                    <div
                                      className="w-full flex items-center gap-1.5 py-1.5 rounded-xl mt-0.5"
                                      style={{ background: "#FAE5D8", border: "1px solid #F0C9B4", paddingLeft: `${8 + (depth + 1) * 12}px`, paddingRight: "8px" }}
                                    >
                                      {isCreatingItem.isDir ? (
                                        <div className="flex items-center gap-0.5 shrink-0 pl-3">
                                          <FolderOpen style={{ width: "12px", height: "12px", color: "#C8532A" }} />
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-0.5 shrink-0 pl-3">
                                          <FileText style={{ width: "12px", height: "12px", color: "#C8BEB0" }} />
                                        </div>
                                      )}
                                      <input
                                        autoFocus
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") handleCreateItemSubmit();
                                          else if (e.key === "Escape") { setIsCreatingItem(null); setNewItemName(""); }
                                        }}
                                        onBlur={() => setTimeout(handleCreateItemSubmit, 150)}
                                        className="bg-transparent border-none outline-none w-full"
                                        style={{ fontSize: "12px", fontFamily: FONT, color: "#C8532A" }}
                                        placeholder={isCreatingItem.isDir ? "Folder name..." : "file.tex"}
                                      />
                                    </div>
                                  )}

                                  {/* Render children if expanded */}
                                  {file.isDir && isExpanded && folderContents[file.path] && (
                                    <div>
                                      {renderFileTree(folderContents[file.path], depth + 1)}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          };

                          return renderFileTree(fileTree, 0);
                        })()}
                      </>
                    )}
                  </>
                )}

                {/* Custom Create Menu */}
                {createMenuOpen && (
                  <div
                    className="fixed rounded-lg shadow-lg py-1 z-50 flex flex-col min-w-[140px]"
                    style={{
                      background: "#FDFBF7",
                      border: "1px solid #EAE0D5",
                      left: Math.min(createMenuOpen.x, window.innerWidth - 150),
                      top: Math.min(createMenuOpen.y + 4, window.innerHeight - 80),
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-full text-left px-3 py-1.5 hover:bg-black/5 flex items-center gap-2 transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCreateItemInit(false, createMenuOpen.path);
                      }}
                    >
                      <FileText style={{ width: "12px", height: "12px", color: "#C8BEB0" }} />
                      <span style={{ fontSize: "11px", color: "#7A6858", fontFamily: FONT }}>New File</span>
                    </button>
                    <button
                      className="w-full text-left px-3 py-1.5 hover:bg-black/5 flex items-center gap-2 transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCreateItemInit(true, createMenuOpen.path);
                      }}
                    >
                      <FolderOpen style={{ width: "12px", height: "12px", color: "#C8532A" }} />
                      <span style={{ fontSize: "11px", color: "#7A6858", fontFamily: FONT }}>New Folder</span>
                    </button>
                  </div>
                )}

                {/* Custom Context Menu */}
                {contextMenu && (
                  <div
                    className="fixed rounded-lg shadow-lg py-1 z-50 flex flex-col min-w-[140px]"
                    style={{
                      background: "#FDFBF7",
                      border: "1px solid #EAE0D5",
                      left: Math.min(contextMenu.x, window.innerWidth - 150),
                      top: Math.min(contextMenu.y, window.innerHeight - 80),
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-full text-left px-3 py-1.5 hover:bg-black/5 flex items-center gap-2 transition-colors"
                      onClick={() => {
                        setRenamingFile(contextMenu.file);
                        setRenameInput(contextMenu.file.name);
                        setContextMenu(null);
                      }}
                    >
                      <Edit2 style={{ width: "12px", height: "12px", color: "#7A6858" }} />
                      <span style={{ fontSize: "11px", color: "#3C2A18", fontFamily: FONT }}>Rename</span>
                    </button>
                    <button
                      className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      onClick={() => {
                        setContextMenu(null);
                        handleDeleteItem(contextMenu.file);
                      }}
                    >
                      <Trash2 style={{ width: "12px", height: "12px", color: "#E03E3E" }} />
                      <span style={{ fontSize: "11px", color: "#E03E3E", fontFamily: FONT }}>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Image — Overleaf-style drop zone */}
              <div className="px-2 pb-2">
                <div className="flex items-center gap-1 px-2 mb-1.5">
                  <span
                    style={{
                      color: "#A08870",
                      fontSize: "10px",
                      fontFamily: FONT,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Upload
                  </span>
                </div>
                <div
                  className="rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all"
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    height: "72px",
                    background: dragOver ? "#FAE5D8" : "#FDFAF6",
                    border: `1.5px dashed ${dragOver ? "#C8532A" : "#DED3C4"}`,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    className="rounded-xl flex items-center justify-center"
                    style={{
                      width: "28px",
                      height: "28px",
                      background: dragOver ? "#F0C9B4" : "#F5EDE3",
                      border: `1px solid ${dragOver ? "#C8532A" : "#E4D9CC"}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <ImagePlus
                      style={{
                        width: "13px",
                        height: "13px",
                        color: dragOver ? "#C8532A" : "#C8BEB0",
                        transition: "color 0.2s",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontFamily: FONT,
                      color: dragOver ? "#C8532A" : "#B5A08A",
                      fontWeight: dragOver ? 500 : 400,
                    }}
                  >
                    {dragOver ? "Drop to import" : "Drop image or file"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.tex,.bib"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      handleFileUploads(files);
                      // Reset input so the same file can be uploaded again
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-1.5 flex flex-col gap-1">
                    {uploadedFiles.map((uf) => (
                      <div
                        key={uf.id}
                        className="flex flex-col gap-1 px-2 py-1.5 rounded-xl"
                        style={{
                          background: uf.status === "error" ? "#FEF2F2" : (uf.status === "uploading" ? "#F5EDE3" : "#DDF2E8"),
                          border: `1px solid ${uf.status === "error" ? "#FCA5A5" : (uf.status === "uploading" ? "#E4D9CC" : "#BDE5CF")}`
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {uf.status === "success" && <CheckCircle style={{ width: "10px", height: "10px", color: "#3D9A6A" }} />}
                          {uf.status === "uploading" && <Loader2 className="animate-spin" style={{ width: "10px", height: "10px", color: "#A08870" }} />}
                          {uf.status === "error" && <AlertTriangle style={{ width: "10px", height: "10px", color: "#EF4444" }} />}
                          <span style={{
                            fontSize: "10px",
                            fontFamily: MONO,
                            color: uf.status === "error" ? "#991B1B" : (uf.status === "uploading" ? "#7A6858" : "#2E7D52"),
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}>
                            {uf.name}
                          </span>
                        </div>
                        {uf.error && (
                          <span style={{ fontSize: "9px", fontFamily: FONT, color: "#DC2626", marginLeft: "18px", lineHeight: 1.2 }}>
                            {uf.error}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ────── VERSION CONTROL TAB ────── */}
          {sidebarTab === "vcs" && (
            <div className="flex flex-col h-full py-2 px-2">
              {/* Branch badge */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                style={{
                  background: "#FAE5D8",
                  border: "1.5px solid #F0C9B4",
                }}
              >
                <GitBranch style={{ width: "12px", height: "12px", color: "#C8532A" }} />
                <span style={{ fontSize: "12px", fontFamily: FONT, fontWeight: 500, color: "#C8532A" }}>
                  main
                </span>
                <span style={{ fontSize: "10px", fontFamily: FONT, color: "#B5A08A", marginLeft: "auto" }}>
                  ↑ 0 ↓ 0
                </span>
              </div>

              {/* Changed files */}
              <div className="mb-3">
                <div className="flex items-center gap-1 px-2 mb-1.5">
                  <span
                    style={{
                      color: "#A08870",
                      fontSize: "10px",
                      fontFamily: FONT,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Changes ({changedFiles.length})
                  </span>
                </div>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: "#FDFAF6", border: "1px solid #E8DDD0" }}
                >
                  {changedFiles.map((file, i) => (
                    <div
                      key={file.name}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/60 transition-colors cursor-pointer"
                      style={{ borderBottom: i < changedFiles.length - 1 ? "1px solid #F0E9DF" : "none" }}
                    >
                      <span
                        style={{
                          fontSize: "9px",
                          fontFamily: MONO,
                          fontWeight: 600,
                          color: file.color,
                          width: "14px",
                          textAlign: "center",
                        }}
                      >
                        {file.status}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontFamily: FONT,
                          color: "#7A6858",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commit button placeholder */}
              <button
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all mb-3"
                style={{
                  background: "#FAE5D8",
                  border: "1.5px solid #F0C9B4",
                  color: "#C8532A",
                  fontSize: "12px",
                  fontFamily: FONT,
                  fontWeight: 500,
                }}
              >
                <Upload style={{ width: "11px", height: "11px" }} />
                Commit & Push
              </button>

              {/* Recent commits */}
              <div>
                <div className="flex items-center gap-1 px-2 mb-1.5">
                  <span
                    style={{
                      color: "#A08870",
                      fontSize: "10px",
                      fontFamily: FONT,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Recent Commits
                  </span>
                </div>
                {recentCommits.map((commit) => (
                  <div
                    key={commit.hash}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <GitCommit style={{ width: "11px", height: "11px", color: "#C8BEB0", marginTop: "2px", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontSize: "11px",
                          fontFamily: FONT,
                          color: "#7A6858",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          lineHeight: 1.3,
                        }}
                      >
                        {commit.message}
                      </p>
                      <p style={{ fontSize: "9px", fontFamily: FONT, color: "#C8BEB0" }}>
                        {commit.hash} · {commit.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ EDITOR + PREVIEW ═══════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab bar */}
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
              key={tab.path}
              onClick={() => {
                setActiveTabPath(tab.path);
                window.api?.readFile(tab.path).then(res => { if (res.content !== undefined) setCode(res.content) });
              }}
              className="flex items-center gap-2 px-4 shrink-0 relative group outline-none"
              style={{
                background: activeTabPath === tab.path ? "#F9F3EC" : "transparent",
                borderRight: "1px solid #E4D9CC",
                borderTop: activeTabPath === tab.path ? "2px solid #C8532A" : "2px solid transparent",
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
                  color: activeTabPath === tab.path ? "#2C1F12" : "#A08870",
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
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenTabs(tabs => tabs.filter(t => t.path !== tab.path));
                  if (activeTabPath === tab.path) {
                    setActiveTabPath(null);
                    setCode("");
                  }
                }}
                style={{ width: "10px", height: "10px", color: "#C8BEB0" }}
                className="group-hover:text-red-400 transition-colors"
                role="button"
              />
            </button>
          ))}
          <div className="flex-1" />
          {/* Ask AI Toolbar Button */}
          {activeTabPath && !diffMode && (
            <div className="flex items-center px-1">
              <button
                onClick={() => {
                  if (window.api) {
                    window.api.openAskBox(code);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all"
                style={{
                  background: "transparent",
                  border: "1.5px solid #F0C9B4",
                  color: "#C8532A",
                  fontSize: "12px",
                  fontFamily: FONT,
                  fontWeight: 500,
                }}
              >
                <Sparkles style={{ width: "11px", height: "11px" }} />
                Ask AI
              </button>
            </div>
          )}

          {/* Diff Controls */}
          {diffMode && (
            <div className="flex items-center gap-2 px-3">
              <button
                onClick={() => setDiffMode(false)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all hover:bg-black/5"
                style={{
                  color: "#A08870",
                  fontSize: "12px",
                  fontFamily: FONT,
                  fontWeight: 500,
                }}
              >
                <X style={{ width: "12px", height: "12px" }} />
                Reject
              </button>
              <button
                onClick={() => {
                  setCode(proposedCode);
                  if (activeTabPath) {
                    setOpenTabs(tabs => tabs.map(t => t.path === activeTabPath ? { ...t, modified: true } : t));
                  }
                  setDiffMode(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all"
                style={{
                  background: "#DDF2E8",
                  border: "1.5px solid #BDE5CF",
                  color: "#2E7D52",
                  fontSize: "12px",
                  fontFamily: FONT,
                  fontWeight: 500,
                }}
              >
                <Check style={{ width: "12px", height: "12px" }} />
                Accept
              </button>
            </div>
          )}

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

        {/* Editor + Preview split */}
        <div className="flex-1 flex overflow-hidden">
          {/* ────── Code Editor ────── */}
          <div
            className="flex-1 flex overflow-hidden"
            style={{ background: "#FEFCF8" }}
          >
            {diffMode ? (
              <div className="flex-1 overflow-auto bg-white text-sm" style={{ fontFamily: MONO }}>
                <ReactDiffViewer
                  oldValue={code}
                  newValue={proposedCode}
                  splitView={false}
                  compareMethod={DiffMethod.WORDS}
                  styles={{
                    variables: {
                      light: {
                        diffViewerBackground: '#FEFCF8',
                        addedBackground: '#e6ffed',
                        addedColor: '#24292e',
                        removedBackground: '#ffeef0',
                        removedColor: '#24292e',
                        wordAddedBackground: '#acf2bd',
                        wordRemovedBackground: '#fdb8c0',
                        addedGutterBackground: '#cdffd8',
                        removedGutterBackground: '#ffdce0',
                        gutterBackground: '#FAF6F0',
                        gutterBackgroundDark: '#FAF6F0',
                        highlightBackground: '#fffbdd',
                        highlightGutterBackground: '#fff5b1',
                        codeFoldGutterBackground: '#EDE5D8',
                        codeFoldBackground: '#FAF6F0',
                        emptyLineBackground: '#FEFCF8',
                        gutterColor: '#D4C8B0',
                        addedGutterColor: '#28a745',
                        removedGutterColor: '#cb2431',
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div
                ref={editorContainerRef}
                className="flex-1 relative overflow-hidden"
              >
                {/* Syntax-highlighted background layer */}
                <pre
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: "16px 0 16px 52px",
                    fontSize: "12px",
                    fontFamily: MONO,
                    lineHeight: "1.65",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    color: "#3C2A18",
                    overflow: "hidden",
                    pointerEvents: "none",
                    boxSizing: "border-box",
                  }}
                >
                  {linesOfTokens.map((lineTokens, lineIdx) => (
                    <div key={lineIdx} style={{ position: "relative", minHeight: "1.65em" }}>
                      {/* Integrated Line Number */}
                      <span
                        style={{
                          position: "absolute",
                          left: "-52px",
                          width: "44px",
                          textAlign: "right",
                          color: "#D4C8B0",
                          userSelect: "none",
                        }}
                      >
                        {lineIdx + 1}
                      </span>
                      {lineTokens.length === 0 ? "\u200B" : lineTokens.map((token, i) => (
                        <span key={i} style={{ color: TOKEN_COLORS[token.type] }}>
                          {token.value}
                        </span>
                      ))}
                    </div>
                  ))}
                </pre>

                {/* Editable textarea overlay */}
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (activeTabPath) {
                      setOpenTabs(tabs => tabs.map(t => t.path === activeTabPath ? { ...t, modified: true } : t));
                    }
                  }}
                  onScroll={handleEditorScroll}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    padding: "16px 0 16px 52px",
                    fontSize: "12px",
                    fontFamily: MONO,
                    lineHeight: "1.65",
                    margin: 0,
                    border: "none",
                    outline: "none",
                    resize: "none",
                    background: "transparent",
                    color: "transparent",
                    caretColor: "#C8532A",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    boxSizing: "border-box",
                    overflowY: "auto",
                  }}
                />
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: "1px", background: "#E4D9CC", flexShrink: 0 }} />

          {/* ────── PDF Preview ────── */}
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
            <div className="flex-1 overflow-auto p-5 flex justify-center items-center">
              {pdfData ? (
                <iframe
                  src={`data:application/pdf;base64,${pdfData}`}
                  className="shadow-md rounded-sm bg-white"
                  style={{
                    width: `${zoom}%`,
                    height: "100%",
                    border: "1px solid #E8E0D4",
                  }}
                  title="PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center opacity-60">
                  <FileText style={{ width: "48px", height: "48px", color: "#A08870", marginBottom: "16px" }} />
                  <p style={{ color: "#7A6858", fontSize: "14px", fontFamily: FONT, fontWeight: 500 }}>
                    PDF not compiled
                  </p>
                  <p style={{ color: "#A08870", fontSize: "12px", fontFamily: FONT, marginTop: "8px" }}>
                    Click "Compile" to generate the preview.
                  </p>
                </div>
              )}
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
