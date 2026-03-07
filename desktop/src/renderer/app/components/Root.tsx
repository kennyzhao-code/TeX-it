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
      {/* macOS Title Bar */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: "30px",
          background: "#F2EBE1",
          borderBottom: "1px solid #E4D9CC",
        }}
      >
        {/* Traffic Lights */}
        <div className="flex items-center gap-2">
          <button
            className="rounded-full transition-opacity hover:opacity-80"
            style={{ width: "12px", height: "12px", background: "#FF5F57" }}
          />
          <button
            className="rounded-full transition-opacity hover:opacity-80"
            style={{ width: "12px", height: "12px", background: "#FFBD2E" }}
          />
          <button
            className="rounded-full transition-opacity hover:opacity-80"
            style={{ width: "12px", height: "12px", background: "#28C840" }}
          />
        </div>

        {/* Center Title */}
        <div className="flex items-center gap-2">
          <span
            style={{
              color: "#C8532A",
              fontSize: "12px",
              fontFamily: FONT,
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            L'TeXch
          </span>
          <span style={{ color: "#C8BFAF", fontSize: "11px" }}>·</span>
          <span style={{ color: "#A89272", fontSize: "11px", fontWeight: 400 }}>
            {pageTitle}
          </span>
        </div>

        {/* System Icons */}
        <div className="flex items-center gap-3">
          <Wifi style={{ width: "12px", height: "12px", color: "#B5A08A" }} />
          <Battery style={{ width: "12px", height: "12px", color: "#B5A08A" }} />
          <Volume2 style={{ width: "12px", height: "12px", color: "#B5A08A" }} />
        </div>
      </div>

      {/* Menu Bar */}
      <div
        className="flex items-center px-3 shrink-0"
        style={{
          height: "28px",
          background: "#F9F3EC",
          borderBottom: "1px solid #EAE0D5",
        }}
      >
        {["File", "Edit", "View", "Build", "Tools", "Window", "Help"].map((item) => (
          <button
            key={item}
            className="px-2.5 rounded-md flex items-center gap-1 transition-colors hover:bg-black/5"
            style={{ height: "22px", color: "#7A6858", fontSize: "12px", fontFamily: FONT }}
          >
            {item}
          </button>
        ))}
        <div className="flex-1" />
        <div
          className="flex items-center gap-2 px-3 rounded-full cursor-text"
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
