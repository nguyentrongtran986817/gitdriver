import React from 'react';
import {
  Folder,
  Star,
  Download,
  Eye,
  MoreVertical,
  Github,
  HardDrive,
  Trash2,
  RotateCcw,
  Edit2,
  ExternalLink,
  Tag
} from 'lucide-react';
import { FileItem, FolderItem } from '../types';
import { formatBytes, formatDate } from '../utils/fileHelpers';
import { FileIcon } from './FileIcon';

interface FileGridProps {
  folders: FolderItem[];
  files: FileItem[];
  selectedFolderId: string | null;
  onOpenFolder: (folderId: string | null) => void;
  onDeleteFolder?: (folderId: string) => void;
  onPreviewFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onToggleStar: (fileId: string) => void;
  onTrashFile: (fileId: string) => void;
  onRestoreFile?: (fileId: string) => void;
  onPermanentDelete?: (fileId: string) => void;
  onRenameFile?: (file: FileItem) => void;
  isTrashView?: boolean;
}

export const FileGrid: React.FC<FileGridProps> = ({
  folders,
  files,
  onOpenFolder,
  onDeleteFolder,
  onPreviewFile,
  onDownloadFile,
  onToggleStar,
  onTrashFile,
  onRestoreFile,
  onPermanentDelete,
  onRenameFile,
  isTrashView = false,
}) => {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      {/* Folders Section (if any and not in trash) */}
      {!isTrashView && folders.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Thư mục ({folders.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onDoubleClick={() => onOpenFolder(folder.id)}
                className="group flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-blue-400 rounded-xl cursor-pointer transition-all shadow-2xs hover:shadow-xs"
              >
                <div
                  className="flex items-center gap-3 min-w-0 flex-1"
                  onClick={() => onOpenFolder(folder.id)}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${folder.color || '#3b82f6'}15` }}
                  >
                    <Folder
                      className="w-5 h-5"
                      style={{ color: folder.color || '#3b82f6' }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                    {folder.name}
                  </span>
                </div>

                {onDeleteFolder && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFolder(folder.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-70 group-hover:opacity-100"
                    title={`Xóa thư mục "${folder.name}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Tệp tin ({files.length})
        </h3>

        {files.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Folder className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">Chưa có tệp tin nào</p>
            <p className="text-xs text-slate-400 mt-1">Kéo thả tệp tin hoặc nhấn "+ Mới" để tải lên</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {files.map((file) => {
              const isGithub = file.storageTarget.startsWith('github');

              return (
                <div
                  key={file.id}
                  className="group relative bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-150 cursor-pointer"
                  onDoubleClick={() => onPreviewFile(file)}
                >
                  {/* Top Bar: Icon + Star & Action Button */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100/80 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <FileIcon category={file.category} extension={file.extension} className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1">
                      {!isTrashView && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar(file.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            file.isStarred
                              ? 'text-amber-500 hover:text-amber-600 scale-105'
                              : 'text-slate-300 hover:text-amber-500'
                          }`}
                          title={file.isStarred ? 'Bỏ gắn sao' : 'Gắn dấu sao'}
                        >
                          <Star className={`w-4 h-4 ${file.isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      )}

                      {/* 3 Dots Menu Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === file.id ? null : file.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Tùy chọn khác"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Menu Dropdown */}
                        {activeMenuId === file.id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs text-slate-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!isTrashView ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onPreviewFile(file);
                                  }}
                                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 text-left"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Xem chi tiết / Phát video</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onToggleStar(file.id);
                                  }}
                                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 text-left text-amber-600 font-medium"
                                >
                                  <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
                                  <span>{file.isStarred ? 'Bỏ gắn dấu sao' : 'Gắn dấu sao'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onDownloadFile(file);
                                  }}
                                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 text-left font-medium text-slate-900"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Tải xuống</span>
                                </button>
                                {onRenameFile && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onRenameFile(file);
                                    }}
                                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 text-left"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Đổi tên</span>
                                  </button>
                                )}
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onTrashFile(file.id);
                                  }}
                                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-600 text-left"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{isGithub ? 'Xoá tệp (Đồng bộ mọi máy)' : 'Chuyển vào thùng rác'}</span>
                                </button>
                                {isGithub && onPermanentDelete && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onPermanentDelete(file.id);
                                    }}
                                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-100 text-rose-700 text-left font-medium"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                                    <span>Xoá vĩnh viễn khỏi GitHub</span>
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                {onRestoreFile && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onRestoreFile(file.id);
                                    }}
                                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-emerald-50 text-emerald-700 text-left font-medium"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Khôi phục tệp</span>
                                  </button>
                                )}
                                {onPermanentDelete && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onPermanentDelete(file.id);
                                    }}
                                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-600 text-left"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Xoá vĩnh viễn</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* File Name & Preview snippet */}
                  <div className="mb-3" onClick={() => onPreviewFile(file)}>
                    <h4
                      className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 break-all"
                      title={file.name}
                    >
                      {file.name}
                    </h4>

                    {/* Storage Badge */}
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {isGithub ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-mono font-medium text-emerald-400">
                          <Github className="w-2.5 h-2.5" />
                          {file.isLargeFile ? 'Release 2GB' : 'GitHub Repo'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-medium text-blue-700 border border-blue-200">
                          <HardDrive className="w-2.5 h-2.5" />
                          IndexedDB
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stats: Size + Download Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono font-medium text-slate-700">{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadFile(file);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Tải xuống tệp tin"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
