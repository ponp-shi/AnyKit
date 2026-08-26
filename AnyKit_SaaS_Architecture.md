# AnyKit 商业化全栈开发白皮书 (V4 生产落地与工具矩阵版)

这份文档是 AnyKit 产品的最高层级【系统架构蓝图 + 工具规划库】。不仅包含了多工具异步架构、账号鉴权体系、SaaS 商业化变现与云存储优化，还**新增了完整的“高频工具矩阵规划”**，涵盖音视频、图像、PDF 文档及开发者工具，并附带底层的 Python/开源库实现方案。

可以直接将此 Markdown 发送给你的 AI Agent 作为开发总纲。

---

## 1. 核心架构演进 (从 MVP 到生产环境)

为了让 AnyKit 能承载海量用户且节省高昂的服务器带宽费用，我们采用 **“云存储预签名 (Pre-signed URL) 机制 + SSR 前端 + 策略模式 Worker”** 的解耦架构。

### 1.1 核心痛点与解决方案
*   **痛点 1：服务器带宽被打满。** 如果用户上传 500MB 的视频到 API 服务器，服务器再转存，带宽极易崩溃。
    *   *方案:* **前端直传云存储 (S3/R2)**。后端只负责“颁发上传令牌 (Presigned URL)”，大文件直接入库，不经过 API 服务器。
*   **痛点 2：SEO (搜索引擎优化) 获客。** 工具站 90% 的流量来自 Google/Baidu 搜索。如果是纯 React (SPA)，搜索引擎爬虫很难抓取内容。
    *   *方案:* 前端采用 **Next.js (React)** 实现服务端渲染 (SSR)，每一个工具页面（如 `/tools/video-to-gif`）都有独立且友好的 SEO Meta 标签和教程。
*   **痛点 3：工具扩充困难。** 每加一个工具就要改一堆后端 API。
    *   *方案:* **策略模式 + 配置文件驱动**。前端靠 `tools.json` 自动渲染 UI，Worker 层靠统一的路由器处理任务，后端 API 网关完全不需要修改代码。

---

## 2. 终极技术栈全景图

| 层级 | 技术选型 | 选用原因 / 备注 |
| :--- | :--- | :--- |
| **前端 (Web)** | **Next.js** + Tailwind CSS + Zustand | SSR 完美解决 SEO；Zustand 管理用户登录与算力额度；Tailwind 极速建站 |
| **后端 (API)** | **FastAPI** (Python) | 纯异步高性能，自动生成 Swagger 文档，极其适合做 SaaS 调度网关 |
| **任务队列** | **Celery** + **Redis** | Python 生态最成熟的异步队列，防止视频/PDF等重计算任务阻塞主线程 |
| **底层处理引擎**| **FFmpeg** / **OpenCV** / **Pillow** / **rembg** | 强依赖底层 C/C++ 或 Python 图像库，Worker 节点统一封装 |
| **数据库 (DB)** | **PostgreSQL** + SQLAlchemy + Alembic | 结构化存储用户、订单、积分扣费日志，SaaS 订阅的首选 |
| **云存储** | **Cloudflare R2** / **AWS S3** | 强烈推荐 Cloudflare R2（**无出口流量费！**极度适合音视频大文件处理） |
| **鉴权体系** | JWT + OAuth2 (Google / GitHub) | 支持邮箱登录的同时，必须支持第三方快捷登录以提升注册转化率 |
| **支付与商业化**| Stripe (海外) / 微信 & 支付宝 (国内) | 采用 Webhook 异步回调机制充值“算力额度 (Credits)” |

---

## 3. 项目终极文件结构 (Monorepo)

