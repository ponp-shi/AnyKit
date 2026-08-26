"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import FileDrop from "@/components/FileDrop";
import ControlPanel, { Field } from "@/components/ControlPanel";
import { stem, timeText, zipFiles } from "@/lib/files";
import { transcode } from "@/lib/ffmpeg";

function loadVideo(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.onloadedmetadata = () => resolve({ video, url });
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取该视频"));
    };
  });
}

function seekFrame(video, canvas, time) {
  return new Promise((resolve) => {
    const draw = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve({ width: canvas.width, height: canvas.height });
    };
    video.addEventListener("seeked", draw, { once: true });
    video.currentTime = Math.max(0, Math.min(time, video.duration || time));
  });
}

export default function VideoStudio({ mode }) {
  const previewRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [fps, setFps] = useState(10);
  const [everyN, setEveryN] = useState(5);
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState("medium");
  const [audioFormat, setAudioFormat] = useState("mp3");
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const file = files[0];

  useEffect(() => {
    if (!file) {
      setSourceUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    setDuration(0);
    setCurrentTime(0);
    setStart(0);
    setEnd(0);
    setResult(null);
    setStatus("");
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onMetadata() {
    const next = previewRef.current?.duration || 0;
    setDuration(next);
    setStart(0);
    setEnd(next);
  }

  async function encodeGif(videoFile, from, to) {
    const loaded = await loadVideo(videoFile);
    const canvas = document.createElement("canvas");
    const encoder = GIFEncoder();
    const scale = quality === "low" ? 0.5 : quality === "high" ? 1 : 0.72;
    const frameCount = Math.max(1, Math.ceil((to - from) * fps));
    for (let index = 0; index < frameCount; index += 1) {
      setStatus(`正在渲染 ${index + 1} / ${frameCount}`);
      await seekFrame(loaded.video, canvas, Math.min(to, from + index / fps));
      const width = Math.max(2, Math.round(canvas.width * scale));
      const height = Math.max(2, Math.round(canvas.height * scale));
      const scaled = document.createElement("canvas");
      scaled.width = width;
      scaled.height = height;
      scaled.getContext("2d").drawImage(canvas, 0, 0, width, height);
      const rgba = scaled.getContext("2d").getImageData(0, 0, width, height).data;
      const palette = quantize(rgba, 256);
      encoder.writeFrame(applyPalette(rgba, palette), width, height, { palette, delay: Math.round(1000 / fps), repeat: 0 });
    }
    encoder.finish();
    URL.revokeObjectURL(loaded.url);
    return { blob: new Blob([encoder.bytes()], { type: "image/gif" }), name: `${stem(videoFile.name)}.gif` };
  }

  async function extractFrames(videoFile, from, to) {
    const loaded = await loadVideo(videoFile);
    const canvas = document.createElement("canvas");
    const frames = [];
    const assumedFps = 30;
    const first = Math.ceil(from * assumedFps);
    const last = Math.floor(to * assumedFps);
    for (let frameNumber = first; frameNumber <= last; frameNumber += everyN) {
      setStatus(`抽帧 ${frames.length + 1}`);
      await seekFrame(loaded.video, canvas, Math.min(to, frameNumber / assumedFps));
      const mime = format === "jpg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.9));
      frames.push({ blob, name: `frame-${String(frames.length + 1).padStart(4, "0")}.${format}` });
    }
    URL.revokeObjectURL(loaded.url);
    if (!frames.length) throw new Error("选定区间内没有可提取的帧");
    return zipFiles(frames, `${stem(videoFile.name)}-frames.zip`);
  }

  async function processFiles() {
    if (!files.length) {
      setError("请先选择视频");
      return;
    }
    setWorking(true);
    setError("");
    setResult(null);
    try {
      if (mode === "gif") {
        const from = start;
        const to = end || duration;
        const output = await encodeGif(files[0], from, to || 1);
        setResult(output);
        setStatus("GIF 已生成");
      } else if (mode === "frames") {
        const output = await extractFrames(files[0], start, end || duration);
        setResult(output);
        setStatus("ZIP 包已生成");
      } else if (mode === "compress") {
        const outputs = await transcode(files, (source, inputName) => {
          const scale = quality === "low" ? "640:-2" : quality === "high" ? "1280:-2" : "854:-2";
          const qv = quality === "low" ? "12" : quality === "high" ? "5" : "8";
          return {
            args: ["-i", inputName, "-vf", `scale=${scale}`, "-c:v", "mpeg4", "-q:v", qv, "-c:a", "aac", "-b:a", "96k", "output.mp4"],
            output: "output.mp4",
            downloadName: `${stem(source.name)}-compressed.mp4`,
            mime: "video/mp4",
          };
        }, setStatus);
        setResult(files.length === 1 ? outputs[0] : await zipFiles(outputs, "anykit-compressed.zip"));
        setStatus("压缩完成");
      } else if (mode === "audio") {
        const ext = audioFormat;
        const codecArgs = ext === "wav"
          ? ["-vn", "-acodec", "pcm_s16le"]
          : ["-vn", "-c:a", "aac", "-b:a", "192k"];
        const outExt = ext === "wav" ? "wav" : ext === "mp3" ? "aac" : "aac";
        const outputs = await transcode(files, (source, inputName) => ({
          args: ["-i", inputName, ...codecArgs, `output.${outExt}`],
          output: `output.${outExt}`,
          downloadName: `${stem(source.name)}.${outExt === "aac" ? "m4a" : outExt}`,
          mime: outExt === "wav" ? "audio/wav" : "audio/mp4",
        }), setStatus);
        setResult(files.length === 1 ? outputs[0] : await zipFiles(outputs, "anykit-audio.zip"));
        setStatus("音频已提取");
      }
    } catch (processingError) {
      setError(processingError.message || "处理失败，请换一个文件重试");
      setStatus("");
    } finally {
      setWorking(false);
    }
  }

  const maxDuration = duration || 1;
  const preview = sourceUrl ? (
    <>
      <video ref={previewRef} className="video-preview" src={sourceUrl} onLoadedMetadata={onMetadata} onTimeUpdate={() => setCurrentTime(previewRef.current?.currentTime || 0)} />
      <span className="preview-file">{file?.name}</span>
    </>
  ) : null;

  return (
    <div className="studio-layout">
      <FileDrop
        accept="video/*"
        multiple={mode === "compress" || mode === "audio"}
        files={files}
        setFiles={setFiles}
        hint="MP4 / MOV / WEBM / AVI，建议 500 MB 以内"
        emptyTitle="将视频拖到这里"
        emptyCopy="或从设备中选择一个视频开始。"
        chooseLabel="选择视频"
        preview={preview}
      />
      <ControlPanel
        onProcess={processFiles}
        processLabel={mode === "gif" ? "生成 GIF" : mode === "frames" ? "提取静帧" : mode === "audio" ? "提取音频" : "开始压缩"}
        working={working}
        error={error}
        status={status}
        result={result}
        onReset={() => setResult(null)}
      >
        {(mode === "gif" || mode === "frames") && (
          <div className="panel-section">
            <div className="panel-heading">
              <h3>剪辑范围</h3>
              <span>{duration ? `${timeText(start)} - ${timeText(end)}` : "完整视频"}</span>
            </div>
            <div className="split-fields">
              <Field label="开始">
                <input type="number" min="0" step=".1" value={start} onChange={(event) => setStart(Math.min(Number(event.target.value), Math.max(0, end - 0.05)))} />
              </Field>
              <Field label="结束">
                <input type="number" min="0" step=".1" value={end} onChange={(event) => setEnd(Math.max(Number(event.target.value), start + 0.05))} />
              </Field>
            </div>
            {sourceUrl && (
              <div className="timeline">
                <div className="dual-range">
                  <div className="dual-fill" style={{ left: `${(start / maxDuration) * 100}%`, right: `${100 - (end / maxDuration) * 100}%` }} />
                  <input type="range" min="0" max={maxDuration} step="0.01" value={start} onChange={(event) => setStart(Math.min(Number(event.target.value), Math.max(0, end - 0.05)))} />
                  <input type="range" min="0" max={maxDuration} step="0.01" value={end} onChange={(event) => setEnd(Math.max(Number(event.target.value), start + 0.05))} />
                </div>
                <input className="range timeline-scrub" type="range" min="0" max={maxDuration} step="0.01" value={Math.min(currentTime, maxDuration)} onChange={(event) => { const value = Number(event.target.value); setCurrentTime(value); if (previewRef.current) previewRef.current.currentTime = value; }} />
              </div>
            )}
          </div>
        )}
        <div className="panel-section">
          <div className="panel-heading">
            <h3>输出设置</h3>
            <span>{mode === "gif" ? "GIF" : mode === "frames" ? "静帧" : mode === "audio" ? "音频" : "压缩"}</span>
          </div>
          {mode === "gif" && (
            <>
              <Field label="播放帧率">
                <select value={fps} onChange={(event) => setFps(Number(event.target.value))}>
                  <option value="6">6 FPS</option>
                  <option value="10">10 FPS</option>
                  <option value="15">15 FPS</option>
                  <option value="24">24 FPS</option>
                </select>
              </Field>
              <Field label="质量">
                <select value={quality} onChange={(event) => setQuality(event.target.value)}>
                  <option value="low">小文件</option>
                  <option value="medium">均衡</option>
                  <option value="high">最佳细节</option>
                </select>
              </Field>
            </>
          )}
          {mode === "frames" && (
            <>
              <Field label="每 N 帧抽一帧" hint="按源视频帧序抽取，不缩放分辨率">
                <select value={everyN} onChange={(event) => setEveryN(Number(event.target.value))}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                </select>
              </Field>
              <Field label="输出格式">
                <select value={format} onChange={(event) => setFormat(event.target.value)}>
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="webp">WEBP</option>
                </select>
              </Field>
            </>
          )}
          {mode === "compress" && (
            <Field label="压缩强度" hint="首次使用会加载约 25MB 编码器，之后可离线处理">
              <select value={quality} onChange={(event) => setQuality(event.target.value)}>
                <option value="low">更小体积</option>
                <option value="medium">均衡</option>
                <option value="high">更高画质</option>
              </select>
            </Field>
          )}
          {mode === "audio" && (
            <Field label="音频格式" hint="首次使用会加载编码器">
                <select value={audioFormat} onChange={(event) => setAudioFormat(event.target.value)}>
                  <option value="aac">M4A / AAC</option>
                  <option value="wav">WAV</option>
                </select>
            </Field>
          )}
          {(mode === "compress" || mode === "audio") && (
            <button className="button button-light add-button" onClick={() => document.querySelector(".hidden-input")?.click()}>
              <Plus size={15} /> 继续添加
            </button>
          )}
        </div>
      </ControlPanel>
    </div>
  );
}
