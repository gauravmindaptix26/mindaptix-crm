import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function saveUploadedFile(file: File | null, folder: string) {
  if (!file || file.size === 0) {
    return null;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${sanitizeName(file.name || "file")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  const filePath = path.join(uploadDir, safeName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, bytes);

  return {
    fileName: file.name || safeName,
    fileUrl: `/uploads/${folder}/${safeName}`,
  };
}

function sanitizeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}
