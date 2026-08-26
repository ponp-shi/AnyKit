import "./globals.css";

export const metadata = {
  title: "AnyKit - 浏览器里的格式工厂",
  description: "视频转 GIF、抽帧、压缩、图片处理、PDF 合并拆分、JSON / 二维码等常用工具。文件只在本地处理。",
  applicationName: "AnyKit",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
