import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  Files,
  Search,
  GitBranch,
  Puzzle,
  Settings,
  LayoutDashboard,
  Command,
  Wifi,
  Battery,
  Volume2,
  Circle,
  ChevronDown,
  ScanLine,
  HelpCircle,
} from "lucide-react";

const FONT = "'NaN Jaune', 'Plus Jakarta Sans', -apple-system, sans-serif";

const activityItems = [
  { icon: Files, label: "Explorer", path: "/" },
  { icon: Search, label: "Search", path: null },
];

export function Root() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeActivity, setActiveActivity] = useState(0);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const handleCursorPosChange = (e: any) => {
      setCursorPos(e.detail);
    };
    const handleSyntaxErrorsChange = (e: any) => {
      setErrorCount(e.detail.count);
    };
    window.addEventListener('cursor-pos-change', handleCursorPosChange);
    window.addEventListener('syntax-errors-change', handleSyntaxErrorsChange);
    return () => {
      window.removeEventListener('cursor-pos-change', handleCursorPosChange);
      window.removeEventListener('syntax-errors-change', handleSyntaxErrorsChange);
    };
  }, []);

  const handleActivityClick = (index: number, path: string | null) => {
    setActiveActivity(index);
    if (path) navigate(path);
  };



  return (
    <div
      className="w-full h-screen flex flex-col overflow-hidden select-none"
      style={{
        background: "#F9F3EC",
        fontFamily: FONT,
        color: "#2C1F12",
      }}
    >


      {/* Menu Bar */}
      <div
        className="flex items-center px-3 shrink-0"
        style={{
          height: "28px",
          background: "#F9F3EC",
          borderBottom: "1px solid #EAE0D5",
        }}
      >
        {["File", "Edit", "View", "Build", "Tools", "Window"].map((item) => {
          if (item === "File") {
            return (
              <div key={item} className="relative">
                <button
                  onClick={() => setFileMenuOpen(!fileMenuOpen)}
                  onBlur={() => setTimeout(() => setFileMenuOpen(false), 150)}
                  className="px-2.5 rounded-md flex items-center gap-1 transition-colors hover:bg-black/5"
                  style={{ height: "22px", color: "#7A6858", fontSize: "12px", fontFamily: FONT }}
                >
                  {item}
                </button>
                {fileMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg py-1 z-50 overflow-hidden" style={{ background: "#FDFBF7", border: "1px solid #EAE0D5" }}>
                    <button 
                      className="w-full text-left px-3 py-1.5 hover:bg-black/5 text-xs text-[#7A6858] transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent blur
                        setFileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent('open-folder-menu-click'));
                      }}
                    >
                      Open Folder...
                    </button>
                    <button 
                      className="w-full text-left px-3 py-1.5 hover:bg-black/5 text-xs text-[#7A6858] transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent blur
                        setFileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent('create-folder-menu-click'));
                      }}
                    >
                      Create New Folder...
                    </button>
                  </div>
                )}
              </div>
            );
          }
          return (
            <button
              key={item}
              className="px-2.5 rounded-md flex items-center gap-1 transition-colors hover:bg-black/5"
              style={{ height: "22px", color: "#7A6858", fontSize: "12px", fontFamily: FONT }}
            >
              {item}
            </button>
          );
        })}
        {/* Help button */}
        <button
          className="px-2.5 rounded-md flex items-center gap-1.5 transition-colors hover:bg-black/5"
          style={{ height: "22px", color: "#7A6858", fontSize: "12px", fontFamily: FONT }}
        >
          <HelpCircle style={{ width: "11px", height: "11px" }} />
          Help
        </button>

        {/* Right side spacer */}
        <div className="flex-1" />

      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>

      {/* Status Bar */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: "22px",
          background: "#EDE5D8",
          borderTop: "1px solid #E0D5C5",
        }}
      >
        <div className="flex items-center gap-3">
          {/* <div className="flex items-center gap-1.5">
            <GitBranch style={{ width: "10px", height: "10px", color: "#C8532A" }} />
            <span style={{ color: "#C8532A", fontSize: "10px", fontFamily: FONT }}>main</span>
          </div> */}
          <div className="flex items-center gap-1">
            <Circle
              style={{ 
                width: "5px", 
                height: "5px", 
                fill: errorCount > 0 ? "#DC2626" : "#3D9A6A", 
                color: errorCount > 0 ? "#DC2626" : "#3D9A6A" 
              }}
            />
            <span style={{ color: errorCount > 0 ? "#DC2626" : "#A08870", fontSize: "10px", fontFamily: FONT, fontWeight: errorCount > 0 ? 600 : 400 }}>
              {errorCount > 0 ? `error ${errorCount}` : "No errors"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: "#B5A08A", fontSize: "10px", fontFamily: FONT }}>LaTeX</span>
          <span style={{ color: "#B5A08A", fontSize: "10px", fontFamily: FONT }}>UTF-8</span>
          <span style={{ color: "#B5A08A", fontSize: "10px", fontFamily: FONT }}>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span
            style={{
              color: "#C8532A",
              fontSize: "10px",
              fontFamily: FONT,
              fontWeight: 500,
            }}
          >
            L'TeXch v1.0.0
          </span>
        </div>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
