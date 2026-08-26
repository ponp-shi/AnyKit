"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileDrop from "@/components/FileDrop";
import ControlPanel, { Field } from "@/components/ControlPanel";
import { loadImage, stem } from "@/lib/files";

export default function PdfStudio({ mode }) {
  const [files, setFiles] = useState([]);
  const [range, setRange] = useState("1-");
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function mergePdfs() {
    const merged = await PDFDocument.create();
    for (const file of files) {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const pages = await merged.copyPages(source, source.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
    }
    const bytes = await merged.save();
    return { blob: new Blob([bytes], { type: "application/pdf" }), name: "merged.pdf" };
  }

  async function splitPdf() {
    const file = files[0];
    const source = await PDFDocument.load(await file.arrayBuffer());
    const total = source.getPageCount();
    const [fromText, toText] = range.split("-");
    const from = Math.max(1, Number(fromText) || 1);
    const to = Math.min(total, Number(toText) || total);
    if (from > to) throw new Error("页码范围无效");
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, Array.from({ length: to - from + 1 }, (_, index) => from - 1 + index));
    pages.forEach((page) => output.addPage(page));
    const bytes = await output.save();
    return { blob: new Blob([bytes], { type: "application/pdf" }), name: `${stem(file.name)}-p${from}-${to}.pdf` };
  }

  async function imagesToPdf() {
    const doc = await PDFDocument.create();
    for (let index = 0; index < files.length; index += 1) {
      setStatus(`正在写入第 ${index + 1} 页`);
      const file = files[index];
      const loaded = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = loaded.width;
      canvas.height = loaded.height;
      canvas.getContext("2d").drawImage(loaded.image, 0, 0);
      URL.revokeObjectURL(loaded.url);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      const image = await doc.embedJpg(await blob.arrayBuffer());
      const page = doc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    const bytes = await doc.save();
    return { blob: new Blob([bytes], { type: "application/pdf" }), name: "images.pdf" };
  }

  async function processFiles() {
    if (!files.length) {
      setError("请先选择文件");
      return;
    }
    setWorking(true);
    setError("");
    setResult(null);
    try {
      const output = mode === "merge" ? await mergePdfs() : mode === "split" ? await splitPdf() : await imagesToPdf();
      setResult(output);
      setStatus("PDF 已生成");
    } catch (processingError) {
      setError(processingError.message || "PDF 处理失败");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="studio-layout">
      <FileDrop
        accept={mode === "images" ? "image/*" : "application/pdf"}
        multiple={mode !== "split"}
        files={files}
        setFiles={setFiles}
        hint={mode === "images" ? "JPG / PNG / WEBP" : "PDF"}
        emptyTitle={mode === "images" ? "将图片拖到这里" : "将 PDF 拖到这里"}
        emptyCopy={mode === "merge" ? "按添加顺序合并。" : mode === "split" ? "选择一个 PDF，再填写页码范围。" : "按添加顺序生成一册 PDF。"}
        chooseLabel={mode === "images" ? "选择图片" : "选择 PDF"}
      />
      <ControlPanel onProcess={processFiles} processLabel="开始处理" working={working} error={error} status={status} result={result} onReset={() => setResult(null)}>
        <div className="panel-section">
          <div className="panel-heading">
            <h3>输出设置</h3>
            <span>{files.length} 个文件</span>
          </div>
          {mode === "split" && (
            <Field label="页码范围" hint="例如 1-3，留空终点表示到最后一页">
              <input value={range} onChange={(event) => setRange(event.target.value)} placeholder="1-3" />
            </Field>
          )}
          {mode === "merge" && <div className="field-hint">文件将按列表顺序合并为一个 PDF。</div>}
          {mode === "images" && <div className="field-hint">每张图片占一页，按原图尺寸写入。</div>}
        </div>
      </ControlPanel>
    </div>
  );
}
