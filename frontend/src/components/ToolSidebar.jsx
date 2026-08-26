"use client";

import Link from "next/link";
import {
  Binary,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  Film,
  Hash,
  Image,
  KeyRound,
  Link2,
  Maximize2,
  Menu,
  Minimize2,
  Music2,
  QrCode,
  RefreshCw,
  ScanLine,
  SplitSquareHorizontal,
  Type,
  Regex,
} from "lucide-react";
import { useState } from "react";
import { tools } from "@/config/tools";

const icons = {
  film: Film,
  scan: ScanLine,
  minimize: Minimize2,
  music: Music2,
  image: Image,
  refresh: RefreshCw,
  maximize: Maximize2,
  type: Type,
  file: FileText,
  split: SplitSquareHorizontal,
  book: BookOpen,
  code: Code2,
  qr: QrCode,
  binary: Binary,
  hash: Hash,
  regex: Regex,
  link: Link2,
  key: KeyRound,
};

export default function ToolSidebar({ activeId }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={`tool-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="tool-sidebar-head">
        <span className="tool-sidebar-label">
          <Menu size={15} />
          {!collapsed && "工具菜单"}
        </span>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed((value) => !value)}
          title={collapsed ? "展开菜单" : "收起菜单"}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
      <nav className="tool-sidebar-nav">
        {tools.map((tool) => {
          const Icon = icons[tool.icon] || Film;
          return (
            <Link
              key={tool.id}
              className={`tool-sidebar-link ${activeId === tool.id ? "active" : ""}`}
              href={`/tools/${tool.id}`}
              title={collapsed ? tool.title : undefined}
            >
              <span className="tool-sidebar-icon"><Icon size={16} /></span>
              {!collapsed && <span>{tool.title}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
