# Sửa lỗi ngày trong sheet BCCT.HKVP

## Lỗi đã sửa

Các file Hậu kiểm được sao chép từ mẫu cũ nên cột `NGÀY` trong sheet `M02` có thể vẫn giữ ngày 05/09/2026, dù tiêu đề sheet `M03` và tên file là các ngày khác.

Bản sửa xác định ngày báo cáo theo thứ tự:

1. Ngày trong phần đầu sheet `M03`.
2. Ngày trong tên file Hậu kiểm.
3. Ngày trong phần đầu sheet `M02` nếu hai nơi trên không có.

Ngày đã xác định sẽ được áp dụng cho toàn bộ dữ liệu của file ngày đó. Dữ liệu `BCCT.HKVP` cũng được sắp theo ngày tăng dần.

## Cách cập nhật dự án

1. Giải nén file ZIP này.
2. Sao chép file `src/utils/hauKiemProcessor.js`.
3. Dán đè vào đúng đường dẫn trong dự án của bạn:

   `qlcldv/src/utils/hauKiemProcessor.js`

4. Mở Terminal tại thư mục `qlcldv` và chạy:

   ```bash
   npm run build
   ```

5. Nếu build thành công, chạy thử:

   ```bash
   npx vercel dev --listen 3000
   ```

6. Mở `http://localhost:3000/bao-cao-hau-kiem`, nhập lại đủ 7 file từ 31/08/2026 đến 06/09/2026, bấm `Search`, rồi bấm `Tải Excel`.

## Kết quả cần thấy

Trong `BCCT.HKVP`, cột `NGÀY` phải có đủ:

- 31/08/2026
- 01/09/2026
- 02/09/2026
- 03/09/2026
- 04/09/2026
- 05/09/2026
- 06/09/2026

Ngày bắt đầu và kết thúc người dùng nhập chỉ là kỳ báo cáo tuần; không ép ngày trong file nguồn phải trùng hoàn toàn với hai ô này.

## Đưa bản sửa lên GitHub

Sau khi kiểm tra thành công, tại thư mục dự án chạy lần lượt:

```bash
git status
git add src/utils/hauKiemProcessor.js
git commit -m "fix: doc dung ngay tung file hau kiem"
git push origin main
```

Nếu Vercel đã liên kết với nhánh `main`, Vercel sẽ tự tạo deployment mới sau khi `git push` thành công.

