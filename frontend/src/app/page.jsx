"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Binary,
  BookOpen,
  Code2,
  FileText,
  Film,
  Hash,
  Image,
  KeyRound,
  Link2,
  Maximize2,
  Minimize2,
  Music2,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  SplitSquareHorizontal,
  Type,
  Regex,
} from "lucide-react";
import { categories, tools } from "@/config/tools";
import SiteNav from "@/components/SiteNav";
import { CategoryArt, HeroVisual, HowArt } from "@/components/Visuals";
import { useAppStore } from "@/store";

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

function ToolCard({ tool }) {
  const Icon = icons[tool.icon] || Film;
  const remember = useAppStore((state) => state.rememberTool);
  return (
    <Link href={`/tools/${tool.id}`} onClick={() => remember(tool.id)}>
      <article className={`tool-card ${tool.accent === "orange" ? "warm" : ""}`}>
        <div>
          <div className={`tool-icon ${tool.accent}`}>{<Icon size={22} strokeWidth={2.1} />}</div>
          <h3>{tool.title}</h3>
          <p>{tool.description}</p>
        </div>
        <div className="tool-card-footer">
          <span className="tool-state">立即使用</span>
          <span className="tool-arrow"><ArrowUpRight size={16} /></span>
        </div>
      </article>
    </Link>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const recentIds = useAppStore((state) => state.recentIds);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchCategory = category === "all" || tool.category === category;
      const matchQuery = !keyword || `${tool.title} ${tool.description}`.toLowerCase().includes(keyword);
      return matchCategory && matchQuery;
    });
  }, [query, category]);
  const recent = recentIds.map((id) => tools.find((tool) => tool.id === id)).filter(Boolean);

  return (
    <div className="site-shell">
      <SiteNav />
      <main>
        <section className="home-hero">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> 浏览器里的格式工厂</div>
            <h1 className="hero-title">把常用转换 <em>做成一件事。</em></h1>
            <p className="hero-copy">视频、图片、PDF、开发者小工具集中在一个地方。拖进去，设好参数，下载结果。文件只在你的设备上处理，换电脑打开同一个网址就能用。</p>
            <label className="home-search">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索工具，例如 GIF、压缩、JSON…" />
            </label>
            <p className="hero-privacy">没有账号墙。视频和图片只在这台设备处理，不会上传。</p>
          </div>
          <HeroVisual />
        </section>

        <section className="tools-section" id="tools">
          <div className="section-head">
            <h2 className="section-title">工具箱</h2>
            <span className="section-meta">{filtered.length} 个可用</span>
          </div>
          <div className="category-tabs">
            <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>全部</button>
            {categories.map((item) => (
              <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}</button>
            ))}
          </div>
          {recent.length > 0 && category === "all" && !query && (
            <>
              <div className="category-label">最近使用</div>
              <div className="tool-grid compact">{recent.map((tool) => <ToolCard key={`recent-${tool.id}`} tool={tool} />)}</div>
            </>
          )}
          {categories.filter((item) => category === "all" || item.id === category).map((item) => {
            const group = filtered.filter((tool) => tool.category === item.id);
            if (!group.length) return null;
            return (
              <div key={item.id}>
                <div className="category-label">
                  <CategoryArt id={item.id} />
                  {item.label}
                </div>
                <div className="tool-grid">{group.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</div>
              </div>
            );
          })}
          {!filtered.length && <p className="empty-search">没有匹配的工具，换个关键词试试。</p>}
        </section>

        <section className="how-section" id="how">
          <div className="section-head">
            <h2 className="section-title">三步做完</h2>
          </div>
          <div className="how-grid">
            <article><HowArt step={0} /><span>01</span><h3>选工具</h3><p>按视频、图片、文档、开发者分类，或直接搜索。</p></article>
            <article><HowArt step={1} /><span>02</span><h3>丢文件</h3><p>拖放或批量选择。参数在右侧，和格式工厂一样先设再转。</p></article>
            <article><HowArt step={2} /><span>03</span><h3>下载结果</h3><p>处理在浏览器里完成。关掉标签页后，文件不会留在任何服务器上。</p></article>
          </div>
          <div className="privacy-banner">
            <ShieldCheck size={18} />
            音视频首次压缩会加载一次开源编码器，之后仍在本地运行。
          </div>
        </section>
      </main>
      <footer className="footer">
        <span>ANYKIT / 2026</span>
        <Link href="/about">隐私与说明</Link>
      </footer>
    </div>
  );
}