```text
AnyKit/
├── frontend/                   # Next.js 生产级前端 (SSR)
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   │   ├── tools/[tool_id]/# 动态工具页面 (如 /tools/video-to-gif)
│   │   │   ├── (auth)/         # /login, /register
│   │   │   ├── dashboard/      # 用户中心 (历史处理记录、账单、购买积分)
│   │   │   └── page.jsx        # 首页 (工具矩阵展示)
│   │   ├── components/         # Dropzone文件上传、进度条、导航栏
│   │   ├── config/             # tools.json (全局工具注册表)
│   │   ├── store/              # Zustand 全局状态 (User, Credits)
│   │   └── lib/                # S3 直传工具类、Axios 响应拦截器
│   └── next.config.js
│
├── backend/                    # FastAPI 后端网关
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── auth.py         # JWT 登录注册、Google OAuth
│   │   │   ├── tasks.py        # 任务提交、状态轮询/ WebSocket
│   │   │   ├── storage.py      # 获取 S3 预签名直传 URL
│   │   │   └── billing.py      # Stripe/微信支付回调 Webhook
│   │   ├── core/               # JWT 密钥、限流 (SlowAPI)、中间件
│   │   ├── db/                 # Postgres 数据库连接池
│   │   └── models/             # User, Task, Order 数据模型
│   └── requirements.txt
│
├── worker/                     # Celery 分布式处理节点 (干脏活)
│   ├── tasks/
│   │   ├── base.py             # 任务基类 (负责下载 S3 原文件与上传结果)
│   │   ├── video_tasks.py      # 视频转换、抽帧、去水印
│   │   ├── image_tasks.py      # 抠图、压缩、格式转换
│   │   ├── pdf_tasks.py        # PDF 合并、拆分、转 Word
│   │   └── dev_tasks.py        # 代码/文本类轻量任务
│   ├── celery_app.py           # Celery 实例配置
│   └── Dockerfile              # 预装 FFmpeg, ImageMagick 等环境
│
├── deploy/                     # 容器化与运维
│   ├── docker-compose.yml      # 开发/测试环境一键启动
│   └── nginx.conf              # 生产网关反向代理与 HTTPS
└── README.md
```

---

## 4. AnyKit 工具矩阵规划与技术实现库 (工具储备库)

为了方便你后续不断扩充 AnyKit，以下为你规划好 5 大类、共 20+ 个高频实用工具及其底层的 Python / 开源实现技术：

### 4.1 视频类工具 (重算力，计算耗时长)
1.  **视频转 GIF (Video to GIF)**
    *   *功能:* 自定义帧率 (FPS)、分辨率、裁剪区域，生成高压缩比 GIF。
    *   *底层依赖:* `FFmpeg` (`ffmpeg -i input.mp4 -vf "fps=10,scale=480:-1" output.gif`)
2.  **视频抽帧 (Video Frame Extractor)**
    *   *功能:* 按时间间隔（如每秒1帧）或总帧数提取高清 PNG/JPG，打包 Zip 下载。
    *   *底层依赖:* `ffmpeg-python` 或 `OpenCV` (`cv2.VideoCapture`)
3.  **视频格式转换与压缩 (Video Converter & Compressor)**
    *   *功能:* MP4 / WEBM / MOV / AVI 互转，调节 CRF 参数控制压缩质量与文件体积。
    *   *底层依赖:* `FFmpeg` (H.264 / H.265 / AV1 编码)
4.  **视频提取音频 (Video to Audio)**
    *   *功能:* 从视频中快速剥离 MP3 / WAV / AAC 音轨。
    *   *底层依赖:* `FFmpeg` (`ffmpeg -i input.mp4 -vn -acodec libmp3lame output.mp3`)
5.  **网页视频/音频解析下载 (Video Downloader)**
    *   *功能:* 输入网页链接，解析并下载无水印视频（如 B站、YouTube 等）。
    *   *底层依赖:* `yt-dlp` (Python 开源神器)

### 4.2 图像类工具 (中等算力，需求极其高频)
1.  **AI 智能一键抠图/去背景 (AI Background Remover)**
    *   *功能:* 传图自动识别人像/物品，去除背景导出透明 PNG。
    *   *底层依赖:* `rembg` (基于 ONNXRuntime 的开源 AI 抠图模型)
