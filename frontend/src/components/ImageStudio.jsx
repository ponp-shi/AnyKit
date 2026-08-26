"use client";

import { useEffect, useState } from "react";
import FileDrop from "@/components/FileDrop";
import ControlPanel, { Field } from "@/components/ControlPanel";
import { canvasToBlob, formatBytes, loadImage, stem, zipFiles } from "@/lib/files";

function mimeFor(format) {
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  return "image/jpeg";
}

export default function ImageStudio({ mode }) {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(0.82);
  const [format, setFormat] = useState("jpeg");
  const [width, setWidth] = useState(1280);
  const [keepRatio, setKeepRatio] = useState(true);
  const [watermark, setWatermark] = useState("AnyKit");
  const [position, setPosition] = useState("bottom-right");
  const [opacity, setOpacity] = useState(0.35);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!files[0]) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(files[0]);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [files]);

  async function processOne(file) {
    const loaded = await loadImage(file);
    const canvas = document.createElement("canvas");
    let targetWidth = loaded.width;
    let targetHeight = loaded.height;
    if (mode === "resize") {
      targetWidth = Math.max(1, Number(width) || loaded.width);
      targetHeight = keepRatio ? Math.round((loaded.height / loaded.width) * targetWidth) : loaded.height;
    }
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
    ctx.drawImage(loaded.image, 0, 0, targetWidth, targetHeight);
    if (mode === "watermark" && watermark.trim()) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = "#ffffff";
      ctx.font = `${Math.max(18, Math.round(targetWidth / 22))}px sans-serif`;
      ctx.textBaseline = "middle";
      const text = watermark.trim();
      const metrics = ctx.measureText(text);
      const pad = 24;
      const x = position.includes("right") ? targetWidth - metrics.width - pad : position.includes("left") ? pad : (targetWidth - metrics.width) / 2;
      const y = position.includes("bottom") ? targetHeight - pad : position.includes("top") ? pad + 12 : targetHeight / 2;
      ctx.shadowColor = "rgba(0,0,0,.45)";
      ctx.shadowBlur = 8;
      ctx.fillText(text, x, y);
      ctx.restore();
    }
    URL.revokeObjectURL(loaded.url);
    const outFormat = mode === "convert" ? format : file.type.includes("png") && mode !== "compress" ? "png" : format;
    const blob = await canvasToBlob(canvas, mimeFor(outFormat), Number(quality));
    const ext = outFormat === "jpeg" ? "jpg" : outFormat;
    return { blob, name: `${stem(file.name)}${mode === "compress" ? "-min" : ""}` + `.${ext}` };
  }

  async function processFiles() {
    if (!files.length) {
      setError("请先选择图片");
      return;
    }
    setWorking(true);
    setError("");
    setResult(null);
    try {
      const outputs = [];
      for (let index = 0; index < files.length; index += 1) {
        setStatus(`正在处理 ${index + 1} / ${files.length}`);
        outputs.push(await processOne(files[index]));
      }
      setResult(files.length === 1 ? outputs[0] : await zipFiles(outputs, `anykit-images.zip`));
      setStatus(files.length === 1 ? `完成 · ${formatBytes(outputs[0].blob.size)}` : `已处理 ${outputs.length} 张`);
    } catch (processingError) {
      setError(processingError.message || "图片处理失败");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="studio-layout">
      <FileDrop
        accept="image/*"
        files={files}
        setFiles={setFiles}
        hint="JPG / PNG / WEBP / BMP"
        emptyTitle="将图片拖到这里"
        emptyCopy="支持批量，处理完成后可打包下载。"
        chooseLabel="选择图片"
        preview={previewUrl ? <img className="canvas-preview" src={previewUrl} alt="" /> : null}
      />
      <ControlPanel onProcess={processFiles} processLabel="开始处理" working={working} error={error} status={status} result={result} onReset={() => setResult(null)}>
        <div className="panel-section">
          <div className="panel-heading">
            <h3>输出设置</h3>
            <span>{files.length} 张</span>
          </div>
          {(mode === "compress" || mode === "convert" || mode === "watermark") && (
            <Field label="质量">
              <select value={quality} onChange={(event) => setQuality(Number(event.target.value))}>
                <option value="0.6">更小体积</option>
                <option value="0.82">均衡</option>
                <option value="0.92">高画质</option>
              </select>
            </Field>
          )}
          {(mode === "compress" || mode === "convert" || mode === "resize" || mode === "watermark") && (
            <Field label="输出格式">
              <select value={format} onChange={(event) => setFormat(event.target.value)}>
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WEBP</option>
              </select>
            </Field>
          )}
          {mode === "resize" && (
            <>
              <Field label="目标宽度（像素）">
                <input type="number" min="16" max="8000" value={width} onChange={(event) => setWidth(event.target.value)} />
              </Field>
              <label className="check-row">
                <input type="checkbox" checked={keepRatio} onChange={(event) => setKeepRatio(event.target.checked)} />
                锁定宽高比
              </label>
            </>
          )}
          {mode === "watermark" && (
            <>
              <Field label="水印文字">
                <input value={watermark} onChange={(event) => setWatermark(event.target.value)} />
              </Field>
              <Field label="位置">
                <select value={position} onChange={(event) => setPosition(event.target.value)}>
                  <option value="bottom-right">右下</option>
                  <option value="bottom-left">左下</option>
                  <option value="top-right">右上</option>
                  <option value="center">居中</option>
                </select>
              </Field>
              <Field label="透明度">
                <select value={opacity} onChange={(event) => setOpacity(Number(event.target.value))}>
                  <option value="0.2">轻</option>
                  <option value="0.35">中</option>
                  <option value="0.6">明显</option>
                </select>
              </Field>
            </>
          )}
        </div>
      </ControlPanel>
    </div>
  );
}
