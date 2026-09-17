import React, { useState, useEffect } from 'react';
import {
  FileText,
  ExternalLink,
  BookOpen,
  Search,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  Globe,
  Sparkles
} from 'lucide-react';
import { generateSamplePdfBlob } from '../../utils/sampleFileGenerators';

interface PdfViewerProps {
  blob: Blob | null;
  blobUrl: string | null;
  remoteUrl?: string;
  fileName: string;
  previewText?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  blob,
  blobUrl,
  remoteUrl,
  fileName,
  previewText
}) => {
  const [activeUrl, setActiveUrl] = useState<string | null>(blobUrl);
  const [viewMode, setViewMode] = useState<'embed' | 'reader' | 'google'>('embed');
  const [fontSize, setFontSize] = useState<number>(15);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize or fallback to generated sample blob if needed
  useEffect(() => {
    let localCreatedUrl: string | null = null;

    if (blobUrl) {
      setActiveUrl(blobUrl);
    } else if (blob) {
      const u = URL.createObjectURL(blob);
      localCreatedUrl = u;
      setActiveUrl(u);
    } else if (remoteUrl) {
      setActiveUrl(remoteUrl);
    } else {
      // Generate sample valid PDF blob
      const samplePdf = generateSamplePdfBlob();
      const u = URL.createObjectURL(samplePdf);
      localCreatedUrl = u;
      setActiveUrl(u);
    }

    return () => {
      if (localCreatedUrl) {
        URL.revokeObjectURL(localCreatedUrl);
      }
    };
  }, [blob, blobUrl, remoteUrl]);

  const handleOpenNewTab = () => {
    if (activeUrl) {
      window.open(activeUrl, '_blank', 'noopener,noreferrer');
    } else if (remoteUrl) {
      window.open(remoteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Google Docs viewer URL for remote files
  const googleViewerUrl = remoteUrl
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(remoteUrl)}&embedded=true`
    : null;

  return (
    <div className="w-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* PDF Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: View mode toggles */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('embed')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'embed'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Xem PDF trực tiếp</span>
          </button>

          {(previewText || true) && (
            <button
              type="button"
              onClick={() => setViewMode('reader')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'reader'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Chế độ Đọc tài liệu</span>
            </button>
          )}

          {remoteUrl && (
            <button
              type="button"
              onClick={() => setViewMode('google')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'google'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Viewer</span>
            </button>
          )}
        </div>

        {/* Center: Controls depending on mode */}
        {viewMode === 'reader' ? (
          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm từ khóa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1 bg-white rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setFontSize((f) => Math.max(12, f - 1))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Giảm cỡ chữ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[11px] font-mono text-slate-500">{fontSize}px</span>
              <button
                type="button"
                onClick={() => setFontSize((f) => Math.min(22, f + 1))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Tăng cỡ chữ"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-xs hidden sm:block">
            Tự động hiển thị tài liệu trang và thanh điều hướng PDF
          </div>
        )}

        {/* Right: Open in new window */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 font-medium transition-colors"
            title="Mở tài liệu PDF trong tab trình duyệt mới"
          >
            <span>Mở tab mới</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Main PDF Content Area */}
      <div className="w-full h-[62vh] min-h-[400px] bg-slate-900/5 relative overflow-hidden flex flex-col items-center justify-center">
        {viewMode === 'embed' ? (
          activeUrl ? (
            <object
              data={`${activeUrl}#view=FitH&toolbar=1&navpanes=1`}
              type="application/pdf"
              className="w-full h-full border-0 bg-slate-100"
            >
              <iframe
                src={`${activeUrl}#view=FitH&toolbar=1&navpanes=1`}
                title={fileName}
                className="w-full h-full border-0 bg-slate-100"
              >
                {/* Nested fallback if both fail */}
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white">
                  <FileText className="w-12 h-12 text-rose-500 mb-3" />
                  <p className="font-semibold text-slate-800 text-sm">Trình duyệt không hỗ trợ nhúng PDF trực tiếp</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                    Bạn có thể chuyển sang "Chế độ Đọc tài liệu" hoặc mở trong tab mới để xem toàn màn hình.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('reader')}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs"
                    >
                      Chuyển sang Chế độ Đọc
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenNewTab}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                    >
                      Mở tab mới
                    </button>
                  </div>
                </div>
              </iframe>
            </object>
          ) : (
            <div className="text-center p-8">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Đang chuẩn bị tệp PDF...</p>
            </div>
          )
        ) : viewMode === 'google' && googleViewerUrl ? (
          <iframe
            src={googleViewerUrl}
            title={fileName}
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          /* Reader Mode */
          <div className="w-full h-full overflow-y-auto p-4 sm:p-8 bg-slate-100/70 flex justify-center">
            <div className="w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-10 shadow-md border border-slate-200/90 text-slate-800">
              <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{fileName}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Bản đọc văn bản trích xuất trực tiếp</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              <div
                className="leading-relaxed font-sans whitespace-pre-wrap"
                style={{ fontSize: `${fontSize}px` }}
              >
                {previewText ? (
                  previewText.split('\n').map((line, idx) => {
                    const isHighlighted =
                      searchTerm.trim() !== '' &&
                      line.toLowerCase().includes(searchTerm.toLowerCase().trim());
                    return (
                      <p
                        key={idx}
                        className={`mb-3 ${isHighlighted ? 'bg-amber-100 text-amber-950 font-medium px-1 rounded' : ''}`}
                      >
                        {line}
                      </p>
                    );
                  })
                ) : (
                  <div className="space-y-4 text-slate-700">
                    <h3 className="font-bold text-slate-900 text-base">BÁO CÁO KINH DOANH VÀ TĂNG TRƯỞNG QUÝ 3/2026</h3>
                    <p className="text-slate-600">
                      Hệ thống Lưu trữ Đám mây GitDrive - Nền tảng kết hợp Hybrid Cloud & Local Storage.
                    </p>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <p className="font-semibold text-slate-800">1. TỔNG QUAN KẾT QUẢ:</p>
                      <p>• Doanh thu toàn hệ thống tăng trưởng 145% so với cùng kỳ năm 2025.</p>
                      <p>• Lượng người dùng tích cực hàng tháng (MAU) vượt mốc 1.250.000 tài khoản.</p>
                      <p>• Tiết kiệm 85% chi phí lưu trữ nhờ tận dụng GitHub Releases Assets 2GB/tệp.</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <p className="font-semibold text-slate-800">2. NÂNG CẤP TÍNH NĂNG MỚI:</p>
                      <p>• Hỗ trợ mở và xem trực tiếp mọi định dạng tệp: PDF, Excel (XLSX, XLS, CSV), Word (DOCX), Video 4K, Audio.</p>
                      <p>• Bộ điều khiển phát video đa tính năng: tua nhanh +10s, +30s, lùi 10s, chọn tốc độ phát từ 0.75x đến 2x.</p>
                      <p>• Quản lý thư mục độc lập cho cả Bộ nhớ Offline và Bộ nhớ Online.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
