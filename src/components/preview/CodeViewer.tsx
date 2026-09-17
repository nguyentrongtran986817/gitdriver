import React, { useState } from 'react';
import { FileCode, Copy, Check, WrapText, Search } from 'lucide-react';

interface CodeViewerProps {
  content: string;
  fileName: string;
  extension: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ content, fileName, extension }) => {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = content.split('\n');

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xs text-xs">
      {/* Top Toolbar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <FileCode className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-medium text-slate-200">{fileName}</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">
            {extension || 'text'} • {lines.length} dòng
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-40">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm từ khóa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setWordWrap(!wordWrap)}
            className={`p-1.5 rounded-lg border transition-colors ${
              wordWrap
                ? 'bg-blue-950/60 border-blue-800 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Bật/tắt tự xuống dòng"
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép mã'}</span>
          </button>
        </div>
      </div>

      {/* Code Lines Container */}
      <div className="w-full max-h-[58vh] min-h-[300px] overflow-auto p-4 font-mono text-slate-200 leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const isMatch =
                searchTerm.trim() !== '' &&
                line.toLowerCase().includes(searchTerm.toLowerCase().trim());

              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isMatch ? 'bg-amber-500/20' : ''
                  }`}
                >
                  <td className="w-10 pr-4 text-right text-slate-600 select-none text-[11px] align-top">
                    {idx + 1}
                  </td>
                  <td
                    className={`align-top ${wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}
                  >
                    {line}
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
