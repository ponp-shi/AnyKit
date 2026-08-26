let ffmpegPromise = null;

export async function getFFmpeg(onLog) {
  if (!ffmpegPromise) {
    ffmpegPromise = loadFFmpeg(onLog).catch((error) => {
      ffmpegPromise = null;
      throw error;
    });
  }
  return ffmpegPromise;
}

async function loadFFmpeg(onLog) {
  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);
  const ffmpeg = new FFmpeg();
  if (onLog) ffmpeg.on("log", ({ message }) => onLog(message));
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  return ffmpeg;
}

export async function transcode(files, buildArgs, onStatus) {
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFFmpeg();
  const outputs = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    onStatus?.(`正在处理 ${index + 1} / ${files.length}：${file.name}`);
    const inputName = `input-${index}${extension(file.name) || ".bin"}`;
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    const job = buildArgs(file, inputName, index);
    await ffmpeg.exec(job.args);
    const data = await ffmpeg.readFile(job.output);
    outputs.push({
      name: job.downloadName,
      blob: new Blob([data], { type: job.mime }),
    });
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(job.output).catch(() => {});
  }
  return outputs;
}

function extension(name) {
  const match = name.match(/\.[^/.]+$/);
  return match ? match[0] : "";
}
