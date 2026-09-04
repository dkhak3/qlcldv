# qlcldv

Ứng dụng ReactJS + Redux Toolkit tổng hợp báo cáo tuần Camera, GPS, TXDL, Tốc độ/4H và Hỗ trợ GSTT.

## Firebase, Blog và quản trị

- Trang `/blog` hiển thị các bài có ảnh bìa, bài nổi bật, tìm kiếm và lọc theo chuyên mục.
- Trang `/blog/:slug` là giao diện đọc bài chi tiết, có thông tin tác giả, ngày đăng, thời gian đọc, lượt xem và bài liên quan.
- Trang `/login` đăng nhập Firebase Authentication bằng tên tài khoản, không yêu cầu người dùng nhớ email.
- Trang `/admin/blog` dành cho Admin/SuperAdmin: thêm, sửa, xóa, lưu nháp và xuất bản. Text lưu ở Firestore, ảnh lưu tại ImgBB, video dùng liên kết Google Drive.
- Trang `/admin/users`: Admin chỉ thấy/quản lý User; SuperAdmin thấy và quản lý Admin + User. Admin đổi được mật khẩu User; SuperAdmin đổi được mật khẩu Admin hoặc User.
- Trang `/admin/report-boxes`: thêm/sửa/ẩn/sắp xếp Box, đổi tên, mô tả, biểu tượng và video hướng dẫn Google Drive.
- Admin/SuperAdmin có thể tự quản lý chuyên mục Blog; bài mới tự thêm số ngẫu nhiên vào slug để tránh trùng đường dẫn.
- Trang Blog và ba trang quản trị Blog/Box/User đều có phân trang.
- Trang chính, Blog, video hướng dẫn và toàn bộ báo cáo bắt buộc đăng nhập. Sau mỗi lần đăng nhập, ứng dụng luôn về trang chính thay vì giữ slug quản trị cũ.
- Menu quản trị chỉ nằm trong menu tên tài khoản và tự đóng khi nhấn ra ngoài hoặc bấm phím Escape.
- `Báo cáo đã lưu` lưu bản tổng hợp trên Firestore: User xem/xóa báo cáo của mình; Admin xem/xóa báo cáo Admin/User nhưng không thấy SuperAdmin; SuperAdmin xem toàn hệ thống và xóa báo cáo Admin/User.
- Trang Donate hiển thị tài khoản ngân hàng/QR; chỉ SuperAdmin được thêm, sửa, ẩn hoặc xóa. SuperAdmin cũng quản lý tên, slug và trạng thái ẩn/hiện của các trang.
- Firestore Security Rules bảo vệ dữ liệu; thao tác tài khoản chạy trong Vercel Functions bằng Firebase Admin SDK.
- Xem `FIREBASE_SETUP.md` để cài Firebase, ImgBB, Google Drive, Vercel và tạo SuperAdmin đầu tiên.

Giao diện sử dụng TailwindCSS, font Be Vietnam Pro đóng gói cục bộ và bộ icon SVG Lucide để hiển thị đồng nhất trên macOS/Windows. Trang chính có Báo cáo Camera, GPS, TXDL, Tốc độ/4H, Hỗ trợ GSTT, lời chào theo ngày, thông tin tuần có thể sao chép và trang 404 cho đường dẫn không tồn tại. Chuỗi tuần sao chép dùng dấu chấm (`31.08 – 06.09`) để có thể dùng làm tên thư mục Windows. Toàn bộ ứng dụng hỗ trợ dark/light mode, tự nhận giao diện hệ thống ở lần đầu và lưu lựa chọn của người dùng trên trình duyệt.

Trang **Báo cáo Tốc độ, 4H** đọc một file `QLCL - GỌI TỐC ĐỘ, 4H`, tự kiểm tra cấu trúc hai sheet `TỐC ĐỘ` và `4H`, lọc dữ liệu theo khoảng ngày và gộp theo cặp Lái xe + BKS. Riêng 4H chỉ lấy dòng có dấu `X` tại cột `VI PHẠM 4 GIỜ`; số lần vi phạm là số lần cặp Lái xe + BKS xuất hiện trong kỳ, không dùng `SỐ LẦN GỌI NHẮC`. Khi cột `TIẾP VIÊN` là `Không có tiếp viên`, tên và số lần không nghe máy được trích từ `GHI CHÚ`, không lấy từ `HỌ TÊN` của người tiếp nhận. Báo cáo được xuất theo template `CITYBUS - BÁO CÁO TỐC ĐỘ 4H BP.QLCL-DV.xlsx`.