2.  **图片无损/有损压缩 (Image Compressor)**
    *   *功能:* PNG / JPG / WEBP 极高压缩率，不伤肉眼画质。
    *   *底层依赖:* `Pillow` (PIL) + `pngquant` / `mozjpeg`
3.  **图片格式大一统转换 (Image Format Converter)**
    *   *功能:* HEIC (苹果格式) / AVIF / WEBP / PNG / JPG 任意互转。
    *   *底层依赖:* `Pillow` + `pillow-heif`
4.  **图片批量水印加减 (Watermark Tool)**
    *   *功能:* 文字/盲水印/图片水印平铺添加。
    *   *底层依赖:* `Pillow` 或 `OpenCV`

### 4.3 PDF 与文档类工具 (办公刚需，极易变现)
1.  **PDF 合并与拆分 (PDF Merge & Split)**
    *   *功能:* 多 PDF 文件合并为一个，或提取指定页码导出。
    *   *底层依赖:* `PyPDF2` 或 `pypdf`
2.  **PDF 转图片 / 图片转 PDF (PDF <-> Images)**
    *   *功能:* 将 PDF 逐页渲染为高清 PNG，或将多张照片合成 PDF。
    *   *底层依赖:* `pdf2image` (依赖 `poppler`) + `img2pdf`
3.  **PDF 压缩 (PDF Compress)**
    *   *功能:* 降低 PDF 内置图片 DPI 以缩小文档体积。
    *   *底层依赖:* `Ghostscript` CLI 或 `pikepdf`

### 4.4 音频类工具 (中轻度算力)
1.  **音频格式转换与裁剪 (Audio Converter & Cutter)**
    *   *功能:* MP3 / WAV / FLAC / M4A 转换与精确毫秒级裁剪。
    *   *底层依赖:* `pydub` + `FFmpeg`
2.  **AI 语音转文字 / 字幕提取 (Audio to Text / ASR)**
    *   *功能:* 上传音频生成 SRT 字幕或 TXT 文本。
    *   *底层依赖:* `faster-whisper` (OpenAI Whisper 本地推理版)

### 4.5 文本与开发者工具 (极轻量，前端/API 直出，无算力压力)
1.  **JSON 格式化 / 修复 / CSV 互转**
    *   *底层依赖:* 前端 JS (`JSON.parse`) 或 Python `json` + `pandas`
2.  **正则表达式测试与可视化 (Regex Tester)**
    *   *底层依赖:* 前端 JS 正则引擎
3.  **二维码生成与带 Logo 格式化 (QR Code Generator)**
    *   *底层依赖:* `qrcode` (Python) 或 前端 `qrcode.react`
4.  **Base64 / JWT / URL 编解码器**
    *   *底层依赖:* 前端纯 JS 实现

---

## 5. 核心商业流向设计 (SaaS 级 Workflow)

为了让系统不宕机、不被薅羊毛且成本最低，采用**“云存储直传 + 算力预扣 + 异步回调”**：

1.  **准备上传 (鉴权+扣费预检):** 用户选好文件，前端请求 `POST /api/v1/storage/presigned-url`。
    *   *后端逻辑:* 校验 JWT -> 检查 `user.credits` 余额 -> 生成 S3/R2 上传 URL 返回给前端。
2.  **前端直传云端:** 前端拿到签名 URL，直接将大文件推送到 Cloudflare R2。（**完美避开 API 服务器带宽**）。
3.  **触发任务:** 上传完成后，前端请求 `POST /api/v1/tasks` (传入 S3 文件 Key、`tool_type` 和处理参数)。
4.  **排队与预扣费:** FastAPI 生成 `task_id`，将任务丢入 Redis，并**预扣除用户对应算力积分**。
5.  **Worker 节点干活:** Worker 拿到任务 -> 从 S3 下载原文件 -> 调用 FFmpeg / rembg 处理 -> 将结果存回 S3 -> 更新 DB 状态为 `SUCCESS`。
6.  **展示下载与历史通知:** 前端通过轮询或 WebSocket 收到完成通知，显示下载按钮。用户也可在 Dashboard 随时重新下载（7天内有效）。

