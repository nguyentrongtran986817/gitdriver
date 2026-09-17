import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Star,
  Trash2,
  Github,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  Info,
  ShieldCheck,
  RotateCcw,
  RotateCw,
  FastForward,
  Play,
  Pause,
  Maximize,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  Archive,
  FileSpreadsheet,
  FileText,
  FileCode,
  FolderArchive
} from 'lucide-react';
import { FileItem, GitHubConfig } from '../types';
import { formatBytes, formatDate } from '../utils/fileHelpers';
import { FileIcon } from './FileIcon';
import { getBlob, saveBlob } from '../utils/storageDb';
import { SpreadsheetViewer } from './preview/SpreadsheetViewer';
import { PdfViewer } from './preview/PdfViewer';
import { WordViewer } from './preview/WordViewer';
import { CodeViewer } from './preview/CodeViewer';
import { ImageViewer } from './preview/ImageViewer';
import { generateSampleExcelBlob, generateSamplePdfBlob } from '../utils/sampleFileGenerators';

interface FilePreviewModalProps {
  file: FileItem | null;
  gitHubConfig?: GitHubConfig;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
  onToggleStar: (fileId: string) => void;
  onTrash: (fileId: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  gitHubConfig,
  onClose,
  onDownload,
  onToggleStar,
  onTrash,
}) => {
  const [copied, setCopied] = useState(false);
  const [blobData, setBlobData] = useState<Blob | null>(null);
  const [blobBuffer, setBlobBuffer] = useState<ArrayBuffer | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobText, setBlobText] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isStarred, setIsStarred] = useState(false);

  // Video Controls State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Sync star state
  useEffect(() => {
    if (file) {
      setIsStarred(!!file.isStarred);
    }
  }, [file?.id, file?.isStarred]);

  // Load blob or remote URL whenever file changes
  useEffect(() => {
    let active = true;
    setLoadError(null);
    setBlobData(null);
    setBlobBuffer(null);
    setBlobText(null);

    if (!file) {
      setBlobUrl(null);
      return;
    }

    const ext = (file.extension || '').toLowerCase();
    const isExcel = ['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(ext);
    const isPdf = ext === 'pdf';

    const loadFileData = async () => {
      try {
        let loadedBlob: Blob | null = null;

        // 1. Try local IndexedDB
        if (file.localBlobKey) {
          loadedBlob = await getBlob(file.localBlobKey);
        }

        // 2. Fallback to generated sample blobs if needed for initial files
        if (!loadedBlob) {
          if (file.localBlobKey === 'sample-excel-blob' || (isExcel && !file.githubDownloadUrl)) {
            loadedBlob = generateSampleExcelBlob();
            if (file.localBlobKey) {
              saveBlob(file.localBlobKey, loadedBlob).catch(() => {});
            }
          } else if (file.localBlobKey === 'sample-pdf-blob' || (isPdf && !file.githubDownloadUrl)) {
            loadedBlob = generateSamplePdfBlob();
            if (file.localBlobKey) {
              saveBlob(file.localBlobKey, loadedBlob).catch(() => {});
            }
          }
        }

        if (!active) return;

        if (loadedBlob) {
          setBlobData(loadedBlob);
          const url = URL.createObjectURL(loadedBlob);
          setBlobUrl(url);

          // Extract array buffer for binary parsers (Excel/Word)
          loadedBlob.arrayBuffer().then((buffer) => {
            if (active) setBlobBuffer(buffer);
          }).catch(() => {});

          // Extract text for code/text files if <= 2MB
          if (loadedBlob.size <= 2 * 1024 * 1024 && (file.category === 'code' || file.category === 'document')) {
            loadedBlob.text().then((txt) => {
              if (active) setBlobText(txt);
            }).catch(() => {});
          }
        } else if (file.githubDownloadUrl) {
          // Direct remote URL
          setBlobUrl(file.githubDownloadUrl);
        }
      } catch (err: any) {
        if (active) {
          console.warn('Could not load blob data:', err);
        }
      }
    };

    loadFileData();

    return () => {
      active = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file?.id, file?.localBlobKey, file?.githubDownloadUrl]);

  if (!file) return null;

  const ext = (file.extension || '').toLowerCase();
  const isGithub = file.storageTarget.startsWith('github');
  const previewSrc = blobUrl || file.thumbnailUrl || file.githubDownloadUrl;

  // File type detectors
  const isPdf = ext === 'pdf' || file.mimeType.includes('pdf');
  const isExcel =
    ['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(ext) ||
    file.mimeType.includes('excel') ||
    file.mimeType.includes('spreadsheet');
  const isWord =
    ['docx', 'doc', 'odt', 'rtf'].includes(ext) ||
    file.mimeType.includes('word') ||
    file.mimeType.includes('officedocument.wordprocessingml');
  const isImage =
    file.category === 'image' ||
    ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext);
  const isVideo =
    file.category === 'video' ||
    ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext);
  const isAudio =
    file.category === 'audio' ||
    ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext);
  const isCodeOrText =
    file.category === 'code' ||
    ['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'c', 'cpp', 'sql', 'sh', 'yaml', 'yml', 'xml', 'log', 'env'].includes(ext);
  const isArchive =
    file.category === 'archive' ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso'].includes(ext);

  const handleCopyLink = () => {
    const link = file.githubDownloadUrl || window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStarClick = () => {
    setIsStarred(!isStarred);
    onToggleStar(file.id);
  };

  // Video seek and speed controls
  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
      );
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatVideoTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // On-demand buffer fetch from GitHub if needed
  const handleFetchFromGitHub = async () => {
    if (!file.githubDownloadUrl) return;
    setLoadingMedia(true);
    setLoadError(null);

    try {
      const headers: Record<string, string> = {};
      if (gitHubConfig?.token) {
        headers['Authorization'] = `Bearer ${gitHubConfig.token}`;
      }

      const res = await fetch(file.githubDownloadUrl, { headers });
      if (!res.ok) {
        throw new Error(`Không thể nạp dữ liệu từ GitHub (${res.status})`);
      }
      const blob = await res.blob();
      setBlobData(blob);
      const localKey = `blob-${file.id}`;
      await saveBlob(localKey, blob);
      const newUrl = URL.createObjectURL(blob);
      setBlobUrl(newUrl);

      blob.arrayBuffer().then((buf) => {
        setBlobBuffer(buf);
      });
    } catch (err: any) {
      setLoadError(err.message || 'Lỗi khi nạp dữ liệu tệp');
    } finally {
      setLoadingMedia(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center flex-shrink-0">
              <FileIcon category={file.category} extension={file.extension} className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 truncate text-sm sm:text-base" title={file.name}>
                {file.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{formatBytes(file.size)}</span>
                <span>•</span>
                <span>{formatDate(file.updatedAt)}</span>
                <span>•</span>
                <span className={isGithub ? 'text-emerald-600 font-semibold' : 'text-sky-600 font-semibold'}>
                  {isGithub ? 'Bộ nhớ Online (GitHub)' : 'Bộ nhớ Offline (Cục bộ)'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Star button */}
            <button
              type="button"
              onClick={handleToggleStarClick}
              className={`p-2 rounded-xl border transition-colors ${
                isStarred
                  ? 'bg-amber-50 border-amber-300 text-amber-500 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'
              }`}
              title={isStarred ? 'Bỏ gắn sao' : 'Gắn dấu sao'}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Preview Pane */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Main Visual Preview Area */}
          <div className="w-full">
            {/* 1. PDF Document Viewer */}
            {isPdf ? (
              <PdfViewer
                blob={blobData}
                blobUrl={blobUrl}
                remoteUrl={file.githubDownloadUrl}
                fileName={file.name}
                previewText={file.previewText}
              />
            ) : isExcel ? (
              /* 2. Excel & CSV Spreadsheet Viewer */
              <SpreadsheetViewer
                data={blobData || blobBuffer || file.previewText || ''}
                fileName={file.name}
              />
            ) : isWord ? (
              /* 3. Word Document Viewer (.docx, .doc) */
              <WordViewer
                data={blobData || blobBuffer}
                fileName={file.name}
                previewText={file.previewText}
                remoteUrl={file.githubDownloadUrl}
              />
            ) : isVideo ? (
              /* 4. Enhanced Video Player */
              <div className="w-full flex flex-col items-center space-y-3 bg-slate-950/5 p-4 rounded-2xl border border-slate-200">
                {previewSrc ? (
                  <div className="w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-800">
                    <video
                      ref={videoRef}
                      src={previewSrc}
                      controls
                      playsInline
                      className="w-full max-h-[52vh] object-contain mx-auto"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTime(videoRef.current.currentTime);
                          setDuration(videoRef.current.duration || 0);
                        }
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          setDuration(videoRef.current.duration || 0);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                      <Play className="w-7 h-7" />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">Xem video trực tiếp</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Tệp video được lưu trữ trên kho lưu trữ đám mây. Bạn có thể nạp dữ liệu để phát ngay hoặc tải về.
                    </p>
                    {file.githubDownloadUrl && (
                      <button
                        type="button"
                        onClick={handleFetchFromGitHub}
                        disabled={loadingMedia}
                        className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
                      >
                        {loadingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        <span>{loadingMedia ? 'Đang tải dữ liệu phát...' : 'Nạp video để xem trực tiếp'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Video Seeking / Tua Bar */}
                {previewSrc && (
                  <div className="w-full max-w-3xl bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSeek(-10)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold flex items-center gap-1 transition-colors"
                        title="Tua lùi lại 10 giây"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        <span>-10s</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleTogglePlay}
                        className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        title={isPlaying ? 'Tạm dừng' : 'Phát'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSeek(10)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold flex items-center gap-1 transition-colors"
                        title="Tua nhanh tới 10 giây"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                        <span>+10s</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSeek(30)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold flex items-center gap-1 transition-colors"
                        title="Tua nhanh tới 30 giây"
                      >
                        <FastForward className="w-3.5 h-3.5 text-blue-600" />
                        <span>+30s</span>
                      </button>

                      {duration > 0 && (
                        <span className="font-mono text-[11px] text-slate-500 ml-2">
                          {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                        {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => handleSpeedChange(spd)}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                              playbackSpeed === spd
                                ? 'bg-white text-blue-600 shadow-2xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleMute}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={handleFullScreen}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        title="Toàn màn hình"
                      >
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : isImage ? (
              /* 5. Image Viewer with Zoom & Rotate */
              <ImageViewer src={previewSrc || ''} alt={file.name} />
            ) : isAudio ? (
              /* 6. Audio Player */
              <div className="w-full max-w-md mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileIcon category="audio" extension={file.extension} className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 text-sm">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatBytes(file.size)}</p>
                </div>
                {previewSrc ? (
                  <audio src={previewSrc} controls className="w-full" />
                ) : (
                  <button
                    type="button"
                    onClick={handleFetchFromGitHub}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                  >
                    Phát âm thanh trực tiếp
                  </button>
                )}
              </div>
            ) : isCodeOrText || blobText || file.previewText ? (
              /* 7. Code & Text Viewer with line numbers & search */
              <CodeViewer
                content={blobText || file.previewText || '// Không có nội dung văn bản'}
                fileName={file.name}
                extension={file.extension}
              />
            ) : isArchive ? (
              /* 8. Archive Explorer Card */
              <div className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <FolderArchive className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">{file.name}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Gói tệp nén lưu trữ dung lượng {formatBytes(file.size)}. Bạn có thể mở tải về để giải nén hoặc truy xuất kho dữ liệu trực tiếp.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => onDownload(file)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải tệp nén về máy</span>
                  </button>
                  {file.githubDownloadUrl && (
                    <a
                      href={file.githubDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>Xem nguồn GitHub Asset</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              /* 9. Universal Fallback */
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-slate-200 mx-auto mb-3 flex items-center justify-center">
                  <FileIcon category={file.category} extension={file.extension} className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Tệp tin: {file.name}</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {file.isLargeFile
                    ? 'Tệp tin dung lượng lớn được lưu trữ an toàn trên GitHub Release.'
                    : 'Nhấn nút "Tải xuống" bên dưới để lưu và mở tệp tin trên máy tính của bạn.'}
                </p>
                {file.githubDownloadUrl && (
                  <button
                    type="button"
                    onClick={handleFetchFromGitHub}
                    disabled={loadingMedia}
                    className="mt-3 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    {loadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                    <span>{loadingMedia ? 'Đang nạp...' : 'Thử nạp trực tiếp'}</span>
                  </button>
                )}
              </div>
            )}

            {loadError && (
              <p className="text-rose-600 text-xs mt-2 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                {loadError}
              </p>
            )}
          </div>

          {/* File Metadata Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Thông tin kỹ thuật</span>
              </div>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Định dạng:</span>
                  <span className="font-mono text-slate-800 font-medium">{file.mimeType || file.extension}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dung lượng:</span>
                  <span className="font-mono text-slate-800 font-semibold">{formatBytes(file.size)} ({file.size.toLocaleString('vi-VN')} Bytes)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời gian tạo:</span>
                  <span className="text-slate-800">{formatDate(file.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nguồn & Lưu trữ</span>
              </div>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cơ chế lưu trữ:</span>
                  {isGithub ? (
                    <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                      <Github className="w-3.5 h-3.5" />
                      {file.isLargeFile ? 'Bộ nhớ Online (Release 2GB)' : 'Bộ nhớ Online (Repo)'}
                    </span>
                  ) : (
                    <span className="font-mono text-sky-700 font-semibold flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5" />
                      Bộ nhớ Offline (IndexedDB)
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Trạng thái gắn sao:</span>
                  <span className={`font-semibold flex items-center gap-1 ${isStarred ? 'text-amber-600' : 'text-slate-500'}`}>
                    <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                    {isStarred ? 'Đã gắn dấu sao' : 'Chưa gắn sao'}
                  </span>
                </div>
                {file.githubDownloadUrl && (
                  <div className="truncate pt-1 text-[11px] text-blue-600">
                    <a
                      href={file.githubDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      <span>Mở liên kết tải gốc GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {file.description && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs">
              <span className="font-semibold text-slate-700 block mb-1">Mô tả tệp tin:</span>
              <p className="text-slate-600 leading-relaxed">{file.description}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép link' : 'Sao chép link'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onTrash(file.id);
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Chuyển vào thùng rác</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 text-xs font-medium"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => onDownload(file)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Tải xuống tệp tin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
