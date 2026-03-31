import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function saveEmployeeDocument(file: File | null) {
  if (!file || file.size === 0) {
    return null;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${sanitizeName(file.name || "document")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "employee-documents");
  const filePath = path.join(uploadDir, safeName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, bytes);

  return {
    documentName: file.name || safeName,
    documentUrl: `/uploads/employee-documents/${safeName}`,
  };
}

function sanitizeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}
