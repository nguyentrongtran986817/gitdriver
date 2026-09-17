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
  Loader2
} from 'lucide-react';
import { FileItem, GitHubConfig } from '../types';
import { formatBytes, formatDate } from '../utils/fileHelpers';
import { FileIcon } from './FileIcon';
import { getBlob, saveBlob } from '../utils/storageDb';

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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
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

  // Load blob or remote URL
  useEffect(() => {
    let active = true;
    setLoadError(null);

    if (!file) {
      setBlobUrl(null);
      return;
    }

    // 1. Try local IndexedDB
    if (file.localBlobKey) {
      getBlob(file.localBlobKey)
        .then((blob) => {
          if (blob && active) {
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);
          } else if (file.githubDownloadUrl && active) {
            // Fallback to github download url
            setBlobUrl(file.githubDownloadUrl);
          }
        })
        .catch(() => {
          if (file.githubDownloadUrl && active) {
            setBlobUrl(file.githubDownloadUrl);
          }
        });
    } else if (file.githubDownloadUrl) {
      // 2. Direct GitHub URL
      setBlobUrl(file.githubDownloadUrl);
    } else {
      setBlobUrl(null);
    }

    return () => {
      active = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file?.id, file?.localBlobKey, file?.githubDownloadUrl]);

  if (!file) return null;

  const isGithub = file.storageTarget.startsWith('github');
  const previewSrc = blobUrl || file.thumbnailUrl || file.githubDownloadUrl;

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
      const localKey = `blob-${file.id}`;
      await saveBlob(localKey, blob);
      const newUrl = URL.createObjectURL(blob);
      setBlobUrl(newUrl);
    } catch (err: any) {
      setLoadError(err.message || 'Lỗi khi nạp dữ liệu tệp');
    } finally {
      setLoadingMedia(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/80">
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
          <div className="bg-slate-950/5 rounded-2xl p-3 sm:p-5 border border-slate-200/80 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
            {/* 1. Video Player */}
            {file.category === 'video' ? (
              <div className="w-full flex flex-col items-center space-y-3">
                {previewSrc ? (
                  <div className="w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-800">
                    <video
                      ref={videoRef}
                      src={previewSrc}
                      controls
                      playsInline
                      className="w-full max-h-[50vh] object-contain mx-auto"
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

                {/* Video Enhanced Seeking / Tua Bar */}
                {previewSrc && (
                  <div className="w-full max-w-2xl bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-700">
                    {/* Tua Buttons */}
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

                    {/* Speed Selector & Audio */}
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
            ) : file.category === 'image' ? (
              /* 2. Image Preview */
              <div className="w-full flex flex-col items-center justify-center p-2">
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={file.name}
                    className="max-h-[55vh] max-w-full rounded-2xl object-contain shadow-md border border-slate-200"
                  />
                ) : (
                  <div className="text-center py-6">
                    <FileIcon category={file.category} extension={file.extension} className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-xs text-slate-500">Đang chuẩn bị bản xem trước hình ảnh...</p>
                  </div>
                )}
              </div>
            ) : file.category === 'audio' ? (
              /* 3. Audio Player */
              <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center space-y-4">
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
            ) : file.previewText ? (
              /* 4. Text / Code Preview */
              <div className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-2xl max-h-[50vh] overflow-y-auto leading-relaxed border border-slate-800">
                <pre className="whitespace-pre-wrap">{file.previewText}</pre>
              </div>
            ) : (
              /* 5. Fallback File Preview Card */
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-slate-200 mx-auto mb-3 flex items-center justify-center">
                  <FileIcon category={file.category} extension={file.extension} className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Tệp tin: {file.name}</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  {file.isLargeFile
                    ? 'Tệp tin dung lượng lớn được lưu trữ an toàn trên GitHub Release. Bạn có thể tải trực tiếp về thiết bị.'
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
