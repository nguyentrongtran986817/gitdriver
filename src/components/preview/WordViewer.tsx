import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { FileText, Loader2, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';

interface WordViewerProps {
  data: ArrayBuffer | Blob | null;
  fileName: string;
  previewText?: string;
  remoteUrl?: string;
}

export const WordViewer: React.FC<WordViewerProps> = ({
  data,
  fileName,
  previewText,
  remoteUrl
}) => {
  const [docHtml, setDocHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const parseDocx = async () => {
      try {
        if (!data) {
          if (previewText) {
            setDocHtml(null);
            setLoading(false);
            return;
          }
          throw new Error('Không có dữ liệu tệp Word');
        }

        let buffer: ArrayBuffer;
        if (data instanceof Blob) {
          buffer = await data.arrayBuffer();
        } else {
          buffer = data;
        }

        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        if (isMounted) {
          if (result.value && result.value.trim().length > 0) {
            setDocHtml(result.value);
          } else if (previewText) {
            setDocHtml(null);
          } else {
            setDocHtml('<p>Tài liệu Word không có nội dung văn bản hiển thị.</p>');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          // If mammoth fails (e.g. older .doc binary or encrypted), fall back to preview text if available
          if (previewText) {
            setDocHtml(null);
          } else {
            setError(err.message || 'Không thể chuyển đổi tài liệu Word');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    parseDocx();

    return () => {
      isMounted = false;
    };
  }, [data, previewText]);

  const handleCopyText = () => {
    const textToCopy = docHtml
      ? docHtml.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n')
      : previewText || '';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="w-full h-[55vh] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-800">Đang xử lý tài liệu Word...</p>
        <p className="text-xs text-slate-400 mt-1">Trích xuất định dạng văn bản, tiêu đề và danh sách</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-800">{fileName}</span>
            <span className="text-[10px] text-slate-400 ml-2">Tài liệu Microsoft Word</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium transition-colors"
            title="Sao chép nội dung văn bản"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép văn bản'}</span>
          </button>

          {remoteUrl && (
            <a
              href={`https://docs.google.com/viewer?url=${encodeURIComponent(remoteUrl)}&embedded=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Xem trực tuyến</span>
              <ExternalLink className="w-3 h-3 text-blue-600" />
            </a>
          )}
        </div>
      </div>

      {/* Main Document Body */}
      <div className="w-full max-h-[60vh] min-h-[350px] overflow-y-auto p-6 sm:p-10 bg-slate-100/60 flex justify-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 text-slate-800">
          {error && !docHtml && !previewText ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800 text-sm">Không thể kết xuất tài liệu Word</p>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
          ) : docHtml ? (
            <div
              className="prose prose-slate prose-sm max-w-none leading-relaxed text-slate-800"
              dangerouslySetInnerHTML={{ __html: docHtml }}
            />
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2">
                HỢP ĐỒNG HỢP TÁC KHAI THÁC DỊCH VỤ CÔNG NGHỆ
              </h2>
              <p className="text-xs text-slate-500 italic">Số: 2026/HĐ-GITDRIVE/CLOUD</p>
              <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
                <p>
                  <strong>Căn cứ:</strong> Bộ Luật Dân sự nước Cộng hòa Xã hội Chủ nghĩa Việt Nam và nhu cầu lưu trữ dữ liệu quy mô lớn của các bên.
                </p>
                <p>
                  <strong>ĐIỀU 1: PHẠM VI HỢP TÁC</strong><br />
                  Bên A đồng ý cung cấp hạ tầng quản lý lưu trữ dữ liệu phân tán kết hợp GitHub Releases và lưu trữ cục bộ cho Bên B, hỗ trợ tải lên và xem trước không giới hạn định dạng tệp.
                </p>
                <p>
                  <strong>ĐIỀU 2: TIÊU CHUẨN KỸ THUẬT VÀ BẢO MẬT</strong><br />
                  - Hỗ trợ xem trực tiếp các tệp PDF, bảng tính Excel (XLSX, XLS, CSV), tài liệu Word (DOCX), Video chuẩn 4K.<br />
                  - Mã hóa dữ liệu lưu trữ theo tiêu chuẩn quốc tế.<br />
                  - Tốc độ truy xuất và xem trước dưới 100 mili-giây.
                </p>
                <p>
                  <strong>ĐIỀU 3: ĐIỀU KHOẢN THI HÀNH</strong><br />
                  Hợp đồng có hiệu lực kể từ ngày ký và có giá trị pháp lý ràng buộc giữa các bên.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
