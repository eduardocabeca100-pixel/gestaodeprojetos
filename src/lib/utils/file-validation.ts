export const allowedDocumentExtensions = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "docx",
  "xlsx",
  "csv",
  "zip",
] as const;

export const blockedVideoExtensions = [
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
] as const;

export function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function isBlockedVideo(fileName: string) {
  return blockedVideoExtensions.includes(
    getFileExtension(fileName) as (typeof blockedVideoExtensions)[number],
  );
}

export function isAllowedDocument(fileName: string) {
  const extension = getFileExtension(fileName);

  return allowedDocumentExtensions.includes(
    extension as (typeof allowedDocumentExtensions)[number],
  );
}
