"use client";

import { Download, LoaderCircle, RefreshCcw } from "lucide-react";
import { saveBlob } from "@/lib/files";

export default function ControlPanel({ children, onProcess, processLabel = "开始处理", working, error, status, result, onReset }) {
  return (
    <aside className="control-panel">
      {children}
      <div className="panel-section">
        <button className="button button-dark export-button" onClick={onProcess} disabled={working}>
          {working ? <><LoaderCircle size={15} className="spinner" /> 处理中...</> : processLabel}
        </button>
        {error && <div className="status-line error">{error}</div>}
        {status && !error && <div className="status-line">{working ? <span className="spinner" /> : null}{status}</div>}
        {result && (
          <div className="download-row">
            <button className="button button-lime" onClick={() => saveBlob(result.blob, result.name)}>
              <Download size={15} /> 下载 {result.name}
            </button>
            {onReset && (
              <button className="button button-light" onClick={onReset} title="清除结果">
                <RefreshCcw size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}
