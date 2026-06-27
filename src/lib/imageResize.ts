// Convierte un File de imagen en data URL WebP cuadrado (icono pequeño)
// Por defecto 128x128 → ~3-8 KB. Perfecto para guardar en una columna text
// sin saturar la base de datos.
export async function fileToThumbDataUrl(
  file: File,
  size = 128,
  quality = 0.78,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen");
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  // cover: recorta al cuadrado centrado
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  const dx = (size - w) / 2;
  const dy = (size - h) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, dx, dy, w, h);
  bitmap.close?.();

  // Intenta WebP; si el navegador no lo soporta, usa JPEG
  let url = canvas.toDataURL("image/webp", quality);
  if (!url.startsWith("data:image/webp")) {
    url = canvas.toDataURL("image/jpeg", quality);
  }
  return url;
}