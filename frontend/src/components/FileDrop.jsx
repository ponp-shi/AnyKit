"use client";

import { useRef, useState } from "react";
import { FolderOpen, Trash2, UploadCloud, X } from "lucide-react";
import { formatBytes } from "@/lib/files";

export default function FileDrop({
  accept,
  multiple = true,
  files,
  setFiles,
  hint,
  emptyTitle = "把文件拖到这里",
  emptyCopy = "或从设备中选择文件开始。",
  chooseLabel = "选择文件",
  preview,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(list) {
    const next = Array.from(list || []);
    if (!next.length) return;
    setFiles((current) => (multiple ? [...current, ...next] : next.slice(0, 1)));
  }

  return (
    <section className="preview-panel">
      <div className="preview-top">
        <span>{files.length ? "已选择文件" : "上传区域"}</span>
        <span>{files.length ? `${files.length} 个文件` : "文件仅在本地处理"}</span>
      </div>
      <div
        className={`preview-body ${!files.length && !preview ? "empty" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
      >
        {preview || (!files.length ? (
          <div className={`upload-dropzone ${dragging ? "dragging" : ""}`}>
            <div className="upload-orbit"><UploadCloud size={24} /></div>
            <h3>{emptyTitle}</h3>
            <p>{emptyCopy}<br />文件不会离开这台设备。</p>
            <button className="button button-lime" onClick={() => inputRef.current?.click()}>
              <FolderOpen size={15} /> {chooseLabel}
            </button>
            {hint && <small>{hint}</small>}
          </div>
        ) : null)}
      </div>
      <div className="file-queue">
        <div className="file-queue-head">
          <span>待处理文件 <b>{files.length}</b></span>
          {files.length > 0 && (
            <button className="text-action danger" onClick={() => setFiles([])}>
              <Trash2 size={13} /> 清空全部
            </button>
          )}
        </div>
        {files.map((file, index) => (
          <div className="file-row" key={`${file.name}-${index}`}>
            <span>{file.name}</span>
            <em>{formatBytes(file.size)}</em>
            <button className="icon-button" onClick={() => setFiles((current) => current.filter((_, item) => item !== index))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        className="hidden-input"
        type="file"
        accept={accept || undefined}
        multiple={multiple}
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </section>
  );
}
