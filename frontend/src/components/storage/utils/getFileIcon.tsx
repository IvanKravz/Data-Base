import { FileIcon, FileText, FileImage, FileVideo, FileAudio, FileArchive } from 'lucide-react';

export function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return FileImage;
  }
  if (mimeType.startsWith('video/')) {
    return FileVideo;
  }
  if (mimeType.startsWith('audio/')) {
    return FileAudio;
  }
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
    return FileArchive;
  }
  if (mimeType.includes('text') || mimeType.includes('document')) {
    return FileText;
  }
  return FileIcon;
}