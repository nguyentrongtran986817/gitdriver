import React from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  HardDrive,
  Github,
  LayoutGrid,
  List,
  Upload,
  FolderPlus,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FilterState, GitHubConfig, ViewMode } from '../types';

interface HeaderProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  gitHubConfig: GitHubConfig;
  onOpenGitHubModal: () => void;
  onOpenUploadModal: () => void;
  onOpenNewFolderModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  gitHubConfig,
  onOpenGitHubModal,
  onOpenUploadModal,
  onOpenNewFolderModal,
}) => {
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' or 'Ctrl+K' to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 min-w-[210px]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-slate-900">GitDrive</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Large Files
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Lưu trữ đám mây & GitHub 2GB</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Tìm kiếm tệp tin, tài liệu, video, nén... (Nhấn / để tìm nhanh)"
              className="w-full pl-10 pr-10 py-2 text-sm bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-slate-900 rounded-xl border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
            {filters.searchQuery ? (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                title="Xoá tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 border border-slate-300">
                  /
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Actions & Integration Bar */}
        <div className="flex items-center gap-2">
          {/* GitHub Connection Badge */}
          <button
            type="button"
            onClick={onOpenGitHubModal}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              gitHubConfig.isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80'
            }`}
            title={gitHubConfig.isConnected ? `Đã kết nối với ${gitHubConfig.owner}/${gitHubConfig.repo}` : 'Kết nối với GitHub để lưu trữ tệp lớn đến 2GB'}
          >
            <Github className="w-4 h-4" />
            <span>
              {gitHubConfig.isConnected ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                  GitHub: {gitHubConfig.repo || 'Connected'}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 inline" />
                  Cấu hình GitHub (2GB)
                </span>
              )}
            </span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ xem lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ xem danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Quick upload on mobile */}
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="sm:hidden p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            title="Tải lên tệp"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