Trang **Báo cáo Hỗ trợ GSTT** đọc file `QLCL - HỖ TRỢ GSTT (Buýt trợ giá HCM)`, tự tìm mọi sheet tháng thuộc khoảng ngày người dùng chọn và chấp nhận cả tên dạng `09.2026` lẫn `092026`. Dữ liệu được lọc theo `THỜI GIAN YC HỖ TRỢ`; chi nhánh mặc định là `HCM`. Các trạng thái hoàn tất/đóng được đưa vào `Đã sửa`, trạng thái chờ vào `Chưa sửa`, `KHÔNG THỂ KHÔI PHỤC/KHẮC PHỤC` vào `Không thể khắc phục` và lấy lý do từ `PHẢN HỒI CỦA ĐỐI TÁC BÌNH ANH`. Trạng thái bắt đầu bằng `ĐÃ KIỂM TRA` được đưa vào cột `Đã kiểm tra`. File tải xuống dùng nguyên template `CITYBUS - BÁO CÁO HỖ TRỢ GSTT BP.QLCL-DV.xlsx` và tự thêm số dòng cần thiết.

## Chạy dự án

```bash
npm install
npx vercel dev --listen 3000
```

Mở `http://localhost:3000`. Cách này chạy đồng thời giao diện Vite và các API trong thư mục `api`. Chỉ dùng `npm run dev` khi cần xem riêng giao diện mà không gọi API quản trị.

Nếu đã xóa dữ liệu Firestore, các Box hệ thống và cấu hình trang sẽ tự trở về mặc định. Blog, báo cáo đã lưu và tài khoản Donate đã xóa sẽ không thể tự khôi phục. Nếu muốn tạo lại SuperAdmin từ đầu, hãy xóa cả tài khoản cũ trong **Firebase Authentication > Users**, sau đó mở `/khoi-tao-superadmin` và dùng đúng `SETUP_SECRET` trong `.env.local`. Nếu tài khoản SuperAdmin vẫn còn trong Authentication thì chỉ cần đăng nhập lại bằng tài khoản cũ.

## Logic Camera

- Trang Camera yêu cầu hai file: file Camera chính và file `QLCL - TỔNG HỢP SỬA CHỮA CAMERA & ĐỊNH VỊ TONGDA`.
- `1. BÌNH ANH`: gộp `SỔ THEO DÕI BA` và `SỔ THEO DÕI 16 TUYẾN`.
- `2. BÌNH ANH 35 TUYẾN`: lấy `SỔ THEO DÕI 35 TUYẾN`.
- `3. SOJI`: lấy `SỔ THEO DÕI SOJI`.
- `4. TONGDA`: lấy sheet `Sổ theo dõi CAMERA` từ file TONGDA.
- Parser tự tìm các khối có tiêu đề `NGÀY dd THÁNG mm NĂM yyyy`, sau đó tự xác định cột `SỐ XE`, `CHI NHÁNH`, `TÌNH TRẠNG`.
- Biển số được chuẩn hóa và xóa trùng theo từng chi nhánh.
- Danh sách `CHƯA SỬA` của ngày kết thúc là trạng thái chốt cuối kỳ.
- `ĐÃ SỬA` là các phương tiện xuất hiện trong kỳ nhưng không còn thuộc danh sách `CHƯA SỬA` cuối kỳ.
- `ĐÃ KIỂM TRA CHƯA KHẮC PHỤC` là trạng thái chuyển tiếp: xe đang `CHƯA SỬA` được chuyển sang `ĐÃ KIỂM TRA`; nếu về sau có `ĐÃ SỬA` thì chuyển sang `ĐÃ SỬA`; nếu xuất hiện `CHƯA SỬA` với ngày tại cột B khác ngày lỗi đang được kiểm tra thì chuyển về `CHƯA SỬA`.
- Tổng phương tiện bằng `Đã sửa + Chưa sửa + Đã kiểm tra`.
- File tải xuống sử dụng nguyên sheet mẫu `BCTH P.QLCL` mới. Code tự tìm tiêu đề từng nhóm và dòng `Tổng`, tự nhân thêm số dòng cần thiết, dịch chuyển và khôi phục các vùng merge nên không phụ thuộc số hàng cố định.
- Khi đổi file hoặc khoảng ngày, kết quả lần tìm kiếm trước được xóa ngay; chỉ kết quả mới được hiển thị.
- Khi chưa có kết quả, giao diện luôn hiển thị `No data`.
- File upload được kiểm tra định dạng, các sheet bắt buộc, tiêu đề ngày và các cột `SỐ XE`, `CHI NHÁNH`, `TÌNH TRẠNG` trước khi xử lý.
- Trang `/bao-cao-camera/chi-tiet` hiển thị biển số của 4 nhóm BÌNH ANH, BÌNH ANH 35 TUYẾN, SOJI và TONGDA theo chi nhánh và ba trạng thái; file Excel chi tiết đặt mỗi biển số trên một dòng riêng.
- Nút `Lưu báo cáo` hiển thị hộp xác nhận và lưu bản tổng hợp vào Firestore.

