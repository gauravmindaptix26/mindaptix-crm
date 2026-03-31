import { saveUploadedFile } from "@/lib/uploads/shared";

type UploadedAttachment = {
  name: string;
  url: string;
};

export async function saveTaskAttachments(files: File[]) {
  return saveAttachments(files, "task-attachments");
}

export async function saveDsrAttachments(files: File[]) {
  return saveAttachments(files, "dsr-attachments");
}

async function saveAttachments(files: File[], folder: string): Promise<UploadedAttachment[]> {
  const uploaded = await Promise.all(files.filter((file) => file.size > 0).slice(0, 5).map((file) => saveUploadedFile(file, folder)));

  return uploaded
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({
      name: item.fileName,
      url: item.fileUrl,
    }));
}
