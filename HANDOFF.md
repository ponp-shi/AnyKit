# AnyKit 交接文档（新对话请先贴这份）

把本文完整贴进新 Chat 的第一条消息，并补一句：「按这份交接继续，不要重做已完成部分。」

---

## 1. 用户目标（原始需求）

把粗 demo 按产品化思路重构成「浏览器里的格式工厂」：可交付、打开网址就能用、任意联网设备可访问、同步推到用户自己的 GitHub。用户希望少打断、少审核，做到能继续交付为止。

语言：回复用简体中文。

仓库路径：`D:\Projects\Python\AnyKit`

---

## 2. 当前状态（2026-08-27 00:06 左右）

| 项 | 状态 |
|---|---|
| 产品重构（18 个本地工具） | 已完成并提交 |
| GitHub 仓库 | 已创建并推送 `main` |
| 本机站点 | 当时在跑：`http://localhost:3000`（`serve` 静态 `frontend/out`） |
| 临时公网 | Cloudflare Quick Tunnel（电脑开机且隧道进程在才有效） |
| 长期独立托管（不依赖本机） | **未完成**（Vercel `*.vercel.app` 在此网络打不开） |
| `backend/` `worker/` | 预留，当前产品不依赖 |

- GitHub：https://github.com/ponp-shi/AnyKit （公开，`main`）
- GitHub 账号：`ponp-shi`（本机 `gh` 已登录，scopes：`repo` `workflow` `gist` `read:org`）
- 远程：`origin` → `https://github.com/ponp-shi/AnyKit.git`
- 分支：`main` 已与 `origin/main` 同步
- HEAD：`01b22a4` 补上首页视觉插图，并加上一键开关公网页的脚本。

当时仍可能有效的公网地址（随时会变/失效）：

https://blackberry-temporarily-actors-drill.trycloudflare.com

新开隧道后地址会变，以 cloudflared 窗口打印的 `*.trycloudflare.com` 为准。

---

## 3. 提交记录（不要重做这些）

```
01b22a4 补上首页视觉插图，并加上一键开关公网页的脚本。
f1bf03d 改为静态导出以便托管，并补上跨域隔离响应头。
a650524 添加 Vercel 生产构建与部署工作流，便于推送到 main 后自动上线。
64d1118 将 AnyKit 重构为可交付的浏览器格式工厂，18 个工具全部可本地使用。
```

已做完的产品能力：

- 视频：转 GIF、抽帧、压缩、提取音频（压缩/抽音频走 FFmpeg.wasm；GIF 用 `gifenc` 本地编）
- 图片：压缩、格式转换、缩放、水印（Canvas）
- 文档：PDF 合并、拆分、图片转 PDF（`pdf-lib`）
- 开发者：JSON、二维码、Base64、哈希、正则、URL、UUID
- 首页搜索 / 分类 / 最近使用；工具页侧栏；关于页
- 文件只在浏览器处理，不上传
- 首页补了 Hero 示意、分类小图、步骤插图、更大图标、favicon
- 开关脚本：`scripts/start-web.bat` / `stop-web.bat`（及对应 `.ps1`）

---

## 4. 技术要点（改代码前先看）

- 可运行产品在 **`frontend/`**（Next.js 14 App Router，JSX）
- `next.config.mjs` 使用 `output: "export"`，构建产物在 `frontend/out/`（已 gitignore）
- `npm run start` = `npx serve@14 out -p 3000`，不是 `next start`
- FFmpeg.wasm 需要 COOP/COEP：`frontend/vercel.json` 与 `frontend/public/_headers`、`frontend/serve.json`
- 视频压缩使用 mpeg4/`q:v`（WASM 里不要用 libx264 CRF）；音频导出用 AAC/M4A 或 WAV（不要 libmp3lame）
- Google 字体在此网络会失败，已改系统字体
- `backend/`、`worker/`、`deploy/` 是白皮书里的云端预留，**当前上线不要强行接上**
- 工具注册表：`frontend/src/config/tools.js`
- 视觉组件：`frontend/src/components/Visuals.jsx`

---

## 5. 本机开关网页

开：

```powershell
powershell -ExecutionPolicy Bypass -File D:\Projects\Python\AnyKit\scripts\start-web.ps1
```

或双击 `scripts/start-web.bat`。

关：双击 `scripts/stop-web.bat`。

开发：

```powershell
cd D:\Projects\Python\AnyKit\frontend
npm run dev
```

生产静态：

```powershell
cd D:\Projects\Python\AnyKit\frontend
npm run build
npm run start
```

cloudflared 路径：`C:\Program Files (x86)\cloudflared\cloudflared.exe`

---

## 6. 网络（GitHub / 外网，非常重要）

这台 Windows 直连 `github.com` 网页会超时；**必须走本机代理**：

```
HTTP(S)_PROXY = http://127.0.0.1:7892
```

IE 代理已开：`ProxyEnable=1`，`ProxyServer=127.0.0.1:7892`。端口 `7897` 也开着。

对 `gh` / `git push` / `curl github.com` 都要带上代理环境变量，或：

```powershell
git -c http.proxy=http://127.0.0.1:7892 push
```

不要改全局 `git config`。

其他探测结果：

- `github.com` 无代理：超时
- `api.github.com`、`git ls-remote https://github.com/...`：往往能通
- `vercel.com` 能开，`*.vercel.app` **此网络打不开**（匿名 Vercel 部署过，但用户这边访问不了）
- `netlify.app` / `pages.dev` / `surge.sh` / `cloudflare.com`：相对可访问
- 匿名 `vercel deploy` Next 动态路由曾报：`Unable to find lambda for route: /tools/base64-codec`，所以改成静态 `out/` 再传

---

## 7. 未完成 / 下一步建议（优先这个）

1. **长期公网、不依赖这台电脑**  
   不要用 `*.vercel.app` 当国内主入口。优先：Cloudflare Pages（`*.pages.dev`）、Netlify、Surge。前端已是静态导出。  
   Cloudflare Pages 部署目录：`frontend` 构建命令 `npm run build`，输出 `out`。别忘了 `_headers` 里的 COEP/COEP。

2. **固定域名**  
   Quick Tunnel 每次启动 URL 都变。有 Cloudflare 账号可改 named tunnel 或 Pages 自定义域。

3. **GitHub Actions**  
   `.github/workflows/deploy.yml` 已在仓库里，指向 Vercel；因 `vercel.app` 在此网络不可用，部署目标应改成 Pages/Netlify，或让用户在能访问 Vercel 的网络认领。

4. **不要做**  
   不要重写整站；不要把 SaaS 账号/支付/后端强行接到当前上线版；不要 force push `main`。

---

## 8. 新对话建议开场

```text
继续 AnyKit。仓库 D:\Projects\Python\AnyKit，GitHub https://github.com/ponp-shi/AnyKit 已推送。
先读交接文档（或本消息），优先做「不依赖本机的长期公网托管」（Cloudflare Pages / Netlify，不要用 vercel.app）。
GitHub 操作必须走代理 http://127.0.0.1:7892。回复用简体中文。
```