---

## 6. 数据库设计 (PostgreSQL)

*   **`users` 表**: 存储 `id`, `email`, `hashed_password`, `tier` ('free', 'pro'), `credits` (算力积分), `google_id`, `created_at`
*   **`tasks` 表**: 存储 `id`, `user_id`, `tool_type` (如 'video_to_gif'), `status` ('pending', 'processing', 'success', 'failed'), `input_s3_key`, `output_s3_key`, `credits_cost`, `created_at`
*   **`orders` 表**: 存储 `id`, `user_id`, `amount`, `currency`, `credits_added`, `payment_provider` ('stripe', 'wechat'), `status` ('paid', 'pending')
*   **`tools_config` 表 (可选)**: 动态配置每个工具消耗的 `credits` 数量与上下架状态。

---

## 7. 商业化模式与防薅羊毛策略

### 7.1 商业化收费模式 (积分算力制 Pay-as-you-go)
*   **注册赠送:** 新用户注册送 50 Credits（免费体验）。
*   **工具阶梯定价:**
    *   轻量工具（二维码、格式化）：0 Credits (免费)
    *   中度工具（图片压缩、PDF合并）：1 ~ 2 Credits
    *   重度工具（视频转 GIF、视频抽帧）：3 ~ 5 Credits
    *   AI 工具（AI 抠图、Whisper 语音转文字）：5 ~ 10 Credits
*   **充值套餐 (Stripe / 微信支付):**
    *   **体验包:** $4.99 = 500 Credits
    *   **专业包:** $14.99 = 2000 Credits (赠送 Pro 标志 + 优先队列排队)

### 7.2 安全与成本控制 (运维必备)
1.  **S3 生命周期策略 (Lifecycle Rule):** 视频/图片极占空间。云存储设置规则：所有 `outputs/` 目录下的成品文件，**保留 7 天后由云端自动彻底删除**，避免存储费爆表。
2.  **API 接口限流 (Rate Limiting):** 使用 SlowAPI 限制 IP 请求频率，防止脚本恶意刷接口。
3.  **文件真实类型校验 (Magic Byte Check):** Worker 在处理前，使用 `python-magic` 校验文件二进制头，防止用户上传改了后缀名的恶意木马文件。

---

## 8. 给 AI Agent 的分阶段开发指令 (Milestones)

向你的 Agent 发送任务时，请严格按照以下 Milestone 拆分，确保项目按部就班地落地：

*   **Milestone 1: 项目骨架与 Docker 环境搭建**
    *   初始化 Next.js (前端) 与 FastAPI (后端) Monorepo 目录。
    *   编写 `docker-compose.yml` (Postgres, Redis, FastAPI, Celery Worker)。
*   **Milestone 2: 鉴权与用户积分系统**
    *   实现 FastAPI + JWT 的注册登录、密码哈希。
    *   建立 Postgres 的 User 与 Task 数据表。
    *   前端实现 Auth 状态持久化 (Zustand) 与登录页面。
*   **Milestone 3: S3 直传与 Celery 核心流水线**
    *   配置 Cloudflare R2 / MinIO 预签名 URL 接口。
    *   编写 Celery 通用基类，实现首批工具：**视频转 GIF** 与 **视频抽帧**。
    *   前端实现通用文件上传 Dropzone 组件与任务轮询。
*   **Milestone 4: 工具矩阵扩充 (根据工具库逐步添加)**
    *   接入 `rembg` 实现 AI 抠图。
    *   接入 `pypdf` 实现 PDF 合并/拆分。
*   **Milestone 5: 商业化闭环与部署**
    *   接入 Stripe / 微信支付 Webhook 充值 Credits。
    *   配置 Nginx 反向代理与 SSL 证书，准备上线。
