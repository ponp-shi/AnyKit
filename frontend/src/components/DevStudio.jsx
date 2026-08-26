"use client";

import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download } from "lucide-react";
import { copyText, readFileAsDataURL, readFileAsText, saveBlob, saveText } from "@/lib/files";

function Panel({ title, children }) {
  return (
    <section className="dev-panel">
      <div className="panel-heading"><h3>{title}</h3></div>
      {children}
    </section>
  );
}

function ActionRow({ onCopy, onDownload, copied }) {
  return (
    <div className="dev-actions">
      <button className="button button-dark" type="button" onClick={onCopy}><Copy size={14} /> {copied ? "已复制" : "复制"}</button>
      {onDownload && <button className="button button-light" type="button" onClick={onDownload}><Download size={14} /> 下载</button>}
    </div>
  );
}

export default function DevStudio({ mode }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [indent, setIndent] = useState("2");
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [flags, setFlags] = useState("g");
  const [count, setCount] = useState(5);
  const [direction, setDirection] = useState("encode");

  async function markCopied(text) {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function formatJson(minify = false) {
    try {
      const parsed = JSON.parse(input);
      const text = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, Number(indent));
      setOutput(text);
      setError("");
    } catch (parseError) {
      setError(parseError.message);
    }
  }

  async function makeQr() {
    if (!input.trim()) {
      setError("请输入要编码的内容");
      return;
    }
    const url = await QRCode.toDataURL(input.trim(), { width: 512, margin: 2, color: { dark: "#122126", light: "#ffffff" } });
    setQrUrl(url);
    setError("");
  }

  async function runBase64() {
    try {
      setError("");
      setOutput(direction === "encode" ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input))));
    } catch {
      setError("编解码失败，请检查输入");
    }
  }

  async function hashText() {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest(algorithm, data);
    const hex = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    setOutput(hex);
    setError("");
  }

  async function hashFile(file) {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest(algorithm, buffer);
    setOutput(Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""));
  }

  const matches = useMemo(() => {
    if (mode !== "regex" || !input) return [];
    try {
      const regex = new RegExp(input, flags);
      const text = output;
      return [...text.matchAll(regex)].map((item) => item[0]);
    } catch {
      return [];
    }
  }, [mode, input, output, flags]);

  if (mode === "json") {
    return (
      <div className="dev-layout">
        <Panel title="输入 JSON">
          <textarea className="dev-textarea" value={input} onChange={(event) => setInput(event.target.value)} placeholder='{"hello":"anykit"}' />
          <div className="dev-toolbar">
            <select value={indent} onChange={(event) => setIndent(event.target.value)}>
              <option value="2">缩进 2</option>
              <option value="4">缩进 4</option>
            </select>
            <button className="button button-dark" onClick={() => formatJson(false)}>格式化</button>
            <button className="button button-light" onClick={() => formatJson(true)}>压缩</button>
            <label className="button button-light">
              打开文件
              <input className="hidden-input" type="file" accept=".json,application/json,text/plain" onChange={async (event) => { const file = event.target.files?.[0]; if (file) setInput(await readFileAsText(file)); }} />
            </label>
          </div>
          {error && <div className="status-line error">{error}</div>}
        </Panel>
        <Panel title="结果">
          <textarea className="dev-textarea" value={output} readOnly placeholder="格式化结果会显示在这里" />
          <ActionRow onCopy={() => markCopied(output)} onDownload={() => saveText(output, "formatted.json", "application/json")} copied={copied} />
        </Panel>
      </div>
    );
  }

  if (mode === "qr") {
    return (
      <div className="dev-layout">
        <Panel title="内容">
          <textarea className="dev-textarea short" value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://example.com 或任意文本" />
          <button className="button button-dark export-button" onClick={makeQr}>生成二维码</button>
          {error && <div className="status-line error">{error}</div>}
        </Panel>
        <Panel title="预览">
          {qrUrl ? <img className="qr-preview" src={qrUrl} alt="QR" /> : <p className="dev-placeholder">生成后可下载 PNG。</p>}
          {qrUrl && (
            <button className="button button-lime" onClick={() => {
              const binary = atob(qrUrl.split(",")[1]);
              const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
              saveBlob(new Blob([bytes], { type: "image/png" }), "qrcode.png");
            }}>
              <Download size={15} /> 下载 PNG
            </button>
          )}
        </Panel>
      </div>
    );
  }

  if (mode === "base64") {
    return (
      <div className="dev-layout">
        <Panel title="输入">
          <div className="dev-toolbar">
            <select value={direction} onChange={(event) => setDirection(event.target.value)}>
              <option value="encode">编码</option>
              <option value="decode">解码</option>
            </select>
            <label className="button button-light">
              文件转 Data URL
              <input className="hidden-input" type="file" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) setOutput(await readFileAsDataURL(file));
              }} />
            </label>
          </div>
          <textarea className="dev-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
          <button className="button button-dark export-button" onClick={runBase64}>转换</button>
          {error && <div className="status-line error">{error}</div>}
        </Panel>
        <Panel title="结果">
          <textarea className="dev-textarea" value={output} readOnly />
          <ActionRow onCopy={() => markCopied(output)} copied={copied} />
        </Panel>
      </div>
    );
  }

  if (mode === "hash") {
    return (
      <div className="dev-layout">
        <Panel title="输入">
          <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}>
            <option>SHA-1</option>
            <option>SHA-256</option>
            <option>SHA-512</option>
          </select>
          <textarea className="dev-textarea" value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入文本，或选择文件" />
          <div className="dev-toolbar">
            <button className="button button-dark" onClick={hashText}>计算文本哈希</button>
            <label className="button button-light">
              计算文件哈希
              <input className="hidden-input" type="file" onChange={(event) => event.target.files?.[0] && hashFile(event.target.files[0])} />
            </label>
          </div>
        </Panel>
        <Panel title="结果">
          <textarea className="dev-textarea short" value={output} readOnly />
          <ActionRow onCopy={() => markCopied(output)} copied={copied} />
        </Panel>
      </div>
    );
  }

  if (mode === "regex") {
    return (
      <div className="dev-layout">
        <Panel title="正则表达式">
          <input className="dev-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="例如 \\d+" />
          <FieldLike label="标志">
            <input className="dev-input" value={flags} onChange={(event) => setFlags(event.target.value)} />
          </FieldLike>
          <textarea className="dev-textarea" value={output} onChange={(event) => setOutput(event.target.value)} placeholder="在这里粘贴要测试的文本" />
        </Panel>
        <Panel title={`匹配结果 · ${matches.length}`}>
          <div className="match-list">
            {matches.length ? matches.map((item, index) => <code key={`${item}-${index}`}>{item}</code>) : <p className="dev-placeholder">没有匹配。</p>}
          </div>
        </Panel>
      </div>
    );
  }

  if (mode === "url") {
    return (
      <div className="dev-layout">
        <Panel title="输入">
          <div className="dev-toolbar">
            <select value={direction} onChange={(event) => setDirection(event.target.value)}>
              <option value="encode">编码</option>
              <option value="decode">解码</option>
            </select>
          </div>
          <textarea className="dev-textarea" value={input} onChange={(event) => setInput(event.target.value)} />
          <button className="button button-dark export-button" onClick={() => {
            try {
              setError("");
              setOutput(direction === "encode" ? encodeURIComponent(input) : decodeURIComponent(input));
            } catch {
              setError("URL 编解码失败");
            }
          }}>转换</button>
          {error && <div className="status-line error">{error}</div>}
        </Panel>
        <Panel title="结果">
          <textarea className="dev-textarea" value={output} readOnly />
          <ActionRow onCopy={() => markCopied(output)} copied={copied} />
        </Panel>
      </div>
    );
  }

  return (
    <div className="dev-layout">
      <Panel title="生成">
        <label className="field"><span>数量</span>
          <input type="number" min="1" max="100" value={count} onChange={(event) => setCount(event.target.value)} />
        </label>
        <button className="button button-dark export-button" onClick={() => setOutput(Array.from({ length: Math.min(100, Math.max(1, Number(count) || 1)) }, () => crypto.randomUUID()).join("\n"))}>生成 UUID v4</button>
      </Panel>
      <Panel title="结果">
        <textarea className="dev-textarea" value={output} readOnly />
        <ActionRow onCopy={() => markCopied(output)} onDownload={() => saveText(output, "uuids.txt")} copied={copied} />
      </Panel>
    </div>
  );
}

function FieldLike({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}
