import React from 'react';
import {
  Star,
  Download,
  Eye,
  MoreVertical,
  Github,
  HardDrive,
  Trash2,
  RotateCcw,
  Edit2,
  Folder
} from 'lucide-react';
import { FileItem, FolderItem } from '../types';
import { formatBytes, formatDate } from '../utils/fileHelpers';
import { FileIcon } from './FileIcon';

interface FileListProps {
  files: FileItem[];
  folders?: FolderItem[];
  onOpenFolder?: (folderId: string | null) => void;
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

export const FileList: React.FC<FileListProps> = ({
  files,
  folders = [],
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

  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
        <p className="text-sm font-medium text-slate-700">Không tìm thấy tệp tin hoặc thư mục phù hợp</p>
        <p className="text-xs text-slate-400 mt-1">Hãy thử thay đổi từ khoá hoặc điều chỉnh lại bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-3">Tên tệp tin / Thư mục</th>
              <th className="py-3 px-3 hidden md:table-cell">Nguồn lưu trữ</th>
              <th className="py-3 px-3">Kích thước</th>
              <th className="py-3 px-3 hidden sm:table-cell">Ngày sửa đổi</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {/* Folder Rows */}
            {!isTrashView &&
              folders.map((folder) => (
                <tr
                  key={folder.id}
                  onDoubleClick={() => onOpenFolder && onOpenFolder(folder.id)}
                  className="hover:bg-amber-50/30 transition-colors group cursor-pointer bg-slate-50/40"
                >
                  <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <Folder className="w-4 h-4 text-amber-500" />
                  </td>
                  <td
                    className="py-2.5 px-3 min-w-[200px]"
                    onClick={() => onOpenFolder && onOpenFolder(folder.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${folder.color || '#f59e0b'}15` }}
                      >
                        <Folder className="w-4 h-4" style={{ color: folder.color || '#f59e0b' }} />
                      </div>
                      <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {folder.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 hidden md:table-cell">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                      Thư mục
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">--</td>
                  <td className="py-2.5 px-3 hidden sm:table-cell text-slate-400">
                    {formatDate(folder.updatedAt)}
                  </td>
                  <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {onDeleteFolder && (
                      <button
                        type="button"
                        onClick={() => onDeleteFolder(folder.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title={`Xóa thư mục "${folder.name}"`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            {files.map((file) => {
              const isGithub = file.storageTarget.startsWith('github');

              return (
                <tr
                  key={file.id}
                  onDoubleClick={() => onPreviewFile(file)}
                  className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                >
                  {/* Star */}
                  <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                    {!isTrashView ? (
                      <button
                        type="button"
                        onClick={() => onToggleStar(file.id)}
                        className={`p-1 rounded transition-colors ${
                          file.isStarred
                            ? 'text-amber-500 scale-105'
                            : 'text-slate-300 hover:text-amber-500'
                        }`}
                        title={file.isStarred ? 'Bỏ gắn sao' : 'Gắn sao'}
                      >
                        <Star className={`w-4 h-4 ${file.isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </td>

                  {/* Name + Icon */}
                  <td className="py-2.5 px-3 min-w-[200px]" onClick={() => onPreviewFile(file)}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <FileIcon category={file.category} extension={file.extension} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate block max-w-xs md:max-w-md">
                          {file.name}
                        </span>
                        {file.description && (
                          <span className="text-[11px] text-slate-400 truncate block max-w-xs md:max-w-md">
                            {file.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Storage Source */}
                  <td className="py-2.5 px-3 hidden md:table-cell" onClick={() => onPreviewFile(file)}>
                    {isGithub ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-emerald-400 font-mono text-[10px]">
                        <Github className="w-3 h-3" />
                        {file.isLargeFile ? 'Release 2GB' : 'Repo'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                        <HardDrive className="w-3 h-3" />
                        IndexedDB
                      </span>
                    )}
                  </td>

                  {/* Size */}
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap" onClick={() => onPreviewFile(file)}>
                    {formatBytes(file.size)}
                  </td>

                  {/* Date */}
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap hidden sm:table-cell" onClick={() => onPreviewFile(file)}>
                    {formatDate(file.updatedAt)}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onPreviewFile(file)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDownloadFile(file)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100"
                        title="Tải xuống"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Dropdown for More */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === file.id ? null : file.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === file.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs text-slate-700 text-left">
                            {!isTrashView ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onPreviewFile(file);
                                  }}
                                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 text-blue-600 font-medium"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Xem chi tiết / Phát video</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onToggleStar(file.id);
                                  }}
                                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 text-amber-600 font-medium"
                                >
                                  <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
                                  <span>{file.isStarred ? 'Bỏ gắn dấu sao' : 'Gắn dấu sao'}</span>
                                </button>
                                {onRenameFile && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onRenameFile(file);
                                    }}
                                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Đổi tên tệp</span>
                                  </button>
                                )}
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onTrashFile(file.id);
                                  }}
                                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{file.storageTarget.startsWith('github') ? 'Xoá tệp (Đồng bộ mọi máy)' : 'Chuyển vào thùng rác'}</span>
                                </button>
                                {file.storageTarget.startsWith('github') && onPermanentDelete && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onPermanentDelete(file.id);
                                    }}
                                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-100 text-rose-700 font-medium"
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
                                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-emerald-50 text-emerald-700 font-medium"
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
                                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-600"
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
