export type FileCategory = 'all' | 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other';

export type StorageTarget = 'github_release' | 'github_content' | 'local_indexeddb';

export interface FileItem {
  id: string;
  name: string;
  size: number; // in bytes
  category: FileCategory;
  mimeType: string;
  extension: string;
  updatedAt: string;
  createdAt: string;
  folderId: string | null;
  isStarred: boolean;
  isTrashed: boolean;
  trashedAt?: string;
  storageTarget: StorageTarget;
  githubAssetId?: number;
  githubDownloadUrl?: string;
  githubHtmlUrl?: string;
  githubCommitSha?: string;
  localBlobKey?: string;
  thumbnailUrl?: string;
  previewText?: string;
  description?: string;
  tags?: string[];
  isLargeFile?: boolean; // > 50MB or stored in GitHub Releases
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  createdAt: string;
  updatedAt: string;
  isStarred?: boolean;
  isTrashed?: boolean;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  releaseTag: string;
  releaseId?: number;
  isConnected: boolean;
  username?: string;
  avatarUrl?: string;
  lastChecked?: string;
  storageMode: 'releases_assets' | 'repository_contents' | 'hybrid';
}

export interface FilterState {
  searchQuery: string;
  category: FileCategory;
  dateRange: 'all' | 'today' | 'last7days' | 'last30days' | 'thisYear';
  sizeRange: 'all' | 'small' | 'medium' | 'large' | 'huge'; // <1MB, 1-25MB, 25-100MB, >100MB (GitHub large files)
  storageSource: 'all' | 'github' | 'local';
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
  onlyStarred: boolean;
}

export interface UploadTask {
  id: string;
  name: string;
  size: number;
  category: FileCategory;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  target: StorageTarget;
  error?: string;
  uploadedBytes?: number;
  speed?: string;
}

export type ViewMode = 'grid' | 'list';
export type NavSection = 'my_drive' | 'starred' | 'recent' | 'trash' | 'github_storage';
