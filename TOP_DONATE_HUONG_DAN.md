# TOP DONATE - QLCL-DV

Gói này thêm:

- Bảng **Top Donate** trên trang `/donate`.
- Top 1, 2, 3 dạng thẻ; hạng 4-10 dạng danh sách.
- Tự xếp hạng theo số tiền từ cao xuống thấp.
- Trang **Quản lý Top Donate** cho Admin và SuperAdmin.
- Thêm, sửa, xóa, ẩn, hiện, tìm kiếm và phân trang.
- Hỗ trợ dark mode.
- Collection Firestore mới: `top_donates` (tự tạo khi thêm bản ghi đầu tiên).

## 1. Chép file

Chép toàn bộ thư mục/file trong gói vào thư mục gốc `qlcldv`. Chọn ghi đè khi máy hỏi.

Các file mới:

- `src/components/TopDonateSection.jsx`
- `src/pages/TopDonateAdminPage.jsx`
- `src/services/topDonateService.js`

Các file được cập nhật:

- `src/pages/DonatePage.jsx`
- `src/AuthContext.jsx`
- `src/data/sitePages.js`
- `src/App.jsx`
- `src/components/Layout.jsx`
- `src/pages/ManagedPageResolver.jsx`
- `firestore.rules`

## 2. Cập nhật Firestore Rules

Vào Firebase Console > Firestore Database > Rules.

Chép toàn bộ nội dung file `firestore.rules` mới, sau đó bấm **Publish**.

Nếu bỏ qua bước này, Admin/SuperAdmin sẽ gặp lỗi `Missing or insufficient permissions` khi lưu Top Donate.

## 3. Kiểm tra trên máy

Trong Terminal tại thư mục dự án:

```bash
npm install
npm run build
```

## 4. Đẩy lên GitHub/Vercel

```bash
git add src firestore.rules
git commit -m "feat: add Top Donate"
git push
```

Vercel sẽ tự deploy commit mới.

## 5. Sử dụng

1. Đăng nhập tài khoản Admin hoặc SuperAdmin.
2. Bấm tên tài khoản trên Header.
3. Chọn **Quản lý Top Donate**.
4. Bấm **Thêm người Donate**.
5. Nhập tên, số tiền, thời gian, lời nhắn và trạng thái ẩn/hiện.
6. Mở `/donate` để xem bảng xếp hạng.

SuperAdmin vẫn là người duy nhất quản lý số tài khoản và ảnh QR tại **Quản lý Donate**. Admin chỉ được quản lý danh sách Top Donate.
