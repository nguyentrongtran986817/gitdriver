import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Star,
  Trash2,
  Github,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  FileText,
  Info,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, formatDate } from '../utils/fileHelpers';
import { FileIcon } from './FileIcon';
import { getBlob } from '../utils/storageDb';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
  onToggleStar: (fileId: string) => void;
  onTrash: (fileId: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onDownload,
  onToggleStar,
  onTrash,
}) => {
  const [copied, setCopied] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (file?.localBlobKey) {
      getBlob(file.localBlobKey).then((blob) => {
        if (blob && active) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      });
    } else {
      setBlobUrl(null);
    }
    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file?.id, file?.localBlobKey]);

  if (!file) return null;

  const isGithub = file.storageTarget.startsWith('github');

  const handleCopyLink = () => {
    const link = file.githubDownloadUrl || window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center flex-shrink-0">
              <FileIcon category={file.category} extension={file.extension} className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 truncate text-sm sm:text-base" title={file.name}>
                {file.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{formatBytes(file.size)}</span>
                <span>•</span>
                <span>{formatDate(file.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => onToggleStar(file.id)}
              className={`p-2 rounded-xl border transition-colors ${
                file.isStarred
                  ? 'bg-amber-50 border-amber-200 text-amber-500'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'
              }`}
              title={file.isStarred ? 'Bỏ gắn sao' : 'Gắn sao'}
            >
              <Star className={`w-4 h-4 ${file.isStarred ? 'fill-amber-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Preview Pane */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Visual Preview */}
          <div className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-center min-h-[220px]">
            {file.category === 'image' && (file.thumbnailUrl || blobUrl) ? (
              <img
                src={blobUrl || file.thumbnailUrl}
                alt={file.name}
                className="max-h-72 max-w-full rounded-xl object-contain shadow-sm"
              />
            ) : file.category === 'video' && blobUrl ? (
              <video src={blobUrl} controls className="max-h-72 max-w-full rounded-xl" />
            ) : file.category === 'audio' && blobUrl ? (
              <audio src={blobUrl} controls className="w-full max-w-md" />
            ) : file.previewText ? (
              <div className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl max-h-64 overflow-y-auto leading-relaxed border border-slate-800">
                <pre className="whitespace-pre-wrap">{file.previewText}</pre>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-slate-200 mx-auto mb-3 flex items-center justify-center">
                  <FileIcon category={file.category} extension={file.extension} className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Xem trước tệp tin</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  {file.isLargeFile
                    ? 'Tệp tin dung lượng lớn lưu trữ trên GitHub Releases. Bạn có thể tải xuống ngay để mở trên máy tính.'
                    : 'Nhấn nút "Tải xuống" bên dưới để lưu tệp về thiết bị của bạn.'}
                </p>
              </div>
            )}
          </div>

          {/* File Metadata Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Thông tin kỹ thuật</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Định dạng (MIME):</span>
                  <span className="font-mono text-slate-800">{file.mimeType || file.extension}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kích thước chính xác:</span>
                  <span className="font-mono text-slate-800">{file.size.toLocaleString('vi-VN')} Bytes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời gian tạo:</span>
                  <span className="text-slate-800">{formatDate(file.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nguồn & Dung lượng lưu trữ</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cơ chế lưu trữ:</span>
                  {isGithub ? (
                    <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                      <Github className="w-3 h-3" />
                      {file.isLargeFile ? 'GitHub Releases (2GB)' : 'GitHub Repo'}
                    </span>
                  ) : (
                    <span className="font-mono text-blue-700 font-semibold flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      IndexedDB (Local)
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Mức dung lượng:</span>
                  <span className="font-semibold text-slate-800">
                    {file.isLargeFile ? 'Tệp dữ liệu lớn (>50MB)' : 'Tệp tiêu chuẩn'}
                  </span>
                </div>
                {file.githubDownloadUrl && (
                  <div className="truncate pt-1 text-[11px] text-blue-600">
                    <a
                      href={file.githubDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      <span>Mở link gốc GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description & Tags */}
          {file.description && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
              <span className="font-semibold text-slate-700 block mb-1">Mô tả tệp tin:</span>
              <p className="text-slate-600 leading-relaxed">{file.description}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép link' : 'Sao chép link'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onTrash(file.id);
                onClose();
              }}
              className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Chuyển vào thùng rác</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 text-xs font-medium"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => onDownload(file)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Tải xuống tệp tin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
