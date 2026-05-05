export const SUPPORTED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;

export const SUPPORTED_CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const SUPPORTED_CV_ACCEPT = [
  ...SUPPORTED_CV_EXTENSIONS,
  ...SUPPORTED_CV_MIME_TYPES,
].join(',');

export const SUPPORTED_CV_FORMAT_LABEL = 'PDF, DOC, or DOCX';

export function getFileExtension(fileName: string): string {
  return fileName.match(/(\.[a-z0-9]+)$/i)?.[1]?.toLowerCase() || '';
}

export function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, '');
}

export function isSupportedCvFile(file: File): boolean {
  const extension = getFileExtension(file.name);
  if (SUPPORTED_CV_EXTENSIONS.some((supportedExtension) => supportedExtension === extension)) {
    return true;
  }

  const mimeType = file.type.trim().toLowerCase();
  return SUPPORTED_CV_MIME_TYPES.some((supportedMimeType) => supportedMimeType === mimeType);
}
