import React, { useState } from 'react';
import {
  HardDrive,
  Github,
  Cloud,
  Star,
  Trash2,
  Plus,
  Upload,
  FolderPlus,
  CloudUpload,
  Database,
  ExternalLink,
  Settings,
  PieChart,
  Layers,
  ChevronDown
} from 'lucide-react';
import { FileItem, GitHubConfig, NavSection } from '../types';
import { formatBytes } from '../utils/fileHelpers';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  files: FileItem[];
  gitHubConfig: GitHubConfig;
  onOpenUploadModal: (targetType?: 'auto' | 'github_release' | 'local') => void;
  onOpenNewFolderModal: () => void;
  onOpenGitHubModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  files,
  gitHubConfig,
  onOpenUploadModal,
  onOpenNewFolderModal,
  onOpenGitHubModal,
}) => {
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

  // Calculate storage usage
  const activeFiles = files.filter((f) => !f.isTrashed);
  const totalSizeBytes = activeFiles.reduce((acc, f) => acc + f.size, 0);
  const offlineFiles = activeFiles.filter((f) => !f.storageTarget.startsWith('github'));
  const githubFiles = activeFiles.filter((f) => f.storageTarget.startsWith('github'));
  const githubSizeBytes = githubFiles.reduce((acc, f) => acc + f.size, 0);
  const starredCount = activeFiles.filter((f) => f.isStarred).length;
  const trashedCount = files.filter((f) => f.isTrashed).length;

  // Approximate storage limit display (5GB base quota)
  const quotaLimitBytes = 5 * 1024 * 1024 * 1024; // 5 GB
  const usagePercentage = Math.min(100, Math.round((totalSizeBytes / quotaLimitBytes) * 100));

  const navItems: { id: NavSection; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'my_drive',
      label: 'Bộ nhớ Offline',
      icon: <HardDrive className="w-4 h-4 text-sky-500" />,
      badge: offlineFiles.length,
    },
    {
      id: 'github_storage',
      label: 'Bộ nhớ Online',
      icon: <Cloud className="w-4 h-4 text-emerald-500" />,
      badge: `${githubFiles.length} tệp`,
    },
    {
      id: 'starred',
      label: 'Có gắn dấu sao',
      icon: <Star className="w-4 h-4 text-amber-500" />,
      badge: starredCount > 0 ? starredCount : undefined,
    },
    {
      id: 'trash',
      label: 'Thùng rác',
      icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      badge: trashedCount > 0 ? trashedCount : undefined,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-[calc(100vh-61px)] bg-slate-50/50 border-r border-slate-200 p-4 select-none">
      {/* Action Button "+ Mới" */}
      <div className="relative mb-6">
        <button
          type="button"
          onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-2xl shadow-sm border border-slate-200/80 hover:shadow transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span>Tải lên & Tạo mới</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isNewMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Options */}
        {isNewMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsNewMenuOpen(false)}
            />
            <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setIsNewMenuOpen(false);
                  onOpenUploadModal('auto');
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-slate-700 hover:bg-slate-100/80 text-left"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-slate-900">Tải tệp tin lên</div>
                  <div className="text-[11px] text-slate-500">Tự động tối ưu lưu trữ</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsNewMenuOpen(false);
                  onOpenUploadModal('github_release');
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-slate-700 hover:bg-slate-100/80 text-left"
              >
                <Github className="w-4 h-4 text-slate-900" />
                <div>
                  <div className="font-medium text-slate-900 flex items-center gap-1">
                    Tệp lớn GitHub Release
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1 rounded">2GB</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Video, Zip, Datasets dung lượng lớn</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => {
                  setIsNewMenuOpen(false);
                  onOpenNewFolderModal();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-slate-700 hover:bg-slate-100/80 text-left"
              >
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-slate-900">Tạo thư mục mới</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* GitHub Integration Quick Card */}
      <div className="mb-4 p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white shadow-sm">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide text-slate-200">Kho GitHub Release</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            2 GB / file
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
          {gitHubConfig.isConnected
            ? `Đã liên kết với ${gitHubConfig.owner}/${gitHubConfig.repo}. Tệp lớn được lưu trữ trực tiếp.`
            : 'Tận dụng GitHub Release Assets để lưu tệp tin lớn miễn phí lên tới 2GB.'}
        </p>
        <button
          type="button"
          onClick={onOpenGitHubModal}
          className="w-full py-1.5 px-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{gitHubConfig.isConnected ? 'Quản lý kho lưu trữ' : 'Cấu hình kết nối'}</span>
        </button>
      </div>

      {/* Storage Gauge */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Dung lượng đã dùng</span>
          </div>
          <span className="font-mono text-slate-500">{formatBytes(totalSizeBytes)}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(4, usagePercentage)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{usagePercentage}% của 5 GB</span>
          <span className="text-emerald-600 font-medium">GitHub: {formatBytes(githubSizeBytes)}</span>
        </div>
      </div>
    </aside>
  );
};
