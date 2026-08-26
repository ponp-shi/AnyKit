"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import VideoStudio from "@/components/VideoStudio";
import ImageStudio from "@/components/ImageStudio";
import PdfStudio from "@/components/PdfStudio";
import DevStudio from "@/components/DevStudio";

const studios = {
  "video-to-gif": <VideoStudio mode="gif" />,
  "video-frame-extractor": <VideoStudio mode="frames" />,
  "video-compressor": <VideoStudio mode="compress" />,
  "video-to-audio": <VideoStudio mode="audio" />,
  "image-compressor": <ImageStudio mode="compress" />,
  "image-convert": <ImageStudio mode="convert" />,
  "image-resize": <ImageStudio mode="resize" />,
  "image-watermark": <ImageStudio mode="watermark" />,
  "pdf-merge": <PdfStudio mode="merge" />,
  "pdf-split": <PdfStudio mode="split" />,
  "images-to-pdf": <PdfStudio mode="images" />,
  "json-formatter": <DevStudio mode="json" />,
  "qr-generator": <DevStudio mode="qr" />,
  "base64-codec": <DevStudio mode="base64" />,
  "hash-generator": <DevStudio mode="hash" />,
  "regex-tester": <DevStudio mode="regex" />,
  "url-codec": <DevStudio mode="url" />,
  "uuid-generator": <DevStudio mode="uuid" />,
};

export default function ToolPageBody({ tool }) {
  return (
    <main className="studio-main">
      <div className="crumbs">
        <Link href="/">首页</Link>
        <ChevronRight size={12} />
        <Link href="/#tools">全部工具</Link>
        <ChevronRight size={12} />
        <span>{tool.title}</span>
      </div>
      <div className="studio-heading">
        <div className="studio-heading-copy">
          <h1 className="studio-title">{tool.title}</h1>
          <p className="studio-subtitle">{tool.description} 文件仅在浏览器中处理，不会上传到服务器。</p>
        </div>
        <Link href="/#tools" className="button button-light studio-back">
          <ArrowLeft size={15} /> 返回工具箱
        </Link>
      </div>
      {studios[tool.id]}
    </main>
  );
}
