import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Search,
  Copy,
  Check,
  Download,
  Layers,
  Table as TableIcon,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface SpreadsheetViewerProps {
  data: ArrayBuffer | Blob | string | null;
  fileName: string;
}

export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({ data, fileName }) => {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Parse workbook whenever data changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const parseData = async () => {
      try {
        if (!data) {
          throw new Error('Không có dữ liệu bảng tính');
        }

        let wb: XLSX.WorkBook;

        if (data instanceof Blob) {
          const buffer = await data.arrayBuffer();
          wb = XLSX.read(buffer, { type: 'array' });
        } else if (data instanceof ArrayBuffer) {
          wb = XLSX.read(data, { type: 'array' });
        } else if (typeof data === 'string') {
          // Can be raw CSV or base64
          if (data.startsWith('data:')) {
            const base64Data = data.split(',')[1];
            wb = XLSX.read(base64Data, { type: 'base64' });
          } else {
            wb = XLSX.read(data, { type: 'string' });
          }
        } else {
          throw new Error('Định dạng dữ liệu không hợp lệ');
        }

        if (!isMounted) return;

        if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
          throw new Error('Tệp bảng tính không có trang tính (sheet) nào');
        }

        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        setActiveSheet(wb.SheetNames[0]);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Lỗi khi đọc tệp Excel/CSV');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    parseData();

    return () => {
      isMounted = false;
    };
  }, [data]);

  // Extract 2D array for current active sheet
  const rawRows: any[][] = useMemo(() => {
    if (!workbook || !activeSheet || !workbook.Sheets[activeSheet]) {
      return [];
    }
    const ws = workbook.Sheets[activeSheet];
    // Convert sheet to 2D array of rows
    const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
    return jsonData;
  }, [workbook, activeSheet]);

  // Calculate max columns
  const maxCols = useMemo(() => {
    let max = 0;
    rawRows.forEach((row) => {
      if (Array.isArray(row) && row.length > max) {
        max = row.length;
      }
    });
    return Math.max(max, 1);
  }, [rawRows]);

  // Column letters (A, B, C, ... Z, AA, AB...)
  const columnHeaders = useMemo(() => {
    const headers: string[] = [];
    for (let i = 0; i < maxCols; i++) {
      let colName = '';
      let temp = i;
      while (temp >= 0) {
        colName = String.fromCharCode((temp % 26) + 65) + colName;
        temp = Math.floor(temp / 26) - 1;
      }
      headers.push(colName);
    }
    return headers;
  }, [maxCols]);

  // Filter rows if search term is provided
  const { filteredRows, matchCount } = useMemo(() => {
    if (!searchTerm.trim()) {
      return { filteredRows: rawRows, matchCount: 0 };
    }
    const term = searchTerm.toLowerCase().trim();
    let count = 0;
    const filtered = rawRows.filter((row, rowIndex) => {
      // Always keep header row (rowIndex === 0)
      if (rowIndex === 0) return true;
      const rowMatches = row.some((cell) => {
        const val = cell !== null && cell !== undefined ? String(cell).toLowerCase() : '';
        if (val.includes(term)) {
          count++;
          return true;
        }
        return false;
      });
      return rowMatches;
    });
    return { filteredRows: filtered, matchCount: count };
  }, [rawRows, searchTerm]);

  // Copy current sheet as CSV to clipboard
  const handleCopyCsv = () => {
    if (!workbook || !activeSheet) return;
    const ws = workbook.Sheets[activeSheet];
    const csv = XLSX.utils.sheet_to_csv(ws);
    navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export current sheet to download as CSV
  const handleExportCsv = () => {
    if (!workbook || !activeSheet) return;
    const ws = workbook.Sheets[activeSheet];
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, '')}_${activeSheet}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-800">Đang đọc bảng tính Excel/CSV...</p>
        <p className="text-xs text-slate-400 mt-1">Trích xuất cấu trúc hàng, cột và công thức</p>
      </div>
    );
  }

  if (error || !workbook) {
    return (
      <div className="w-full p-8 text-center bg-rose-50/60 rounded-2xl border border-rose-200 flex flex-col items-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
        <h4 className="font-semibold text-rose-900 text-sm">Không thể mở bảng tính trực tiếp</h4>
        <p className="text-xs text-rose-700 mt-1 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Info & Sheet Name */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span>{activeSheet}</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-1.5 py-0.5 rounded border border-emerald-200">
                {rawRows.length} hàng × {maxCols} cột
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search inside sheet */}
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm trong bảng tính..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          {searchTerm && (
            <span className="text-[10px] text-slate-500 whitespace-nowrap">
              {matchCount} kết quả
            </span>
          )}
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyCsv}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium transition-colors"
            title="Sao chép toàn bộ trang tính dạng CSV"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã chép' : 'Chép CSV'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium transition-colors"
            title="Xuất trang tính hiện tại ra file CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Main Spreadsheet Grid Container */}
      <div className="w-full max-h-[58vh] min-h-[320px] overflow-auto relative bg-white">
        {filteredRows.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Trang tính này hiện không có dữ liệu
          </div>
        ) : (
          <table className="w-full border-collapse text-left font-sans text-xs">
            <thead>
              {/* Header row with column letters (A, B, C, D...) */}
              <tr className="bg-slate-100/90 text-slate-600 sticky top-0 z-20 select-none border-b border-slate-300">
                <th className="w-12 min-w-[48px] py-1.5 px-2 bg-slate-200/80 text-center font-mono text-[10px] font-semibold text-slate-500 border-r border-slate-300 sticky left-0 z-30">
                  #
                </th>
                {columnHeaders.map((colLetter, colIdx) => (
                  <th
                    key={colIdx}
                    className="py-1.5 px-3 font-mono font-semibold text-[11px] text-slate-700 border-r border-slate-200 whitespace-nowrap min-w-[100px] text-center"
                  >
                    {colLetter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIdx) => {
                const isFirstRow = rowIdx === 0;
                return (
                  <tr
                    key={rowIdx}
                    className={`border-b border-slate-200 hover:bg-emerald-50/30 transition-colors ${
                      isFirstRow ? 'bg-slate-50/80 font-semibold text-slate-900' : 'bg-white text-slate-700'
                    }`}
                  >
                    {/* Row Index Number (1, 2, 3...) */}
                    <td className="w-12 min-w-[48px] py-1 px-2 bg-slate-100/70 text-center font-mono text-[10px] text-slate-400 border-r border-slate-200 select-none sticky left-0 z-10">
                      {rowIdx + 1}
                    </td>

                    {/* Data Cells */}
                    {Array.from({ length: maxCols }).map((_, colIdx) => {
                      const cellValue = row[colIdx];
                      const displayValue =
                        cellValue !== undefined && cellValue !== null ? String(cellValue) : '';
                      const isMatched =
                        searchTerm.trim() !== '' &&
                        displayValue.toLowerCase().includes(searchTerm.toLowerCase().trim());

                      return (
                        <td
                          key={colIdx}
                          className={`py-1.5 px-3 border-r border-slate-100 whitespace-pre truncate max-w-xs ${
                            isMatched
                              ? 'bg-amber-100 text-amber-950 font-semibold'
                              : isFirstRow
                              ? 'text-slate-900 font-bold bg-slate-50/90'
                              : 'text-slate-700'
                          }`}
                          title={displayValue}
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Sheet Navigation Tabs (Like Excel / Google Sheets) */}
      <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 text-slate-400 font-semibold text-[11px] px-1 select-none">
            <Layers className="w-3.5 h-3.5" />
            <span>Sheets:</span>
          </div>

          {sheetNames.map((name) => {
            const isActive = name === activeSheet;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setActiveSheet(name)}
                className={`px-3 py-1 rounded-md font-semibold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-emerald-700 shadow-2xs border-t-2 border-t-emerald-600 border-x border-b border-slate-200'
                    : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                <TableIcon className={`w-3 h-3 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{name}</span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 select-none whitespace-nowrap pl-2">
          {activeSheet && rawRows.length > 0 && (
            <span>Tổng cộng: {rawRows.length} dòng dữ liệu</span>
          )}
        </div>
      </div>
    </div>
  );
};