Với file kiểm thử đã cung cấp, khoảng 24/08/2026–30/08/2026, nhóm `BÌNH ANH 35 TUYẾN / HCM` cho kết quả `Đã sửa: 33`, `Chưa sửa: 67`, tổng `100`.

## Logic GPS

- Trang GPS yêu cầu file `QLCL - TỔNG HỢP BÁO CÁO SỬA CHỮA ĐỊNH VỊ` và file `QLCL - TỔNG HỢP SỬA CHỮA CAMERA & ĐỊNH VỊ TONGDA`.
- `1. BÌNH ANH`: gộp `SỔ THEO DÕI BA` và `SỔ THEO DÕI 16 TUYẾN HCM`.
- `2. BÌNH ANH 35 TUYẾN`: lấy `SỔ THEO DÕI 35 TUYẾN`.
- `3. VIETMAP`: lấy `SỔ THEO DÕI VIETMAP`.
- `4. TONGDA`: lấy `Sổ theo dõi GPS` từ file TONGDA.
- Parser tự tìm từng khối ngày, kiểm tra đúng cột C `CHI NHÁNH`, cột E `SỐ XE`, cột G `ĐÃ XỬ LÝ` và cột H `CHƯA XỬ LÝ`; chỉ ghi nhận dòng có giá trị `1`.
- Hai danh sách được xóa trùng theo biển số và chi nhánh. Xe đã có trong `ĐÃ XỬ LÝ` được xóa khỏi `CHƯA XỬ LÝ`; danh sách `CHƯA XỬ LÝ` của ngày kết thúc có quyền ưu tiên, được thêm lại và đồng thời xóa khỏi `ĐÃ XỬ LÝ`.
- Tổng phương tiện bằng `Đã xử lý + Chưa xử lý`.
- File tổng hợp dùng nguyên template `CITYBUS - BÁO CÁO ĐỊNH VỊ BP.QLCL-DV`; các vùng merge, định dạng và bốn khu vực báo cáo được giữ nguyên.
- Trang `/bao-cao-gps/chi-tiet` có đủ bốn nhóm và cho phép sao chép hoặc tải Excel; mỗi biển số nằm trên một dòng riêng.
- Khi thay file, đổi ngày hoặc tìm kiếm lại, dữ liệu cũ được xóa; file sai sheet/cột sẽ báo `cấu trúc không hợp lệ`; chưa có kết quả sẽ hiển thị `No data`.

## Báo cáo tuần TXDL

- Thẻ TXDL trên trang chính dẫn đến trang `/bao-cao-txdl` thay vì mở liên kết ngay lập tức.
- Trang TXDL có khu vực video hướng dẫn và thẻ truy cập được thiết kế riêng, không hiển thị form nhập dữ liệu.
- Nút `Truy cập Báo cáo TXDL` mở `https://txdl-project.vercel.app/` trong tab mới.
