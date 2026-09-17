import { GitHubConfig } from '../types';

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
  public_repos: number;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  assets: GitHubReleaseAsset[];
}

export interface GitHubReleaseAsset {
  id: number;
  name: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
  content_type: string;
}

export async function verifyGitHubToken(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn (401 Unauthorized)');
    }
    throw new Error(`Lỗi kết nối GitHub API (${res.status})`);
  }

  return await res.json();
}

export async function verifyRepository(
  token: string,
  owner: string,
  repo: string
): Promise<{ private: boolean; default_branch: string; full_name: string }> {
  const res = await fetch(`https://api.github.com/repos/${owner.trim()}/${repo.trim()}`, {
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Không tìm thấy kho lưu trữ "${owner}/${repo}". Hãy đảm bảo tên repo chính xác và token có quyền "repo".`);
    }
    throw new Error(`Lỗi kiểm tra kho lưu trữ (${res.status})`);
  }

  const data = await res.json();
  return {
    private: data.private,
    default_branch: data.default_branch || 'main',
    full_name: data.full_name,
  };
}

/**
 * Lấy hoặc tự động khởi tạo GitHub Release làm Storage Bucket (Hỗ trợ file lên tới 2GB!)
 */
export async function getOrCreateStorageRelease(
  config: GitHubConfig
): Promise<GitHubRelease> {
  const { token, owner, repo, releaseTag } = config;
  const tag = releaseTag || 'gitdrive-storage';

  // 1. Kiểm tra release đã tồn tại chưa
  const getRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (getRes.ok) {
    return await getRes.json();
  }

  // 2. Nếu chưa có, tự động tạo Release mới để làm kho chứa tệp lớn
  const createRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tag_name: tag,
        name: 'GitDrive Cloud Storage Bucket',
        body: 'Kho lưu trữ đám mây cho ứng dụng GitDrive. Hỗ trợ tệp tin lớn lên tới 2GB mỗi tệp thông qua GitHub Release Assets API.',
        draft: false,
        prerelease: false,
      }),
    }
  );

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Không thể tạo Release bucket (${createRes.status}). Đảm bảo token có quyền write:repo_hook / repo.`
    );
  }

  return await createRes.json();
}

/**
 * Tải tệp lớn lên GitHub Release Assets (tối đa 2GB mỗi tệp)
 */
export async function uploadLargeFileToGitHubRelease(
  config: GitHubConfig,
  file: File | Blob,
  fileName: string,
  onProgress?: (percentage: number) => void
): Promise<GitHubReleaseAsset> {
  const { token, owner, repo } = config;

  // Lấy hoặc tạo release id
  const release = await getOrCreateStorageRelease(config);
  const releaseId = release.id;

  // Kiểm tra nếu tên file đã trùng trong release, xoá asset cũ trước
  if (release.assets && release.assets.length > 0) {
    const existing = release.assets.find((a) => a.name === fileName);
    if (existing) {
      await deleteGitHubReleaseAsset(config, existing.id).catch(() => {});
    }
  }

  const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(
    fileName
  )}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl);

    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const asset: GitHubReleaseAsset = JSON.parse(xhr.responseText);
          resolve(asset);
        } catch {
          reject(new Error('Phản hồi từ GitHub không đúng định dạng JSON'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.message || `Tải lên GitHub thất bại (${xhr.status})`));
        } catch {
          reject(new Error(`Tải lên GitHub thất bại với mã lỗi ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Lỗi mạng khi tải lên GitHub'));
    };

    xhr.send(file);
  });
}

/**
 * Xoá asset khỏi GitHub Release
 */
export async function deleteGitHubReleaseAsset(
  config: GitHubConfig,
  assetId: number
): Promise<void> {
  const { token, owner, repo } = config;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/assets/${assetId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!res.ok && res.status !== 404) {
    throw new Error(`Không thể xoá tệp từ GitHub (${res.status})`);
  }
}

/**
 * Tải tệp thông thường vào Repository Contents (<25MB)
 */
export async function uploadFileToRepoContents(
  config: GitHubConfig,
  file: File,
  folderPath: string = 'drive-data'
): Promise<{ sha: string; html_url: string; download_url: string }> {
  const { token, owner, repo, branch } = config;
  const path = `${folderPath}/${file.name}`.replace(/^\/+/, '');

  // Đọc file thành base64
  const arrayBuffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Content = btoa(binary);

  // Kiểm tra file đã có chưa để lấy SHA nếu cần cập nhật
  let existingSha: string | undefined;
  try {
    const checkRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    if (checkRes.ok) {
      const data = await checkRes.json();
      existingSha = data.sha;
    }
  } catch {
    // ignore
  }

  const putRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Upload ${file.name} via GitDrive`,
        content: base64Content,
        branch: branch || 'main',
        sha: existingSha,
      }),
    }
  );

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi tải tệp lên Repository (${putRes.status})`);
  }

  const result = await putRes.json();
  return {
    sha: result.content?.sha,
    html_url: result.content?.html_url,
    download_url: result.content?.download_url,
  };
}
