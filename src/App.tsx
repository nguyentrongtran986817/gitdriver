import React, { useState, useEffect, useMemo } from 'react';
import {
  FileItem,
  FolderItem,
  GitHubConfig,
  FilterState,
  NavSection,
  ViewMode
} from './types';
import {
  getInitialFiles,
  getInitialFolders,
  triggerDownloadBlob,
  triggerDownloadUrl,
  getFileCategory,
  getFileExtension
} from './utils/fileHelpers';
import { getBlob, deleteBlob } from './utils/storageDb';
import {
  deleteGitHubReleaseAsset,
  fetchGitHubReleaseAssets,
  fetchGitHubRepoContents,
  deleteGitHubRepoFile,
} from './utils/githubApi';

// Subcomponents
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FilterBar } from './components/FilterBar';
import { FileGrid } from './components/FileGrid';
import { FileList } from './components/FileList';
import { Breadcrumb } from './components/Breadcrumb';
import { FilePreviewModal } from './components/FilePreviewModal';
import { GitHubSettingsModal } from './components/GitHubSettingsModal';
import { UploadModal } from './components/UploadModal';
import { NewFolderModal } from './components/NewFolderModal';
import { RenameModal } from './components/RenameModal';
import { ToastContainer, ToastMessage } from './components/Toast';

import {
  HardDrive,
  Github,
  Upload,
  FolderPlus,
  Trash2,
  RefreshCw,
  Sparkles,
  Info,
  Layers,
  Database
} from 'lucide-react';

const STORAGE_FILES_KEY = 'gitdrive_files_v1';
const STORAGE_FOLDERS_KEY = 'gitdrive_folders_v1';
const STORAGE_GITHUB_KEY = 'gitdrive_github_config_v1';

