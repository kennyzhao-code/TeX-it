import { useState } from "react";
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
  { icon: GitBranch, label: "Version Control", path: "/version-control" },
  { icon: LayoutDashboard, label: "Extensions", path: null },
  { icon: Puzzle, label: "Packages", path: null },
];

export function Root() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeActivity, setActiveActivity] = useState(0);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);

  const handleActivityClick = (index: number, path: string | null) => {
    setActiveActivity(index);
    if (path) navigate(path);
  };

  const pageTitle =
    location.pathname === "/"
      ? "Welcome"
      : location.pathname === "/editor"
      ? "thesis_main.tex"
      : "Version Control";

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
        {/* Activity Bar */}
        <div
          className="flex flex-col items-center py-2 shrink-0 gap-0.5"
          style={{
            width: "48px",
            background: "#F2EBE1",
            borderRight: "1px solid #E4D9CC",
          }}
        >
          {activityItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeActivity === i;
            return (
              <button
                key={item.label}
                onClick={() => handleActivityClick(i, item.path)}
                title={item.label}
                className="flex items-center justify-center rounded-xl transition-all"
                style={{
                  width: "36px",
                  height: "36px",
                  color: isActive ? "#C8532A" : "#A08870",
                  background: isActive ? "#FAE5D8" : "transparent",
                  boxShadow: isActive ? "0 1px 4px rgba(200,83,42,0.12)" : "none",
                }}
              >
                <Icon style={{ width: "16px", height: "16px" }} />
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            className="flex items-center justify-center rounded-xl transition-all hover:bg-black/5"
            style={{ width: "36px", height: "36px", color: "#A08870" }}
          >
            <Settings style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

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
          <div className="flex items-center gap-1.5">
            <GitBranch style={{ width: "10px", height: "10px", color: "#C8532A" }} />
            <span style={{ color: "#C8532A", fontSize: "10px", fontFamily: FONT }}>main</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle
              style={{ width: "5px", height: "5px", fill: "#3D9A6A", color: "#3D9A6A" }}
            />
            <span style={{ color: "#A08870", fontSize: "10px", fontFamily: FONT }}>
              No errors
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: "#B5A08A", fontSize: "10px", fontFamily: FONT }}>LaTeX</span>
          <span style={{ color: "#B5A08A", fontSize: "10px", fontFamily: FONT }}>UTF-8</span>
          <span style={{ color: "#B5A08A", fontSize: "10px", fontFamily: FONT }}>Ln 1, Col 1</span>
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
