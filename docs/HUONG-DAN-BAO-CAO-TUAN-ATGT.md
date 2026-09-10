# Hướng dẫn thêm “Báo cáo tuần ATGT” vào QLCL-DV

Gói này được viết trên nhánh `main` tại commit `906456e` ngày 10/09/2026 và không thêm thư viện npm mới.

## 1. Chức năng đã thêm

- Box hệ thống “Báo cáo tuần ATGT” trên trang chính.
- Đường dẫn: `/bao-cao-atgt`.
- Chọn đồng thời từ 1 đến 7 file `.xlsx` hằng ngày.
- Mỗi file phải có hai sheet bắt đầu bằng `M02` và `M03`.
- Tự phát hiện và bỏ qua file trùng nội dung bằng SHA-256.
- Hiển thị danh sách file đã chọn và cho phép bỏ từng file.
- Hai ô “Từ ngày/Đến ngày” chỉ ghi dòng thời gian trên tiêu đề báo cáo, không lọc dữ liệu trong file.
- Chép toàn bộ dòng M02 vào `BCCT.HKVP`, đúng số dòng thực tế và không tạo khung dư.
- Đọc M03, tổng hợp Tài chính/ATGT/CLDV theo Chi nhánh và Tuyến vào `BCTH.HKVP`.
- Đối chiếu vi phạm M03 với ghi chú M02 trên giao diện.
- Mục IV hiển thị trên web để kiểm tra nhưng không tính vào file Excel.
- Có giao diện sáng/tối, màu hover/focus tím chàm đồng bộ cho vùng chọn file, ngày và tên.
- Có thể lưu báo cáo vào “Báo cáo đã lưu” và tải Excel lại.
- SuperAdmin/Admin có thể ẩn/hiện, đổi mô tả, màu và video hướng dẫn của Box ATGT.

## 2. Kết quả kiểm thử bằng bộ file thật

Với 5 file từ 24/08/2026 đến 30/08/2026:

- 350 lượt giám sát (70 dòng mỗi file).
- 26 Chi nhánh/Tuyến duy nhất.
- 7 vi phạm: Tài chính 0, ATGT 3, CLDV 4.
- 7/7 vi phạm M03 khớp với ghi chú M02.
- Sheet `BCCT.HKVP` kết thúc đúng tại dòng 357: 7 dòng tiêu đề + 350 dòng dữ liệu.

Với riêng file ngày 24/08/2026:

- 70 lượt giám sát.
- Sheet `BCCT.HKVP` kết thúc đúng tại dòng 77, không có khung thừa.

## 3. Cài đặt trực tiếp từ nhánh GitHub

### Bước 1 — Vào dự án và kiểm tra code hiện tại

```bash
cd ~/Workspace/reactjs/qlcldv
git status
```

Nếu thấy `working tree clean`, làm tiếp. Nếu đang có file sửa dở, hãy commit chúng trước:

```bash
git add -A
git commit -m "chore: luu code hien tai truoc khi them ATGT"
```

### Bước 2 — Lấy nhánh ATGT đã chuẩn bị sẵn

```bash
git fetch origin
git switch -c feature/bao-cao-tuan-atgt --track origin/feature/bao-cao-tuan-atgt
```

Nếu máy đã có nhánh này, dùng:

```bash
git switch feature/bao-cao-tuan-atgt
git pull --ff-only origin feature/bao-cao-tuan-atgt
```

### Bước 3 — Thêm mẫu Excel trắng có sẵn trên máy

Vì repository đang công khai, mẫu Excel nội bộ không được tự động đăng lên GitHub. Kiểm tra tên file ATGT trong Downloads:

```bash
find ~/Downloads -maxdepth 1 -type f -iname '*ATGT*.xlsx' -print
```

Sau đó chép đúng file mẫu trắng `CITYBUS - BÁO CÁO ATGT BP.QLCL-DV.xlsx` vào dự án và chuẩn hóa tên:

```bash
mkdir -p public/templates
cp "/duong/dan/file/CITYBUS - BÁO CÁO ATGT BP.QLCL-DV.xlsx" \
  public/templates/CITYBUS-BAO-CAO-ATGT-BP-QLCL-DV.xlsx
```

Thay `/duong/dan/file/...` bằng đúng đường dẫn vừa được lệnh `find` hiển thị.

### Bước 4 — Kiểm tra các file mới

```bash
test -f src/pages/AtgtPage.jsx && echo "OK AtgtPage"
test -f src/utils/atgtProcessor.js && echo "OK atgtProcessor"
test -f src/utils/exportAtgtReport.js && echo "OK exportAtgtReport"
test -f public/templates/CITYBUS-BAO-CAO-ATGT-BP-QLCL-DV.xlsx && echo "OK template ATGT"
```

Phải thấy đủ bốn dòng bắt đầu bằng `OK`.

## 4. Build và chạy localhost

Không cần cài thêm package. Chạy:

```bash
npm install
npm run build
npm run dev
```

Mở địa chỉ Vite in ra trong Terminal, thường là:

```text
http://localhost:5173
```

Đăng nhập, vào trang chính và chọn “Báo cáo tuần ATGT”.

## 5. Cách test đúng

1. Chọn từ 1 đến 7 file báo cáo ATGT hằng ngày.
2. Nhập “Từ ngày” và “Đến ngày” mong muốn hiển thị trên tiêu đề.
3. Nhập tên nhân viên QLCL-DV.
4. Bấm `Search`.
5. Kiểm tra số file, số lượt giám sát, số vi phạm và bảng tổng hợp.
6. Bấm `Tải báo cáo`.
7. Mở Excel và kiểm tra:
   - `BCTH.HKVP`: danh sách tuyến và số vi phạm.
   - `BCCT.HKVP`: toàn bộ dòng M02 theo thứ tự ngày.
   - Không có dòng kẻ/khung dư sau dòng dữ liệu cuối.
   - Tiêu đề là Times New Roman 16 đậm.
   - Dòng thời gian là Times New Roman 13 đậm, nghiêng.

Lưu ý: khoảng ngày người dùng nhập không được dùng để lọc file. Hệ thống luôn tổng hợp toàn bộ nội dung của các file đã chọn.

## 6. Gộp nhánh ATGT vào main

Kiểm tra thay đổi:

```bash
git status
```

Sau khi đã chép mẫu Excel, thêm và commit riêng file mẫu:

```bash
npm run build
git add public/templates/CITYBUS-BAO-CAO-ATGT-BP-QLCL-DV.xlsx
git commit -m "chore: them mau Excel bao cao ATGT"
git push origin feature/bao-cao-tuan-atgt
```

Sau đó mở GitHub, tạo Pull Request từ `feature/bao-cao-tuan-atgt` vào `main`, kiểm tra rồi bấm `Merge pull request`.

Cuối cùng cập nhật máy về main mới:

```bash
git switch main
git pull origin main
```

Nếu dự án Vercel đã liên kết với GitHub và Production Branch là `main`, Vercel sẽ tự build/deploy sau khi Pull Request được merge.

## 7. Firebase/Vercel

Chức năng này không thêm collection Firestore mới và không cần sửa Firestore Rules. Các biến môi trường Firebase/Vercel hiện tại của dự án được giữ nguyên.