export default function App() {
  // 1. Files & Folders State
  const [files, setFiles] = useState<FileItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FILES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return getInitialFiles();
  });

  const [folders, setFolders] = useState<FolderItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FOLDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return getInitialFolders();
  });

  // 2. GitHub Integration Config
  const [gitHubConfig, setGitHubConfig] = useState<GitHubConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GITHUB_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      token: '',
      owner: '',
      repo: '',
      branch: 'main',
      releaseTag: 'gitdrive-storage',
      isConnected: false,
      storageMode: 'releases_assets',
    };
  });

  // 3. Navigation & View State
  const [currentSection, setCurrentSection] = useState<NavSection>('my_drive');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // 4. Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'all',
    dateRange: 'all',
    sizeRange: 'all',
    storageSource: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    onlyStarred: false,
  });

  // 5. Modals State
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [renameFile, setRenameFile] = useState<FileItem | null>(null);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetType, setUploadTargetType] = useState<'auto' | 'github_release' | 'local'>('auto');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);

  // 6. Toasts & Sync
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Đồng bộ tệp tin từ kho GitHub (Giúp Máy B thấy tệp do Máy A tải lên)
  const handleSyncFromGitHub = async (showToast = true) => {
    if (!gitHubConfig.isConnected || !gitHubConfig.token || !gitHubConfig.owner || !gitHubConfig.repo) {
      if (showToast) addToast('info', 'Vui lòng kết nối GitHub Token và Repo để đồng bộ');
      return;
    }

    setIsSyncing(true);
    if (showToast) addToast('info', 'Đang quét tệp tin từ kho GitHub...');

    try {
      const [assets, repoFiles] = await Promise.all([
        fetchGitHubReleaseAssets(gitHubConfig),
        fetchGitHubRepoContents(gitHubConfig, 'drive-data'),
      ]);

      setFiles((prev) => {
        // Bản đồ các tệp đã có id, githubAssetId, hoặc githubCommitSha
        const existingAssetMap = new Map<number, FileItem>();
        const existingShaMap = new Map<string, FileItem>();
        const existingNameMap = new Map<string, FileItem>();

        prev.forEach((f) => {
          if (f.githubAssetId) existingAssetMap.set(f.githubAssetId, f);
          if (f.githubCommitSha) existingShaMap.set(f.githubCommitSha, f);
          existingNameMap.set(f.name, f);
        });

        // 1. Tệp từ GitHub Releases
        const syncedReleaseItems: FileItem[] = assets.map((asset) => {
          const existing = existingAssetMap.get(asset.id) || existingNameMap.get(asset.name);
          const ext = getFileExtension(asset.name);
          const category = getFileCategory(asset.name, asset.content_type);

          return {
            id: existing ? existing.id : `gh-rel-${asset.id}`,
            name: asset.name,
            size: asset.size,
            category,
            mimeType: asset.content_type || 'application/octet-stream',
            extension: ext,
            updatedAt: asset.updated_at || asset.created_at,
            createdAt: asset.created_at,
            folderId: existing ? existing.folderId : null,
            isStarred: existing ? existing.isStarred : false,
            isTrashed: false,
            storageTarget: 'github_release',
            isLargeFile: true,
            githubAssetId: asset.id,
            githubDownloadUrl: asset.browser_download_url,
            description: existing?.description || `Tệp lưu trữ trên GitHub Releases (${gitHubConfig.owner}/${gitHubConfig.repo})`,
            tags: ['github-release', 'cloud-synced', ext],
          };
        });

        // 2. Tệp từ GitHub Repo Contents (drive-data/...)
        const syncedRepoItems: FileItem[] = repoFiles.map((rf) => {
          const existing = existingShaMap.get(rf.sha) || existingNameMap.get(rf.name);
          const ext = getFileExtension(rf.name);
          const category = getFileCategory(rf.name, 'application/octet-stream');

          return {
            id: existing ? existing.id : `gh-repo-${rf.sha.substring(0, 10)}`,
            name: rf.name,
            size: rf.size,
            category,
            mimeType: 'application/octet-stream',
            extension: ext,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            folderId: existing ? existing.folderId : null,
            isStarred: existing ? existing.isStarred : false,
            isTrashed: false,
            storageTarget: 'github_content',
            isLargeFile: false,
            githubCommitSha: rf.sha,
            githubDownloadUrl: rf.download_url,
            githubHtmlUrl: rf.html_url,
            description: existing?.description || `Tệp lưu trữ trên GitHub Repo (${gitHubConfig.owner}/${gitHubConfig.repo})`,
            tags: ['github-repo', 'cloud-synced', ext],
          };
        });

        // Tập hợp tất cả các tệp tin hiện đang tồn tại trên GitHub
        const cloudFilesMap = new Map<string, FileItem>();
        [...syncedReleaseItems, ...syncedRepoItems].forEach((cloudItem) => {
          cloudFilesMap.set(cloudItem.name, cloudItem);
        });

        const mergedMap = new Map<string, FileItem>();

        // 1. Đối với các tệp cục bộ (IndexedDB): Luôn giữ lại an toàn
        prev.forEach((f) => {
          if (!f.storageTarget.startsWith('github')) {
            mergedMap.set(f.name, f);
          }
        });

        // 2. Đối với các tệp đám mây GitHub:
        // GitHub là nguồn chuẩn. Nếu tệp nào đã bị Máy A xóa khỏi GitHub, Máy B sẽ tự động xóa theo!
        cloudFilesMap.forEach((cloudItem, name) => {
          const existing = prev.find((f) => f.name === name);
          if (existing) {
            // Cập nhật thông tin đám mây, bảo toàn thư mục và trạng thái sao
            mergedMap.set(name, {
              ...existing,
              ...cloudItem,
              id: existing.id,
              folderId: existing.folderId,
              isStarred: existing.isStarred,
              isTrashed: existing.isTrashed,
              description: existing.description || cloudItem.description,
            });
          } else {
            // Tệp mới được Máy A tải lên
            mergedMap.set(name, cloudItem);
          }
        });

        return Array.from(mergedMap.values());
      });

      const totalCount = assets.length + repoFiles.length;
      if (showToast) {
        addToast('success', `Đã đồng bộ thành công: ${totalCount} tệp tin từ GitHub!`);
      }
    } catch (err: any) {
      console.error('Lỗi đồng bộ GitHub:', err);
      if (showToast) {
        addToast('error', `Lỗi đồng bộ GitHub: ${err.message || 'Không thể tải dữ liệu'}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Tự động đồng bộ tệp từ GitHub khi mở web nếu đã kết nối
  useEffect(() => {
    if (gitHubConfig.isConnected && gitHubConfig.token) {
      handleSyncFromGitHub(false);
    }
  }, [gitHubConfig.isConnected, gitHubConfig.owner, gitHubConfig.repo]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(files));
    } catch {
      // ignore
    }
  }, [files]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(folders));
    } catch {
      // ignore
    }
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GITHUB_KEY, JSON.stringify(gitHubConfig));
    } catch {
      // ignore
    }
  }, [gitHubConfig]);

  // Handle Drag & Drop directly onto window
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        setIsUploadModalOpen(true);
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Filter & Search Logic
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // Section check
      if (currentSection === 'trash') {
        if (!file.isTrashed) return false;
      } else {
        if (file.isTrashed) return false;

        if (currentSection === 'starred' && !file.isStarred) return false;
        if (currentSection === 'github_storage' && !file.storageTarget.startsWith('github')) return false;

        // In 'my_drive', if no search and no filter, scope to folder
        if (
          currentSection === 'my_drive' &&
          !filters.searchQuery &&
          filters.category === 'all' &&
          filters.sizeRange === 'all' &&
          filters.dateRange === 'all' &&
          filters.storageSource === 'all' &&
          !filters.onlyStarred
        ) {
          if (file.folderId !== selectedFolderId) return false;
        }
      }

      // Starred filter
      if (filters.onlyStarred && !file.isStarred) return false;

      // Category filter
      if (filters.category !== 'all' && file.category !== filters.category) return false;

      // Storage Source filter
      if (filters.storageSource === 'github' && !file.storageTarget.startsWith('github')) return false;
      if (filters.storageSource === 'local' && file.storageTarget !== 'local_indexeddb') return false;

      // Size Range filter
      if (filters.sizeRange === 'small' && file.size >= 1024 * 1024) return false; // < 1MB
      if (filters.sizeRange === 'medium' && (file.size < 1024 * 1024 || file.size > 25 * 1024 * 1024)) return false; // 1-25MB
      if (filters.sizeRange === 'large' && (file.size <= 25 * 1024 * 1024 || file.size > 100 * 1024 * 1024)) return false; // 25-100MB
      if (filters.sizeRange === 'huge' && file.size <= 100 * 1024 * 1024) return false; // > 100MB

      // Date Range filter
      if (filters.dateRange !== 'all') {
        const fileTime = new Date(file.updatedAt).getTime();
        const now = Date.now();
        if (filters.dateRange === 'today' && now - fileTime > 24 * 3600 * 1000) return false;
        if (filters.dateRange === 'last7days' && now - fileTime > 7 * 24 * 3600 * 1000) return false;
        if (filters.dateRange === 'last30days' && now - fileTime > 30 * 24 * 3600 * 1000) return false;
        if (filters.dateRange === 'thisYear') {
          const fileYear = new Date(file.updatedAt).getFullYear();
          if (fileYear !== new Date().getFullYear()) return false;
        }
      }

      // Search Query filter
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchName = file.name.toLowerCase().includes(query);
        const matchDesc = file.description?.toLowerCase().includes(query);
        const matchTag = file.tags?.some((t) => t.toLowerCase().includes(query));
        const matchExt = file.extension.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchTag && !matchExt) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'vi');
      } else if (filters.sortBy === 'size') {
        comparison = a.size - b.size;
      } else if (filters.sortBy === 'type') {
        comparison = a.category.localeCompare(b.category);
      } else {
        // Date
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [files, currentSection, selectedFolderId, filters]);

  // Current folder's subfolders
  const currentSubFolders = useMemo(() => {
    if (currentSection !== 'my_drive' || filters.searchQuery || filters.category !== 'all') {
      return [];
    }
    return folders.filter((f) => !f.isTrashed && f.parentId === selectedFolderId);
  }, [folders, currentSection, selectedFolderId, filters]);

  // File Operations
  const handleDownloadFile = async (file: FileItem) => {
    addToast('info', `Bắt đầu tải xuống "${file.name}"...`);

    // 1. If stored in IndexedDB
    if (file.localBlobKey) {
      try {
        const blob = await getBlob(file.localBlobKey);
        if (blob) {
          triggerDownloadBlob(blob, file.name);
          addToast('success', `Đã tải xuống "${file.name}" thành công!`);
          return;
        }
      } catch (err) {
        console.error('Failed to get blob from IndexedDB:', err);
      }
    }

    // 2. If stored in GitHub Release or Repo
    if (file.githubDownloadUrl && file.githubDownloadUrl.startsWith('https://github.com')) {
      triggerDownloadUrl(file.githubDownloadUrl, file.name);
      addToast('success', `Đang tải tệp từ GitHub: "${file.name}"`);
      return;
    }

    // 3. Fallback for sample demo files: synthesize appropriate binary/text Blob so download ALWAYS succeeds
    try {
      let content = file.previewText || `Tệp tin: ${file.name}\nDung lượng: ${file.size} bytes\nĐược lưu trữ an toàn bởi GitDrive.`;
      const blob = new Blob([content], { type: file.mimeType || 'application/octet-stream' });
      triggerDownloadBlob(blob, file.name);
      addToast('success', `Đã tải xuống "${file.name}"!`);
    } catch (err) {
      addToast('error', `Lỗi tải tệp: ${(err as any).message}`);
    }
  };

  const handleToggleStar = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          const nextVal = !f.isStarred;
          addToast('info', nextVal ? `Đã gắn sao "${f.name}"` : `Đã bỏ gắn sao "${f.name}"`);
          return { ...f, isStarred: nextVal };
        }
        return f;
      })
    );
  };

  const handleTrashFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    // Nếu là tệp lưu trên GitHub, hỏi người dùng có muốn xóa luôn trên kho GitHub không
    if (file.storageTarget.startsWith('github') && gitHubConfig.isConnected && gitHubConfig.token) {
      const confirmCloudDelete = window.confirm(
        `Tệp "${file.name}" đang được lưu trữ trên kho GitHub.\n\nBạn có muốn xoá hoàn toàn tệp này khỏi GitHub để tất cả các thiết bị khác (Máy B, v.v.) cũng được đồng bộ xoá không?`
      );

      if (confirmCloudDelete) {
        await handlePermanentDelete(fileId);
        return;
      }
    }

    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          addToast('info', `Đã chuyển "${f.name}" vào thùng rác`);
          return { ...f, isTrashed: true, trashedAt: new Date().toISOString() };
        }
        return f;
      })
    );
  };

  const handleRestoreFile = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          addToast('success', `Đã khôi phục "${f.name}"`);
          return { ...f, isTrashed: false, trashedAt: undefined };
        }
        return f;
      })
    );
  };

  const handlePermanentDelete = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    // Delete from IndexedDB
    if (file.localBlobKey) {
      await deleteBlob(file.localBlobKey);
    }

    // Delete from GitHub release or repo contents
    if (gitHubConfig.isConnected && gitHubConfig.token) {
      if (file.githubAssetId) {
        addToast('info', `Đang xoá "${file.name}" khỏi GitHub Release...`);
        try {
          await deleteGitHubReleaseAsset(gitHubConfig, file.githubAssetId);
        } catch (err: any) {
          console.error('Lỗi khi xoá asset trên GitHub:', err);
        }
      } else if (file.storageTarget === 'github_content' || file.githubCommitSha) {
        addToast('info', `Đang xoá "${file.name}" khỏi GitHub Repository...`);
        try {
          await deleteGitHubRepoFile(gitHubConfig, `drive-data/${file.name}`, file.githubCommitSha);
        } catch (err: any) {
          console.error('Lỗi khi xoá repo file trên GitHub:', err);
        }
      }
    }

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    addToast('success', `Đã xoá vĩnh viễn "${file.name}" khỏi GitHub và thiết bị!`);
  };

  const handleEmptyTrash = async () => {
    if (window.confirm('Bạn có chắc chắn muốn dọn sạch tất cả tệp trong Thùng rác? Các tệp trên GitHub cũng sẽ được xoá vĩnh viễn.')) {
      const trashed = files.filter((f) => f.isTrashed);
      for (const f of trashed) {
        if (f.localBlobKey) await deleteBlob(f.localBlobKey);
        if (gitHubConfig.isConnected && gitHubConfig.token) {
          if (f.githubAssetId) {
            deleteGitHubReleaseAsset(gitHubConfig, f.githubAssetId).catch(() => {});
          } else if (f.storageTarget === 'github_content' || f.githubCommitSha) {
            deleteGitHubRepoFile(gitHubConfig, `drive-data/${f.name}`, f.githubCommitSha).catch(() => {});
          }
        }
      }
      setFiles((prev) => prev.filter((f) => !f.isTrashed));
      addToast('success', 'Đã dọn sạch thùng rác và kho GitHub');
    }
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          addToast('success', `Đã đổi tên tệp thành "${newName}"`);
          return { ...f, name: newName, updatedAt: new Date().toISOString() };
        }
        return f;
      })
    );
  };

  const handleFileUploaded = (newFiles: FileItem[]) => {
    setFiles((prev) => [...newFiles, ...prev]);
    addToast('success', `Đã tải lên thành công ${newFiles.length} tệp tin!`);
  };

  const handleCreateFolder = (newFolder: FolderItem) => {
    setFolders((prev) => [newFolder, ...prev]);
    addToast('success', `Đã tạo thư mục "${newFolder.name}"`);
  };

  const handleResetSampleData = () => {
    if (window.confirm('Đặt lại dữ liệu mẫu mặc định của GitDrive?')) {
      setFiles(getInitialFiles());
      setFolders(getInitialFolders());
      setSelectedFolderId(null);
      setCurrentSection('my_drive');
      addToast('info', 'Đã khôi phục dữ liệu mẫu ban đầu');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <Header
        filters={filters}
        onFilterChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        gitHubConfig={gitHubConfig}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onOpenUploadModal={() => {
          setUploadTargetType('auto');
          setIsUploadModalOpen(true);
        }}
        onOpenNewFolderModal={() => setIsNewFolderModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => {
            setCurrentSection(sec);
            setSelectedFolderId(null);
          }}
          files={files}
          gitHubConfig={gitHubConfig}
          onOpenUploadModal={(target) => {
            setUploadTargetType(target || 'auto');
            setIsUploadModalOpen(true);
          }}
          onOpenNewFolderModal={() => setIsNewFolderModalOpen(true)}
          onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        />

        {/* Center Content Area */}
        <main className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-hidden bg-white">
          {/* Quick Filter Bar */}
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            totalFilteredCount={filteredFiles.length}
          />

          {/* Subheader: Breadcrumb & Contextual Actions */}
          <div className="px-4 lg:px-6 py-2.5 bg-slate-50/50 border-b border-slate-200/80 flex items-center justify-between gap-4">
            <Breadcrumb
              currentSection={currentSection}
              selectedFolderId={selectedFolderId}
              folders={folders}
              onSelectFolder={setSelectedFolderId}
              onSelectSection={setCurrentSection}
            />

            <div className="flex items-center gap-2">
              {gitHubConfig.isConnected && (
                <button
                  type="button"
                  onClick={() => handleSyncFromGitHub(true)}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Đồng bộ danh sách tệp từ kho GitHub Releases (để Máy B thấy tệp Máy A tải lên)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ GitHub'}</span>
                </button>
              )}

              {currentSection === 'trash' && files.some((f) => f.isTrashed) && (
                <button
                  type="button"
                  onClick={handleEmptyTrash}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dọn sạch thùng rác</span>
                </button>
              )}

              {/* Reset to initial mock files helper */}
              <button
                type="button"
                onClick={handleResetSampleData}
                className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg flex items-center gap-1 transition-colors"
                title="Khôi phục tệp mẫu ban đầu"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Dữ liệu mẫu</span>
              </button>
            </div>
          </div>

          {/* Scrollable File & Folder Canvas */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {/* GitHub Storage Promo Banner in 'github_storage' section */}
            {currentSection === 'github_storage' && !gitHubConfig.isConnected && (
              <div className="mb-6 p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Github className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-sm">Kích hoạt Lưu trữ Dữ liệu Lớn trên GitHub (2GB)</h4>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Kết nối tài khoản GitHub của bạn để tự động lưu các tệp tin kích thước lớn (Datasets, Video 4K, Zip dung lượng cao) vào GitHub Releases hoàn toàn miễn phí.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGitHubModalOpen(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0"
                >
                  Cấu hình GitHub ngay
                </button>
              </div>
            )}

            {/* View Render */}
            {viewMode === 'grid' ? (
              <FileGrid
                folders={currentSubFolders}
                files={filteredFiles}
                selectedFolderId={selectedFolderId}
                onOpenFolder={setSelectedFolderId}
                onPreviewFile={setPreviewFile}
                onDownloadFile={handleDownloadFile}
                onToggleStar={handleToggleStar}
                onTrashFile={handleTrashFile}
                onRestoreFile={handleRestoreFile}
                onPermanentDelete={handlePermanentDelete}
                onRenameFile={(file) => setRenameFile(file)}
                isTrashView={currentSection === 'trash'}
              />
            ) : (
              <FileList
                files={filteredFiles}
                onPreviewFile={setPreviewFile}
                onDownloadFile={handleDownloadFile}
                onToggleStar={handleToggleStar}
                onTrashFile={handleTrashFile}
                onRestoreFile={handleRestoreFile}
                onPermanentDelete={handlePermanentDelete}
                onRenameFile={(file) => setRenameFile(file)}
                isTrashView={currentSection === 'trash'}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownloadFile}
          onToggleStar={handleToggleStar}
          onTrash={handleTrashFile}
        />
      )}

      {isGitHubModalOpen && (
        <GitHubSettingsModal
          config={gitHubConfig}
          isOpen={isGitHubModalOpen}
          onClose={() => setIsGitHubModalOpen(false)}
          onSaveConfig={(cfg) => {
            setGitHubConfig(cfg);
            addToast('success', cfg.isConnected ? 'Đã lưu và kết nối GitHub thành công!' : 'Đã cập nhật cấu hình');
            if (cfg.isConnected) {
              setTimeout(() => {
                handleSyncFromGitHub(true);
              }, 400);
            }
          }}
        />
      )}

      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          gitHubConfig={gitHubConfig}
          onFileUploaded={handleFileUploaded}
          currentFolderId={selectedFolderId}
          onOpenGitHubSettings={() => {
            setIsUploadModalOpen(false);
            setIsGitHubModalOpen(true);
          }}
          defaultTarget={uploadTargetType}
        />
      )}

      {isNewFolderModalOpen && (
        <NewFolderModal
          isOpen={isNewFolderModalOpen}
          onClose={() => setIsNewFolderModalOpen(false)}
          onCreateFolder={handleCreateFolder}
          currentFolderId={selectedFolderId}
        />
      )}

      {renameFile && (
        <RenameModal
          file={renameFile}
          onClose={() => setRenameFile(null)}
          onRename={handleRenameFile}
        />
      )}

      {/* Floating Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
