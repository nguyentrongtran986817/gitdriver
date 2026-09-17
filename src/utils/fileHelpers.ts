import { FileCategory, FileItem, FolderItem } from '../types';

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts.pop()?.toLowerCase() || '';
}

export function getFileCategory(filename: string, mimeType?: string): FileCategory {
  const ext = getFileExtension(filename);
  const mime = mimeType?.toLowerCase() || '';

  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)
  ) {
    return 'image';
  }

  if (
    mime.startsWith('video/') ||
    ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'].includes(ext)
  ) {
    return 'video';
  }

  if (
    mime.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)
  ) {
    return 'audio';
  }

  if (
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso'].includes(ext) ||
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('archive')
  ) {
    return 'archive';
  }

  if (
    [
      'js',
      'ts',
      'jsx',
      'tsx',
      'html',
      'css',
      'json',
      'py',
      'java',
      'cpp',
      'c',
      'go',
      'rs',
      'sql',
      'sh',
      'yaml',
      'yml',
      'xml',
    ].includes(ext)
  ) {
    return 'code';
  }

  if (
    mime.includes('pdf') ||
    mime.includes('document') ||
    mime.includes('word') ||
    mime.includes('excel') ||
    mime.includes('sheet') ||
    mime.includes('presentation') ||
    mime.includes('text') ||
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv'].includes(ext)
  ) {
    return 'document';
  }

  return 'other';
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function triggerDownloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function triggerDownloadUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function getInitialFolders(): FolderItem[] {
  return [
    {
      id: 'folder-1',
      name: 'Tài liệu Công việc & Hợp đồng',
      parentId: null,
      color: '#3b82f6',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      isStarred: true,
    },
    {
      id: 'folder-2',
      name: 'Dữ liệu Lớn GitHub Releases (Datasets)',
      parentId: null,
      color: '#10b981',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      isStarred: true,
    },
    {
      id: 'folder-3',
      name: 'Đồ họa & Media Media',
      parentId: null,
      color: '#f59e0b',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      isStarred: false,
    },
  ];
}

