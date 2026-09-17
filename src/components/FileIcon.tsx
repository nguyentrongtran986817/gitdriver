import React from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code2,
  FileSpreadsheet,
  FileCode,
  FileQuestion,
  Presentation,
  File
} from 'lucide-react';
import { FileCategory } from '../types';

interface FileIconProps {
  category: FileCategory;
  extension: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ category, extension, className = 'w-6 h-6' }) => {
  const ext = extension.toLowerCase();

  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className={`${className} text-emerald-600`} />;
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return <Presentation className={`${className} text-orange-500`} />;
  }
  if (ext === 'pdf') {
    return <FileText className={`${className} text-rose-600`} />;
  }
  if (['doc', 'docx'].includes(ext)) {
    return <FileText className={`${className} text-blue-600`} />;
  }

  switch (category) {
    case 'image':
      return <Image className={`${className} text-pink-500`} />;
    case 'video':
      return <Video className={`${className} text-purple-600`} />;
    case 'audio':
      return <Music className={`${className} text-amber-500`} />;
    case 'archive':
      return <Archive className={`${className} text-emerald-600`} />;
    case 'code':
      return <Code2 className={`${className} text-cyan-600`} />;
    case 'document':
      return <FileText className={`${className} text-blue-500`} />;
    default:
      return <File className={`${className} text-slate-400`} />;
  }
};
