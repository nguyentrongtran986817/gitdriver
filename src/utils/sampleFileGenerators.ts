import * as XLSX from 'xlsx';

/**
 * Tạo file Excel .xlsx thực tế với nhiều sheet, dữ liệu phong phú
 */
export function generateSampleExcelBlob(): Blob {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Bảng kê doanh thu & đơn hàng
  const salesData = [
    ['MÃ ĐƠN', 'TÊN KHÁCH HÀNG / ĐỐI TÁC', 'GÓI DỊCH VỤ LƯU TRỮ', 'DUNG LƯỢNG', 'ĐƠN GIÁ (VNĐ)', 'THÀNH TIỀN (VNĐ)', 'NGÀY TẠO', 'TRẠNG THÁI'],
    ['ORD-2026-001', 'Công ty Cổ phần Công nghệ Alpha', 'GitHub Release 2GB Pro', '1.5 TB', 1500000, 1500000, '2026-03-01', 'Đã thanh toán'],
    ['ORD-2026-002', 'Tập đoàn Giải pháp Số VinaData', 'Enterprise Hybrid Multi-Cloud', '5.0 TB', 4800000, 4800000, '2026-03-02', 'Đã thanh toán'],
    ['ORD-2026-003', 'Viện Nghiên cứu Trí tuệ Nhân tạo', 'Dataset Large File Storage', '8.2 TB', 7200000, 7200000, '2026-03-04', 'Đang xử lý'],
    ['ORD-2026-004', 'Studio Thiết kế Đồ họa Sáng Tạo', 'Media Video 4K & Asset Vault', '2.4 TB', 2200000, 2200000, '2026-03-05', 'Đã thanh toán'],
    ['ORD-2026-005', 'Startup FinTech NextGen', 'Bảo mật AES-256 Cloud Backup', '1.0 TB', 1200000, 1200000, '2026-03-07', 'Chờ chuyển khoản'],
    ['ORD-2026-006', 'Trường Đại học Công nghệ', 'Học liệu Khoa học & Video Bài giảng', '3.5 TB', 3100000, 3100000, '2026-03-08', 'Đã thanh toán'],
    ['ORD-2026-007', 'Công ty Truyền thông MediaHub', 'Kho lưu trữ Podcast & Audio Lossless', '1.8 TB', 1600000, 1600000, '2026-03-10', 'Đã thanh toán'],
    ['TỔNG CỘNG', '', '', '23.4 TB', '', 21600000, '', '7 Đơn hàng']
  ];

  const wsSales = XLSX.utils.aoa_to_sheet(salesData);

  // Định dạng độ rộng cột
  wsSales['!cols'] = [
    { wch: 14 },
    { wch: 34 },
    { wch: 30 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 }
  ];

  XLSX.utils.book_append_sheet(wb, wsSales, 'Doanh thu dịch vụ Q1');

  // Sheet 2: Kế hoạch phân bổ ngân sách
  const budgetData = [
    ['DANH MỤC CHI PHÍ', 'DỰ TOÁN ĐẦU KỲ', 'CHI THỰC TẾ', 'CHÊNH LỆCH', 'TỶ LỆ HOÀN THÀNH', 'GHI CHÚ'],
    ['Hạ tầng Cloud & Server Ingress', 45000000, 41200000, 3800000, '91.5%', 'Tối ưu chi phí nhờ cache CDN'],
    ['API Gateway & Băng thông GitHub', 18000000, 15400000, 2600000, '85.6%', 'Tận dụng GitHub Releases Assets'],
    ['Bảo mật, Chứng chỉ SSL & Key Vault', 12000000, 12000000, 0, '100.0%', 'Hoàn thành thanh toán định kỳ'],
    ['Phát triển tính năng Xem trước file', 25000000, 24500000, 500000, '98.0%', 'Hỗ trợ PDF, Excel, Word, Video'],
    ['Hỗ trợ kỹ thuật & Vận hành 24/7', 15000000, 13800000, 1200000, '92.0%', 'Đội ngũ trực ổn định'],
    ['Dự phòng rủi ro hệ thống', 10000000, 2500000, 7500000, '25.0%', 'Không có sự cố phát sinh'],
    ['TỔNG NGÂN SÁCH', 125000000, 109400000, 15600000, '87.5%', 'Tiết kiệm 12.5% ngân sách']
  ];

  const wsBudget = XLSX.utils.aoa_to_sheet(budgetData);
  wsBudget['!cols'] = [
    { wch: 36 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(wb, wsBudget, 'Kế hoạch Ngân sách 2026');

  // Sheet 3: Thông số kỹ thuật
  const techSpecs = [
    ['THÔNG SỐ', 'GIÁ TRỊ', 'MÔ TẢ'],
    ['Dung lượng tệp tối đa', '2.0 GB / tệp', 'Lưu trữ đám mây GitHub Releases'],
    ['Dung lượng cục bộ', 'Không giới hạn (IndexedDB)', 'Lưu trên trình duyệt thiết bị'],
    ['Định dạng hỗ trợ', 'Tất cả (PDF, Excel, Word, Video, Audio, Code)', 'Xem trực tiếp không cần tải'],
    ['Tốc độ xem trước', '< 100ms', 'Trích xuất và render tức thì trên client']
  ];
  const wsTech = XLSX.utils.aoa_to_sheet(techSpecs);
  wsTech['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsTech, 'Thông số Kỹ thuật');

  const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([u8], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

/**
 * Tạo một file PDF chuẩn hợp lệ dạng Blob chứa văn bản báo cáo doanh nghiệp
 */
export function generateSamplePdfBlob(): Blob {
  // Tiêu chuẩn cấu trúc PDF 1.4 hợp lệ đơn giản với Text Stream
  const pdfString = `%PDF-1.4
%âãÏÓ
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 595.28 841.89]
  /Contents 4 0 R
  /Resources <<
    /Font <<
      /F1 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica-Bold
      >>
      /F2 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica
      >>
    >>
  >>
>>
endobj
4 0 obj
<<
  /Length 720
>>
stream
BT
/F1 22 Tf
50 780 Td
(BAO CAO KINH DOANH VA TANG TRUONG QUY 3 - 2026) Tj
0 -30 Td
/F2 11 Tf
(He thong Luu tru Dam may GitDrive - Cloud & Local Hybrid Storage) Tj
0 -20 Td
(Ngay phat hanh: 16/09/2026 | Nguoi lap: Nguyen Trong | Phong Ban: Ban Giam Doc) Tj
0 -35 Td
/F1 14 Tf
(1. TONG QUAN HOAT DONG KINH DOANH) Tj
0 -20 Td
/F2 11 Tf
(- Doanh thu toan he thong dat 145% so voi cung ky nam truoc, vuot chi tieu 22%.) Tj
0 -18 Td
(- Luong nguoi dung tich cuc hoat dong hang thang (MAU) vuot moc 1.250.000 tai khoan.) Tj
0 -18 Td
(- Chi phi luu tru giam 85% nho tan dung luu tru GitHub Releases Assets 2GB/tep.) Tj
0 -35 Td
/F1 14 Tf
(2. CAP NHAT TINH NANG SAN PHAM) Tj
0 -20 Td
/F2 11 Tf
(- Ho tro xem truc tiep moi dinh dang file: PDF, Excel (XLSX, XLS, CSV), Word, Video, Audio.) Tj
0 -18 Td
(- Bo dieu khien video voi chuc nang tua nhanh 10s, 30s, chinh toc do phat va toan man hinh.) Tj
0 -18 Td
(- Quan ly thu muc chuyen nghiep: tao, xem, va xoa thu muc an toan ca Offline va Online.) Tj
0 -35 Td
/F1 14 Tf
(3. MUC TIEU TRONG TAM QUY 4 - 2026) Tj
0 -20 Td
/F2 11 Tf
(- Mo rong bang thong ket noi da vung tai khu vuc Dong Nam A va Chau A.) Tj
0 -18 Td
(- Tich hop kha nang dong bo hoa 2 chieu tu dong giua thiet bi va may chu GitDrive.) Tj
0 -18 Td
(- Bao ve du lieu nguoi dung bang co che ma hoa cap do doanh nghiep.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000015 00000 n 
0000000068 00000 n 
0000000125 00000 n 
0000000371 00000 n 
trailer
<<
  /Size 5
  /Root 1 0 R
>>
startxref
1144
%%EOF`;

  return new Blob([pdfString], { type: 'application/pdf' });
}
