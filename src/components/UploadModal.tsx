import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  File,
  Github,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FolderUp,
  Layers,
  Sparkles,
  Database
} from 'lucide-react';
import { FileCategory, FileItem, GitHubConfig, StorageTarget } from '../types';
import { formatBytes, getFileCategory, getFileExtension } from '../utils/fileHelpers';
import { FileIcon } from './FileIcon';
import { saveBlob } from '../utils/storageDb';
import { uploadLargeFileToGitHubRelease, uploadFileToRepoContents } from '../utils/githubApi';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  gitHubConfig: GitHubConfig;
  onFileUploaded: (newFiles: FileItem[]) => void;
  currentFolderId: string | null;
  onOpenGitHubSettings: () => void;
  defaultTarget?: 'auto' | 'github_release' | 'local';
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  gitHubConfig,
  onFileUploaded,
  currentFolderId,
  onOpenGitHubSettings,
  defaultTarget = 'auto',
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetType, setTargetType] = useState<'auto' | 'github_release' | 'local'>(defaultTarget);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setErrorMsg(null);
    const createdFileItems: FileItem[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadStatus(`Đang tải tệp ${i + 1}/${selectedFiles.length}: ${file.name}...`);

      const ext = getFileExtension(file.name);
      const category = getFileCategory(file.name, file.type);
      const isLarge = file.size > 50 * 1024 * 1024; // > 50MB

      // Xác định storage destination
      let destination: StorageTarget = 'local_indexeddb';
      if (targetType === 'github_release') {
        destination = 'github_release';
      } else if (targetType === 'auto') {
        destination = gitHubConfig.isConnected && isLarge ? 'github_release' : 'local_indexeddb';
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      let githubAssetId: number | undefined;
      let githubDownloadUrl: string | undefined;
      let localBlobKey: string | undefined;

      try {
        if (destination === 'github_release') {
          if (!gitHubConfig.isConnected || !gitHubConfig.token) {
            throw new Error('Chưa kết nối GitHub Token. Vui lòng kết nối tài khoản GitHub hoặc chọn lưu trữ cục bộ.');
          }

          // Tải tệp lớn lên GitHub Release Assets
          const asset = await uploadLargeFileToGitHubRelease(
            gitHubConfig,
            file,
            file.name,
            (percent) => {
              setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
            }
          );

          githubAssetId = asset.id;
          githubDownloadUrl = asset.browser_download_url;
        } else {
          // Lưu vào IndexedDB cục bộ (Hỗ trợ Blobs kích thước lớn không giới hạn 5MB)
          localBlobKey = `blob-${fileId}`;
          setUploadProgress((prev) => ({ ...prev, [file.name]: 50 }));
          await saveBlob(localBlobKey, file);
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        }

        const newFileItem: FileItem = {
          id: fileId,
          name: file.name,
          size: file.size,
          category,
          mimeType: file.type || 'application/octet-stream',
          extension: ext,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          folderId: currentFolderId,
          isStarred: false,
          isTrashed: false,
          storageTarget: destination,
          isLargeFile: isLarge || destination === 'github_release',
          githubAssetId,
          githubDownloadUrl,
          localBlobKey,
          description: description.trim() || undefined,
          tags: [
            ext,
            destination === 'github_release' ? 'github-release-asset' : 'indexeddb',
            isLarge ? 'large-file' : 'standard-file',
          ],
        };

        createdFileItems.push(newFileItem);
      } catch (err: any) {
        console.error('Lỗi khi tải tệp lên:', err);
        setErrorMsg(`Lỗi khi tải "${file.name}": ${err.message || 'Lỗi không xác định'}`);
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    onFileUploaded(createdFileItems);
    onClose();
  };

  const totalBytesSelected = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Tải lên tệp tin vào Drive
              </h3>
              <p className="text-xs text-slate-500">
                Hỗ trợ tệp đơn, nhiều tệp, và dữ liệu dung lượng lớn đến 2GB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Storage Destination Selector */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Nơi lưu trữ tệp tin</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('auto')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  targetType === 'auto'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tự động tối ưu</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tệp lớn &gt;50MB tự đẩy lên GitHub Release, tệp nhỏ lưu cục bộ siêu tốc.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('github_release')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  targetType === 'github_release'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-100'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs mb-0.5">
                  <span className="flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-slate-900" />
                    <span>GitHub Release (2GB)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-mono">
                    2GB/file
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Kho lưu trữ đám mây GitHub cho Datasets, Videos, Zips lớn.
                </p>
              </button>
            </div>

            {targetType === 'github_release' && !gitHubConfig.isConnected && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Bạn chưa cấu hình GitHub Token và Repository.</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenGitHubSettings}
                  className="font-semibold text-blue-600 hover:underline flex-shrink-0 ml-2"
                >
                  Cấu hình ngay
                </button>
              </div>
            )}
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 text-blue-600 flex items-center justify-center mx-auto mb-2.5">
              <FolderUp className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-800 text-xs sm:text-sm">
              Kéo thả tệp tin vào đây, hoặc <span className="text-blue-600 underline">chọn từ thiết bị</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Hỗ trợ mọi định dạng: ZIP, RAR, MP4, PDF, DOCX, PNG, CSV, ISO, v.v.
            </p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>
                  Đã chọn {selectedFiles.length} tệp ({formatBytes(totalBytesSelected)})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-rose-600 hover:underline font-normal text-[11px]"
                  disabled={uploading}
                >
                  Xoá tất cả
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => {
                  const percent = uploadProgress[file.name] || 0;
                  return (
                    <div
                      key={idx}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <File className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate text-xs" title={file.name}>
                            {file.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatBytes(file.size)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {uploading ? (
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full transition-all duration-200"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Ghi chú / Mô tả tệp (Tùy chọn)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả tóm tắt cho tệp tin này..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-xs"
            />
          </div>

          {/* Status and Error Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {uploading && uploadStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>{uploadStatus}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 text-xs font-medium disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleStartUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Đang tải lên...' : `Tải lên ${selectedFiles.length} tệp`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
