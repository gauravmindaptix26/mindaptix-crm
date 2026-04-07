import { saveUploadedFile } from "@/shared/storage/uploads/shared";

export async function saveEmployeeDocument(file: File | null) {
  const savedFile = await saveUploadedFile(file, "employee-documents");

  return savedFile
    ? {
        documentName: savedFile.fileName,
        documentUrl: savedFile.fileUrl,
      }
    : null;
}

