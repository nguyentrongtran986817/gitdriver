import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, RefreshCw } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((z) => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, z - 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="w-full flex flex-col bg-slate-900/5 rounded-2xl border border-slate-200 overflow-hidden">
      {/* Floating Toolbar */}
      <div className="p-2 bg-white/90 backdrop-blur-xs border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 font-medium px-2">Bản xem ảnh phóng to</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-1 text-[11px] font-mono text-slate-500 font-semibold min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Phóng to (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Xoay ảnh 90 độ"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Khôi phục kích thước gốc"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Canvas */}
      <div className="w-full h-[58vh] min-h-[350px] overflow-auto flex items-center justify-center p-4">
        <img
          src={src}
          alt={alt}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease-out',
          }}
          className="max-h-full max-w-full object-contain rounded-xl shadow-md border border-slate-200 bg-white"
        />
      </div>
    </div>
  );
};
