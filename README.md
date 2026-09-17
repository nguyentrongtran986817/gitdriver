# GitDrive - Cloud Storage & GitHub Large Files

Ứng dụng lưu trữ đám mây tương tự Google Drive, hỗ trợ tải lên/xuống, tìm kiếm bộ lọc nhanh và lưu trữ tệp tin dung lượng lớn lên đến 2GB qua GitHub Release Assets.

---

## 🚀 Cách đưa lên GitHub và tự động bật GitHub Pages (Không cần cài thư viện trên máy)

Dự án đã được tích hợp sẵn luồng tự động hóa **GitHub Actions** (`.github/workflows/deploy.yml`). Máy chủ GitHub sẽ tự động cài thư viện và build web cho bạn hoàn toàn miễn phí.

### Các bước thực hiện:

1. **Đưa code lên GitHub:**
   * Tạo 1 Repository mới trên GitHub (ví dụ: `my-gitdrive`).
   * Tải toàn bộ source code này lên Repository đó.

2. **Bật chế độ GitHub Actions cho Pages:**
   * Trên trang repository GitHub của bạn, nhấn vào mục **Settings** (Cài đặt).
   * Ở thanh menu bên trái, tìm và nhấn vào **Pages**.
   * Tại mục **Build and deployment** $\rightarrow$ **Source**:
     * Đổi từ `Deploy from a branch` sang **`GitHub Actions`**.

3. **Xem kết quả:**
   * Sau khi chọn, GitHub sẽ tự động kích hoạt tiến trình cài đặt và đóng gói (chỉ mất khoảng 1 - 2 phút).
   * Khi hoàn tất, link trang web của bạn sẽ hiển thị ngay tại mục Pages:
     👉 `https://<tên-github-của-bạn>.github.io/<tên-repo>/`
   * Bạn chỉ cần nhấp vào link đó là trang web hoạt động bình thường mà không cần cài bất kỳ phần mềm nào trên máy tính.
