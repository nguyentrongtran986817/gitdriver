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
 * Chuyển đổi File sang chuỗi Base64 một cách an toàn và nhanh chóng bằng FileReader
 */
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Bỏ tiền tố data:...;base64,
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.substring(commaIndex + 1) : result);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Tải tệp lên Repository Contents (drive-data/...) thông qua api.github.com
 * Ưu điểm vượt trội: api.github.com hỗ trợ CORS 100% từ trình duyệt (không bị chặn như uploads.github.com)
 */
export async function uploadFileToRepoContents(
  config: GitHubConfig,
  file: File,
  folderPath: string = 'drive-data'
): Promise<{ sha: string; html_url: string; download_url: string }> {
  const { token, owner, repo, branch } = config;
  const cleanPath = `${folderPath}/${file.name}`.replace(/^\/+/, '');

  // 1. Chuyển file sang base64
  const base64Content = await fileToBase64(file);

  // 2. Kiểm tra xem file đã tồn tại trên GitHub chưa để lấy SHA (nếu có thì ghi đè bản mới)
  let existingSha: string | undefined;
  try {
    const checkUrl = branch
      ? `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(cleanPath)}?ref=${branch}`
      : `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(cleanPath)}`;
    const checkRes = await fetch(checkUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (checkRes.ok) {
      const data = await checkRes.json();
      existingSha = data.sha;
    }
  } catch {
    // ignore
  }

  // 3. Chuẩn bị payload tải tệp
  const bodyPayload: Record<string, any> = {
    message: `Upload ${file.name} via GitDrive`,
    content: base64Content,
    sha: existingSha,
  };
  if (branch) {
    bodyPayload.branch = branch;
  }

  let putRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    }
  );

  // Nếu chỉ định nhánh thất bại (ví dụ cấu hình 'main' nhưng kho dùng 'master'), thử lại với nhánh mặc định
  if (!putRes.ok && branch) {
    delete bodyPayload.branch;
    putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      }
    );
  }

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi tải tệp lên GitHub Repository (${putRes.status})`);
  }

  const result = await putRes.json();
  const rawDownloadUrl = result.content?.download_url || `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${cleanPath}`;

  return {
    sha: result.content?.sha || '',
    html_url: result.content?.html_url || `https://github.com/${owner}/${repo}/blob/HEAD/${cleanPath}`,
    download_url: result.content?.download_url || rawDownloadUrl,
  };
}

/**
 * Lấy danh sách các tệp tin lưu trong thư mục drive-data trên GitHub
 */
export async function fetchGitHubRepoContents(
  config: GitHubConfig,
  folderPath: string = 'drive-data'
): Promise<Array<{ name: string; size: number; path: string; sha: string; download_url: string; html_url: string }>> {
  const { token, owner, repo, branch } = config;
  if (!token || !owner || !repo) return [];

  try {
    // Thử truy vấn có chỉ định branch trước
    let res = await fetch(
      branch
        ? `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`
        : `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    // Nếu không tìm thấy và có branch, thử truy vấn không truyền branch (dùng nhánh mặc định của kho)
    if (!res.ok && branch) {
      res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
    }

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data.filter((item: any) => item.type === 'file');
    }
  } catch {
    // ignore
  }

  return [];
}

/**
 * Xóa một tệp trong Repository contents
 */
export async function deleteGitHubRepoFile(
  config: GitHubConfig,
  path: string,
  sha?: string
): Promise<void> {
  const { token, owner, repo, branch } = config;
  const targetBranch = branch || 'main';
  let fileSha = sha;

  if (!fileSha) {
    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${targetBranch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (getRes.ok) {
        const data = await getRes.json();
        fileSha = data.sha;
      }
    } catch {
      // ignore
    }
  }

  if (!fileSha) return;

  await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Delete ${path} via GitDrive`,
      sha: fileSha,
      branch: targetBranch,
    }),
  });
}

/**
 * Tải tệp lên GitHub một cách thông minh và chống lỗi CORS:
 * - Tệp <= 30MB (ảnh, pdf, tài liệu, zip nhỏ): Tải thẳng lên GitHub Repository (api.github.com) hoàn toàn không bị lỗi CORS!
 * - Tệp lớn: Thử Release, nếu CORS chặn thì tự động dự phòng.
 */
export async function uploadToGitHubCloud(
  config: GitHubConfig,
  file: File,
  onProgress?: (percentage: number) => void
): Promise<{
  id: string | number;
  name: string;
  size: number;
  downloadUrl: string;
  storageTarget: 'github_release' | 'github_content';
  sha?: string;
  htmlUrl?: string;
}> {
  // Giới hạn 25MB cho Git Contents API
  const MAX_REPO_SIZE = 25 * 1024 * 1024;

  if (file.size <= MAX_REPO_SIZE) {
    if (onProgress) onProgress(30);
    const res = await uploadFileToRepoContents(config, file, 'drive-data');
    if (onProgress) onProgress(100);

    return {
      id: res.sha || `${Date.now()}`,
      name: file.name,
      size: file.size,
      downloadUrl: res.download_url,
      storageTarget: 'github_content',
      sha: res.sha,
      htmlUrl: res.html_url,
    };
  }

  // Tệp lớn hơn 25MB: Thử tải qua GitHub Release Assets
  try {
    const asset = await uploadLargeFileToGitHubRelease(config, file, file.name, onProgress);
    return {
      id: asset.id,
      name: asset.name,
      size: asset.size,
      downloadUrl: asset.browser_download_url,
      storageTarget: 'github_release',
    };
  } catch (err: any) {
    // Nếu uploads.github.com bị trình duyệt chặn CORS và file vẫn < 50MB, cố gắng lưu vào Repo
    if (file.size <= 50 * 1024 * 1024) {
      if (onProgress) onProgress(30);
      const res = await uploadFileToRepoContents(config, file, 'drive-data');
      if (onProgress) onProgress(100);
      return {
        id: res.sha || `${Date.now()}`,
        name: file.name,
        size: file.size,
        downloadUrl: res.download_url,
        storageTarget: 'github_content',
        sha: res.sha,
        htmlUrl: res.html_url,
      };
    }
    throw new Error(
      `Không thể tải tệp lớn lên GitHub Release: ${err.message}. Gợi ý: Trình duyệt web có thể chặn gửi dữ liệu trực tiếp tới uploads.github.com do chính sách CORS.`
    );
  }
}

/**
 * Lấy toàn bộ danh sách tệp tin đang lưu trên GitHub (cả thư mục drive-data và Releases) để đồng bộ giữa các máy (Máy A -> Máy B)
 */
export async function fetchGitHubReleaseAssets(
  config: GitHubConfig
): Promise<GitHubReleaseAsset[]> {
  const { token, owner, repo, releaseTag } = config;
  if (!token || !owner || !repo) return [];

  const tag = releaseTag || 'gitdrive-storage';
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!res.ok) {
      return [];
    }

    const release: GitHubRelease = await res.json();
    return release.assets || [];
  } catch {
    return [];
  }
}


