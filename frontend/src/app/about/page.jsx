import Link from "next/link";
import SiteNav from "@/components/SiteNav";

export const metadata = {
  title: "关于 AnyKit",
  description: "AnyKit 如何处理文件，以及当前版本包含哪些能力。",
};

export default function AboutPage() {
  return (
    <div className="site-shell">
      <SiteNav />
      <main className="about-page">
        <p className="eyebrow">ANYKIT / 关于</p>
        <h1>一个能随手打开的格式工厂。</h1>
        <p>AnyKit 把高频转换、压缩、整理工具放进浏览器。目标不是再做一个需要安装的桌面软件，而是你在任何能上网的设备上打开网址就能用。</p>
        <section>
          <h2>文件去哪了</h2>
          <p>视频、图片、PDF 都在当前浏览器里处理，不会上传到 AnyKit 服务器。关掉标签页后，临时文件由浏览器回收。音视频压缩首次会从公共 CDN 加载开源 FFmpeg 编码器，之后仍在本地运行。</p>
        </section>
        <section>
          <h2>现在能做什么</h2>
          <ul>
            <li>视频：转 GIF、抽帧、压缩、提取音频</li>
            <li>图片：压缩、格式转换、缩放、水印</li>
            <li>文档：PDF 合并、拆分、图片转 PDF</li>
            <li>开发者：JSON、二维码、Base64、哈希、正则、URL、UUID</li>
          </ul>
        </section>
        <section>
          <h2>适合怎样用</h2>
          <p>临时转一个 GIF、压一张图、合并几份 PDF、校验文件哈希。大文件受设备内存限制，建议单文件控制在几百 MB 内。需要服务器集群处理超大视频的能力，会作为后续版本提供。</p>
        </section>
        <Link className="button button-dark" href="/#tools">返回工具箱</Link>
      </main>
    </div>
  );
}
