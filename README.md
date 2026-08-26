# AnyKit

浏览器里的格式工厂。视频、图片、PDF 和开发者小工具集中在一个网址里，打开就能用。文件只在当前设备处理，不会上传到服务器。

## 现在可用

- 视频：转 GIF、抽帧、压缩、提取音频
- 图片：压缩、格式转换、缩放、水印
- 文档：PDF 合并、拆分、图片转 PDF
- 开发者：JSON、二维码、Base64、哈希、正则、URL、UUID

## 本地运行

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。

生产构建：

```bash
cd frontend
npm run build
npm start
```

## 产品说明

这是可交付的 Web 产品，不是桌面安装包。任意能上网的手机、平板、电脑打开同一网址即可使用。音视频压缩首次会加载开源 FFmpeg 编码器（约 25MB），之后仍在本地运行。

仓库里的 `backend/` 和 `worker/` 是后续云端大文件处理的预留架构，当前上线版本不依赖它们。
