import { cardAppearance } from "./card-themes";
// Creates a local image for the author's explicit export; no public post URL is created.
export async function makeShareCard(
  text: string,
  theme = "linen",
  image?: string | null,
  generated = false,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not create the image.");
  ctx.font = "300 48px Arial, sans-serif";
  const lines: string[] = [];
  for (const paragraph of text.replace(/\n{3,}/g, "\n\n").split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (ctx.measureText((line ? line + " " : "") + word).width <= 880) {
        line += (line ? " " : "") + word;
        continue;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      for (const char of word) {
        if (ctx.measureText(line + char).width > 880) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    lines.push(line);
  }
  // Keep every original word; longer entries produce a taller image.
  const fontSize = 48;
  canvas.height = Math.max(
    1350,
    Math.ceil(650 + lines.length * fontSize * 1.4),
  );
  const look = cardAppearance(theme, image);
  ctx.fillStyle = look.background;
  ctx.fillRect(0, 0, 1080, canvas.height);
  if (look.image) {
    const backdrop = new Image();
    backdrop.src = look.image;
    await backdrop.decode();
    const scale = Math.max(
      1080 / backdrop.naturalWidth,
      canvas.height / backdrop.naturalHeight,
    );
    const w = backdrop.naturalWidth * scale,
      h = backdrop.naturalHeight * scale;
    ctx.drawImage(backdrop, (1080 - w) / 2, (canvas.height - h) / 2, w, h);
    ctx.fillStyle = "rgba(0,0,0,.62)";
    ctx.fillRect(0, 0, 1080, canvas.height);
  }
  const logo = new Image();
  logo.src =
    look.foreground === "#ffffff"
      ? "/gratitude-logo-light.svg"
      : "/gratitude-logo.svg";
  await logo.decode();
  const scale = Math.min(100 / logo.naturalWidth, 100 / logo.naturalHeight);
  const width = logo.naturalWidth * scale,
    height = logo.naturalHeight * scale;

  ctx.globalCompositeOperation =
    look.foreground === "#ffffff" ? "screen" : "multiply";
  ctx.drawImage(logo, 540 - width / 2, 130 - height / 2, width, height);
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.fillStyle = look.foreground;
  ctx.textAlign = "center";
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText("GRATITUDE CIRCLES", 540, 230);
  ctx.fillStyle = look.foreground;
  ctx.font = "300 48px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.font = `300 ${fontSize}px Arial, sans-serif`;
  const lineHeight = fontSize * 1.4;
  const top =
    350 + Math.max(0, (canvas.height - 610 - lines.length * lineHeight) / 2);
  lines.forEach((line, index) =>
    ctx.fillText(line, 540, top + index * lineHeight),
  );
  ctx.strokeStyle = look.foreground;
  ctx.beginPath();
  ctx.moveTo(100, canvas.height - 170);
  ctx.lineTo(980, canvas.height - 170);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.fillStyle = look.foreground;
  ctx.font = "22px Arial, sans-serif";
  ctx.fillText("Notice the good. Together.", 540, canvas.height - 110);
  ctx.font = "15px Arial, sans-serif";
  ctx.fillText("MADE WITH LOVE BY NAI", 540, canvas.height - 70);
  if (generated || theme === "woodland") {
    ctx.font = "14px Arial, sans-serif";
    ctx.fillText("AI BACKGROUND", 540, canvas.height - 30);
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not create the image.")),
      "image/png",
    ),
  );
}
