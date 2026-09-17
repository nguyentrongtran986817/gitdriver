import React, { useState } from 'react';
import {
  X,
  Github,
  Key,
  FolderGit2,
  Tag,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  Database,
  Loader2,
  ShieldAlert,
  Server
} from 'lucide-react';
import { GitHubConfig } from '../types';
import {
  getOrCreateStorageRelease,
  verifyGitHubToken,
  verifyRepository
} from '../utils/githubApi';

interface GitHubSettingsModalProps {
  config: GitHubConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (config: GitHubConfig) => void;
}

export const GitHubSettingsModal: React.FC<GitHubSettingsModalProps> = ({
  config,
  isOpen,
  onClose,
  onSaveConfig,
}) => {
  const [token, setToken] = useState(config.token || '');
  const [owner, setOwner] = useState(config.owner || '');
  const [repo, setRepo] = useState(config.repo || '');
  const [branch, setBranch] = useState(config.branch || 'main');
  const [releaseTag, setReleaseTag] = useState(config.releaseTag || 'gitdrive-storage');
  const [storageMode, setStorageMode] = useState<'releases_assets' | 'repository_contents' | 'hybrid'>(
    config.storageMode || 'releases_assets'
  );

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    user?: any;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!token.trim()) {
      setTestResult({ success: false, message: 'Vui lòng nhập GitHub Personal Access Token.' });
      return;
    }
    if (!owner.trim() || !repo.trim()) {
      setTestResult({ success: false, message: 'Vui lòng nhập Chủ sở hữu (Owner) và Tên kho (Repo).' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // 1. Kiểm tra Token
      const user = await verifyGitHubToken(token.trim());

      // 2. Kiểm tra Repository
      const repoInfo = await verifyRepository(token.trim(), owner.trim(), repo.trim());

      // 3. Thử kiểm tra/khởi tạo Release bucket
      await getOrCreateStorageRelease({
        token: token.trim(),
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || 'main',
        releaseTag: releaseTag.trim() || 'gitdrive-storage',
        isConnected: true,
        storageMode,
      });

      setTestResult({
        success: true,
        message: `Kết nối thành công tới ${owner}/${repo} (${repoInfo.private ? 'Riêng tư / Private' : 'Công khai / Public'}). Sẵn sàng lưu trữ tệp lớn lên đến 2GB!`,
        user,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Không thể kết nối đến GitHub API.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const isConnected = Boolean(testResult?.success || (token.trim() && owner.trim() && repo.trim()));
    onSaveConfig({
      token: token.trim(),
      owner: owner.trim(),
      repo: repo.trim(),
      branch: branch.trim() || 'main',
      releaseTag: releaseTag.trim() || 'gitdrive-storage',
      isConnected,
      username: testResult?.user?.login || config.username,
      avatarUrl: testResult?.user?.avatar_url || config.avatarUrl,
      storageMode,
      lastChecked: new Date().toISOString(),
    });
    onClose();
  };

  const handleDisconnect = () => {
    onSaveConfig({
      token: '',
      owner: '',
      repo: '',
      branch: 'main',
      releaseTag: 'gitdrive-storage',
      isConnected: false,
      storageMode: 'releases_assets',
    });
    setToken('');
    setOwner('');
    setRepo('');
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Github className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                Cấu hình Lưu trữ Dữ liệu Lớn trên GitHub
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  2 GB / file
                </span>
              </h3>
              <p className="text-xs text-slate-400">Kết nối repository cá nhân của bạn để lưu tệp không giới hạn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Explanation Box */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-emerald-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Cơ chế lưu trữ tệp lớn qua GitHub Releases</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              GitHub cho phép tải lên các tệp nhị phân lớn lên đến <strong>2 GB cho mỗi tệp</strong> dưới dạng Release Assets mà không bị giới hạn 100MB của Git commit thông thường. GitDrive tự động tạo và quản lý kho chứa này cho bạn!
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            {/* Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  <span>GitHub Personal Access Token (PAT)</span>
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <span>Tạo token mới</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Yêu cầu quyền <strong>repo</strong> (Full control of private repositories) để đọc/ghi tệp và tạo Releases.
              </p>
            </div>

            {/* Owner & Repo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Chủ sở hữu (GitHub Username / Org)
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Ví dụ: trongnguyenit99"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tên kho lưu trữ (Repository Name)
                </label>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="Ví dụ: my-cloud-drive"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-xs"
                />
              </div>
            </div>

            {/* Branch & Release Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nhánh mặc định (Branch)
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tag Release Bucket (Tệp lớn 2GB)
                </label>
                <input
                  type="text"
                  value={releaseTag}
                  onChange={(e) => setReleaseTag(e.target.value)}
                  placeholder="gitdrive-storage"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-2">
            <button
              type="button"
              disabled={testing}
              onClick={handleTestConnection}
              className="w-full py-2 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 active:bg-slate-100 font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Đang kiểm tra kết nối GitHub API...</span>
                </>
              ) : (
                <>
                  <Server className="w-4 h-4 text-blue-600" />
                  <span>Kiểm tra kết nối & Quyền truy cập</span>
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`mt-2.5 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium leading-relaxed">{testResult.message}</p>
                  {testResult.user && (
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Xác thực người dùng: <strong>@{testResult.user.login}</strong> ({testResult.user.name || 'GitHub User'})
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          {config.isConnected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline"
            >
              Ngắt kết nối
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">
              Chưa có GitHub? Ứng dụng vẫn hoạt động tốt với bộ nhớ cục bộ IndexedDB!
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 text-xs font-medium"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
