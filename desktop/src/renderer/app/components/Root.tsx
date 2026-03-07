import { useState } from "react";
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
  const [speechMode, setSpeechMode] = useState<"text" | "image">("text");

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
        {["File", "Edit", "View", "Build", "Tools", "Window"].map((item) => (
          <button
            key={item}
            className="px-2.5 rounded-md flex items-center gap-1 transition-colors hover:bg-black/5"
            style={{ height: "22px", color: "#7A6858", fontSize: "12px", fontFamily: FONT }}
          >
            {item}
          </button>
        ))}
        {/* Help button */}
        <button
          className="px-2.5 rounded-md flex items-center gap-1.5 transition-colors hover:bg-black/5"
          style={{ height: "22px", color: "#7A6858", fontSize: "12px", fontFamily: FONT }}
        >
          <HelpCircle style={{ width: "11px", height: "11px" }} />
          Help
        </button>

        <div className="flex-1" />

        {/* Text-to-Speech / Image-to-LaTeX bubble segmented toggle */}
        <div
          className="flex items-center p-0.5 rounded-xl gap-0.5"
          style={{
            background: "#EDE5D8",
            border: "1.5px solid #E0D5C5",
          }}
        >
          {([
            { mode: "text" as const, Icon: Volume2, label: "Text-to-Speech" },
            { mode: "image" as const, Icon: ScanLine, label: "Image-to-LaTeX" },
          ]).map(({ mode, Icon, label }) => {
            const isActive = speechMode === mode;
            return (
              <button
                key={mode}
                title={label}
                onClick={() => setSpeechMode(mode)}
                className="flex items-center gap-1.5 rounded-lg transition-all"
                style={{
                  padding: "3px 10px",
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
                <span style={{ lineHeight: 1 }}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Search palette */}
        <div
          className="flex items-center gap-2 px-3 rounded-full cursor-text ml-2"
          style={{
            height: "20px",
            background: "#EFE8DE",
            border: "1px solid #E0D5C5",
            color: "#B5A08A",
            fontSize: "11px",
            fontFamily: FONT,
            minWidth: "190px",
          }}
        >
          <Command style={{ width: "10px", height: "10px" }} />
          <span>Search or run command</span>
        </div>
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
    </div>
  );
}
