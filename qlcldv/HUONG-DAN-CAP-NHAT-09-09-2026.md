# Cập nhật QLCL-DV ngày 09/09/2026

## Nội dung đã sửa

- Xóa bài viết bằng API máy chủ và xóa dây chuyền: bài viết, lượt tim, bookmark, bình luận, lịch sử sửa bình luận và cảm xúc bình luận.
- Xóa bình luận bằng API máy chủ và xóa luôn lịch sử sửa cùng cảm xúc của bình luận đó.
- Có nút **Dọn dữ liệu đã xóa** tại trang **Quản lý Blog** để xóa các dữ liệu mồ côi đã tồn tại từ trước bản sửa này.
- Firestore Rules chặn tạo lượt tim, bookmark, bình luận hoặc cảm xúc cho bài viết/bình luận không còn tồn tại.
- Thêm ô chọn icon khi chỉnh sửa bình luận; bảng icon tự đóng khi bấm ra ngoài.
- Ô ngày và tên nhân viên đổi màu hover/focus đúng theo từng box ở cả giao diện sáng và tối.
- Hậu kiểm luôn đọc toàn bộ dữ liệu của tối đa 7 file. Khoảng ngày chỉ dùng cho tiêu đề báo cáo tuần, không dùng để loại dòng trong file.
- Bảng đối chiếu trên web hiển thị rõ dòng, ngày, lái xe, tiếp viên và ghi chú M02 đã khớp.
- File Excel ghi nhận nội dung đối chiếu M03/M02; vi phạm M03 chưa tìm thấy trong M02 vẫn được thêm vào báo cáo. Mục IV chỉ hiển thị trên web.

## Cách chép bản cập nhật

1. Giải nén file ZIP.
2. Chép toàn bộ nội dung bên trong thư mục `qlcldv` vào thư mục dự án hiện tại.
3. Khi macOS hỏi có thay thế file hay không, chọn **Replace/Thay thế**.
4. Mở Terminal tại thư mục dự án và chạy:

```bash
npm install
npm run build
```

Nếu hiện dòng `built in ...` và không có lỗi đỏ thì mã nguồn đã sẵn sàng.

## Đưa lên GitHub

Kiểm tra trước:

```bash
git status
```

Thêm các file của bản sửa:

```bash
git add api/manage-blog-data.js firebase.json firestore.rules src/services/blogService.js src/services/blogInteractionService.js src/components/BlogComments.jsx src/pages/BlogAdminPage.jsx src/pages/CameraPage.jsx src/pages/GpsPage.jsx src/pages/Speed4hPage.jsx src/pages/GsttPage.jsx src/pages/HauKiemPage.jsx src/utils/hauKiemProcessor.js src/utils/exportHauKiemReport.js src/index.css HUONG-DAN-CAP-NHAT-09-09-2026.md
```

Tạo commit và đẩy lên GitHub:

```bash
git commit -m "fix: xoa du lieu blog va sua bao cao hau kiem"
git push origin main
```

Vercel sẽ tự tạo deployment mới từ nhánh `main` nếu dự án đã liên kết GitHub.

## Bắt buộc cập nhật Firestore Rules

Mã ứng dụng mới có thay đổi `firestore.rules`, vì vậy cần chạy thêm:

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

Nếu máy chưa có Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

Sau khi Vercel deploy thành công và Rules đã cập nhật:

1. Đăng nhập SuperAdmin/Admin.
2. Vào **Quản lý Blog**.
3. Bấm **Dọn dữ liệu đã xóa** một lần để làm sạch bookmark, bình luận, lịch sử và cảm xúc còn sót từ các bài đã xóa trước đây.
4. Tạo một bài thử, bình luận, sửa bình luận, thả cảm xúc và bookmark.
5. Xóa bình luận hoặc bài thử, sau đó kiểm tra Firestore để xác nhận dữ liệu liên quan đã biến mất.
