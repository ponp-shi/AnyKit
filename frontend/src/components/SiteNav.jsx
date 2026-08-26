"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function SiteNav({ studio = false }) {
  return (
    <nav className={`nav ${studio ? "studio-nav" : ""}`}>
      <Link className="brand" href="/">
        <span className="brand-mark">A</span>
        anykit
      </Link>
      <div className="nav-links">
        <Link className="nav-link" href="/#tools">全部工具</Link>
        <Link className="nav-link" href="/#how">如何使用</Link>
        <Link className="nav-link" href="/about">关于</Link>
      </div>
      <div className="nav-actions">
        <span className="credit-pill">
          <ShieldCheck size={13} />
          本地处理 · 文件不上传
        </span>
      </div>
    </nav>
  );
}
