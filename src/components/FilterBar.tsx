import React, { useState } from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code2,
  Files,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  HardDrive,
  Star,
  RotateCcw,
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import { FileCategory, FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  totalFilteredCount: number;
}

const CATEGORIES: { id: FileCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Tất cả', icon: <Files className="w-3.5 h-3.5" /> },
  { id: 'document', label: 'Tài liệu', icon: <FileText className="w-3.5 h-3.5 text-blue-500" /> },
  { id: 'image', label: 'Hình ảnh', icon: <Image className="w-3.5 h-3.5 text-rose-500" /> },
  { id: 'video', label: 'Video', icon: <Video className="w-3.5 h-3.5 text-purple-500" /> },
  { id: 'audio', label: 'Âm thanh', icon: <Music className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'archive', label: 'Tệp nén (Zip/Rar)', icon: <Archive className="w-3.5 h-3.5 text-emerald-500" /> },
  { id: 'code', label: 'Mã nguồn / JSON', icon: <Code2 className="w-3.5 h-3.5 text-cyan-500" /> },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  totalFilteredCount,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.sizeRange !== 'all' ||
    filters.storageSource !== 'all' ||
    filters.onlyStarred ||
    filters.searchQuery !== '';

  const handleResetFilters = () => {
    onFilterChange({
      searchQuery: '',
      category: 'all',
      dateRange: 'all',
      sizeRange: 'all',
      storageSource: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
      onlyStarred: false,
    });
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 space-y-2.5">
      {/* Primary Category Filter Pills */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 flex-nowrap">
          {CATEGORIES.map((cat) => {
            const isSelected = filters.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onFilterChange({ ...filters, category: cat.id })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls & Advanced Filter Trigger */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quick Starred Toggle */}
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, onlyStarred: !filters.onlyStarred })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              filters.onlyStarred
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filters.onlyStarred ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
            <span>Gắn sao</span>
          </button>

          {/* Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isAdvancedOpen || filters.sizeRange !== 'all' || filters.dateRange !== 'all' || filters.storageSource !== 'all'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Bộ lọc chi tiết</span>
            {(filters.sizeRange !== 'all' || filters.dateRange !== 'all' || filters.storageSource !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            )}
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xoá lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Drawer / Panel */}
      {isAdvancedOpen && (
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Filter by Size */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Kích thước tệp</span>
              </label>
              <select
                value={filters.sizeRange}
                onChange={(e) => onFilterChange({ ...filters, sizeRange: e.target.value as any })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Mọi kích thước</option>
                <option value="small">Nhỏ (&lt; 1 MB)</option>
                <option value="medium">Vừa (1 MB - 25 MB)</option>
                <option value="large">Lớn (25 MB - 100 MB)</option>
                <option value="huge">Rất lớn GitHub (&gt; 100 MB đến 2GB)</option>
              </select>
            </div>

            {/* Filter by Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Ngày sửa đổi</span>
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value as any })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Mọi thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="last7days">7 ngày qua</option>
                <option value="last30days">30 ngày qua</option>
                <option value="thisYear">Trong năm nay</option>
              </select>
            </div>

            {/* Filter by Storage Location */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                <span>Kho lưu trữ</span>
              </label>
              <select
                value={filters.storageSource}
                onChange={(e) => onFilterChange({ ...filters, storageSource: e.target.value as any })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tất cả nguồn</option>
                <option value="github">Kho GitHub (Releases & Repos)</option>
                <option value="local">Bộ nhớ cục bộ (IndexedDB)</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
                <span>Sắp xếp theo</span>
              </label>
              <div className="flex gap-1.5">
                <select
                  value={filters.sortBy}
                  onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="date">Ngày cập nhật</option>
                  <option value="name">Tên tệp</option>
                  <option value="size">Kích thước</option>
                  <option value="type">Loại tệp</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
                    })
                  }
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-medium"
                  title={filters.sortOrder === 'asc' ? 'Thứ tự tăng dần' : 'Thứ tự giảm dần'}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-slate-500 text-[11px]">
            <span>
              Tìm thấy <strong className="text-slate-800">{totalFilteredCount}</strong> tệp tin phù hợp
            </span>
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(false)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Thu gọn
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