export function getInitialFiles(): FileItem[] {
  return [
    {
      id: 'file-1',
      name: 'BigData_MachineLearning_Dataset_v2.zip',
      size: 734003200, // ~700 MB
      category: 'archive',
      mimeType: 'application/zip',
      extension: 'zip',
      updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      folderId: 'folder-2',
      isStarred: true,
      isTrashed: false,
      storageTarget: 'github_release',
      isLargeFile: true,
      githubDownloadUrl: 'https://github.com/example/repo/releases/download/gitdrive-storage/BigData_MachineLearning_Dataset_v2.zip',
      description: 'Bộ dữ liệu huấn luyện thị giác máy tính quy mô lớn (700 MB) lưu trữ trực tiếp trên GitHub Release Assets.',
      tags: ['github-large-file', 'release-asset', 'dataset', 'zip'],
    },
    {
      id: 'file-2',
      name: 'Video_Gioi_Thieu_San_Pham_4K.mp4',
      size: 345200000, // ~329 MB
      category: 'video',
      mimeType: 'video/mp4',
      extension: 'mp4',
      updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      folderId: 'folder-3',
      isStarred: false,
      isTrashed: false,
      storageTarget: 'github_release',
      isLargeFile: true,
      githubDownloadUrl: 'https://github.com/example/repo/releases/download/gitdrive-storage/Video_Gioi_Thieu_San_Pham_4K.mp4',
      description: 'Video chất lượng cao 4K giới thiệu phiên bản mới, lưu trữ trên GitHub Assets.',
      tags: ['video', 'media', 'github-release'],
    },
    {
      id: 'file-3',
      name: 'Bao_Cao_Kinh_Doanh_Q3_2026.pdf',
      size: 4820000, // ~4.6 MB
      category: 'document',
      mimeType: 'application/pdf',
      extension: 'pdf',
      updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      folderId: 'folder-1',
      isStarred: true,
      isTrashed: false,
      storageTarget: 'local_indexeddb',
      localBlobKey: 'sample-pdf-blob',
      isLargeFile: false,
      description: 'Báo cáo tổng kết doanh thu và chiến lược phát triển nền tảng quý 3.',
      tags: ['report', 'pdf', 'finance'],
      previewText: 'BÁO CÁO KINH DOANH QUÝ 3/2026\n1. Doanh thu tăng trưởng 145% so với cùng kỳ.\n2. Lượng người dùng hoạt động đạt 1.2M lượt truy cập hàng tháng.\n3. Tiết kiệm 85% chi phí lưu trữ nhờ tận dụng GitHub Release Assets 2GB/tệp.',
    },
    {
      id: 'file-4',
      name: 'Architecture_Cloud_Diagram.png',
      size: 2150000, // ~2 MB
      category: 'image',
      mimeType: 'image/png',
      extension: 'png',
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      folderId: 'folder-3',
      isStarred: false,
      isTrashed: false,
      storageTarget: 'local_indexeddb',
      isLargeFile: false,
      thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      description: 'Sơ đồ thiết kế kiến trúc hệ thống lưu trữ phân tán và API Gateway.',
      tags: ['diagram', 'architecture', 'image'],
    },
    {
      id: 'file-5',
      name: 'server_configuration_backup.json',
      size: 84200, // ~82 KB
      category: 'code',
      mimeType: 'application/json',
      extension: 'json',
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      folderId: null,
      isStarred: false,
      isTrashed: false,
      storageTarget: 'github_content',
      isLargeFile: false,
      description: 'Cấu hình đồng bộ hệ thống, khoá phân quyền và routing CDN.',
      tags: ['config', 'json', 'github-repo'],
      previewText: '{\n  "version": "2.4.0",\n  "storage_backend": "github_releases_v2",\n  "max_file_size_gb": 2.0,\n  "chunk_size_mb": 50,\n  "encryption": "AES-GCM-256",\n  "active_nodes": ["ap-southeast-1", "asia-east1"]\n}',
    },
    {
      id: 'file-6',
      name: 'Hop_Dong_Doi_Tac_Cong_Nghe.docx',
      size: 1350000, // ~1.3 MB
      category: 'document',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      folderId: 'folder-1',
      isStarred: true,
      isTrashed: false,
      storageTarget: 'local_indexeddb',
      isLargeFile: false,
      description: 'Hợp đồng hợp tác chiến lược khai thác dịch vụ lưu trữ dữ liệu lớn.',
      tags: ['contract', 'docx', 'legal'],
    },
    {
      id: 'file-7',
      name: 'Podcast_Cong_Nghe_Tap_42.mp3',
      size: 64200000, // ~61 MB
      category: 'audio',
      mimeType: 'audio/mpeg',
      extension: 'mp3',
      updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      folderId: null,
      isStarred: false,
      isTrashed: false,
      storageTarget: 'github_release',
      isLargeFile: true,
      description: 'Bản thu âm podcast công nghệ: "Giải pháp lưu trữ Terabyte miễn phí trên GitHub".',
      tags: ['podcast', 'audio', 'github-release'],
    },
    {
      id: 'file-8',
      name: 'Bang_Ke_Doanh_Thu_Va_Ngan_Sach_2026.xlsx',
      size: 425000, // ~415 KB
      category: 'document',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
      updatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      folderId: 'folder-1',
      isStarred: true,
      isTrashed: false,
      storageTarget: 'local_indexeddb',
      localBlobKey: 'sample-excel-blob',
      isLargeFile: false,
      description: 'Bảng tính Excel quản lý doanh thu dịch vụ, đơn hàng đối tác và phân bổ ngân sách 2026.',
      tags: ['excel', 'spreadsheet', 'finance', 'budget', 'q1-2026'],
      previewText: 'Bảng tính Excel: Doanh thu & Ngân sách 2026',
    },
  ];
}
