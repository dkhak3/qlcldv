# Cài Firebase + ImgBB + Google Drive cho qlcldv

Kiến trúc này không cần chạy database trên máy cá nhân:

- Firebase Authentication: đăng nhập bằng tên tài khoản.
- Cloud Firestore: lưu hồ sơ User, Blog, chuyên mục, cấu hình Box, Donate, trang/slug và các báo cáo đã lưu.
- ImgBB: lưu ảnh bìa Blog.
- Google Drive: lưu video Blog và video hướng dẫn.
- Vercel Functions: giữ khóa quản trị Firebase và xử lý tạo User/đổi mật khẩu an toàn.

> Có thể bắt đầu bằng các gói miễn phí. Không bật Firebase Blaze nếu bạn muốn bảo đảm không phát sinh hóa đơn. Hệ thống sẽ dừng khi vượt hạn mức miễn phí thay vì tự thu tiền.

## 1. Tạo Firebase project

1. Mở <https://console.firebase.google.com/> và chọn **Create a project**.
2. Đặt tên, ví dụ `qlcldv`.
3. Google Analytics không bắt buộc; có thể tắt.
4. Trong **Project overview**, nhấn biểu tượng Web `</>`.
5. Đặt App nickname `qlcldv-web`, không cần bật Firebase Hosting.
6. Sao chép object `firebaseConfig` để dùng ở bước 5.

## 2. Bật đăng nhập và Firestore

### Authentication

1. Vào **Build > Authentication > Get started**.
2. Mở **Sign-in method**.
3. Bật **Email/Password**; không bật Email link.
4. Vào **Settings > Authorized domains** và thêm domain Vercel của dự án, ví dụ `qlcldv.vercel.app`.

Ứng dụng cho phép đăng nhập bằng tên tài khoản. Bên trong Firebase, tên `duykha` được chuyển thành email nội bộ `duykha@qlcldv.local`; người dùng không cần biết email này.

### Firestore

1. Vào **Build > Firestore Database > Create database**.
2. Chọn **Standard edition**, **Production mode**.
3. Chọn khu vực gần Việt Nam, ví dụ Singapore nếu Firebase cung cấp.
4. Mở tab **Rules**.
5. Sao chép toàn bộ nội dung file `firestore.rules` của project, dán vào và nhấn **Publish**.

Không chọn Test mode và không dùng rule `allow read, write: if true`.

## 3. Tạo khóa máy chủ Firebase

1. Vào biểu tượng bánh răng > **Project settings > Service accounts**.
2. Chọn **Firebase Admin SDK > Generate new private key**.
3. Tải file JSON về máy và không đưa file này lên GitHub.
4. Từ JSON, lấy ba giá trị:

```text
project_id   -> FIREBASE_PROJECT_ID
client_email -> FIREBASE_CLIENT_EMAIL
private_key  -> FIREBASE_PRIVATE_KEY
```

Không thêm tiền tố `VITE_` cho ba khóa máy chủ này. Mọi biến bắt đầu bằng `VITE_` đều có thể xuất hiện trong mã trình duyệt.

## 4. Tạo ImgBB API key

1. Đăng nhập <https://imgbb.com/>.
2. Mở <https://api.imgbb.com/>.
3. Chọn **Get API key** và sao chép key.
4. Lưu key vào biến `IMGBB_API_KEY` trên Vercel.

Ứng dụng giới hạn ảnh Blog ở mức 3 MB để đi qua Vercel Function ổn định. Ảnh cũ trên ImgBB không tự bị xóa khi đổi/xóa bài; nếu cần dọn dung lượng, xóa thủ công trong tài khoản ImgBB.

## 5. Khai báo biến môi trường

### Chạy giao diện trên máy

Sao chép `.env.example` thành `.env.local`, chỉ cần điền sáu biến Firebase Web:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Chạy:

```bash
npm install
npm run dev
```

Các API quản trị chỉ chạy đầy đủ khi dùng `vercel dev` hoặc sau khi deploy Vercel.

### Cấu hình Vercel

Trong **Vercel > Project > Settings > Environment Variables**, thêm:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
IMGBB_API_KEY=...
SETUP_SECRET=mot-chuoi-bi-mat-dai-it-nhat-24-ky-tu
```

Chọn cả **Production**, **Preview** và **Development**, sau đó Redeploy.

`FIREBASE_PRIVATE_KEY` có thể dán nguyên nội dung kèm xuống dòng hoặc dùng `\n`; code hỗ trợ cả hai.

## 6. Tạo SuperAdmin đầu tiên

Sau khi deploy thành công, mở:

```text
https://TEN-DOMAIN-VERCEL/khoi-tao-superadmin
```

Nhập họ tên, tên đăng nhập, mật khẩu và đúng `SETUP_SECRET` đã cấu hình trên Vercel. Hệ thống chỉ cho tạo một SuperAdmin đầu tiên; sau đó endpoint tự khóa.

Đăng nhập tại `/login`. Tất cả trang nghiệp vụ, Blog, video hướng dẫn và trang chính đều yêu cầu đăng nhập. SuperAdmin có thể:

- Quản lý Blog.
- Quản lý Box báo cáo và video hướng dẫn.
- Quản lý chuyên mục Blog, tài khoản Donate, trạng thái ẩn/hiện và slug của trang.
- Xem báo cáo đã lưu của toàn hệ thống và xóa báo cáo Admin/User.
- Tạo, sửa, đổi mật khẩu hoặc xóa Admin/User.

Admin có thể quản lý Blog, chuyên mục, Box và User; Admin không nhìn thấy tài khoản SuperAdmin, đồng thời chỉ đổi được mật khẩu User. Admin nhìn thấy báo cáo do Admin/User lưu nhưng không được đọc hoặc xóa báo cáo SuperAdmin.

## 7. Thêm video Google Drive

1. Tải video lên Google Drive.
2. Chọn **Share**.
3. Ở **General access**, chọn **Anyone with the link** và quyền **Viewer**.
4. Copy link dạng `https://drive.google.com/file/d/.../view`.
5. Vào **Quản lý Box báo cáo**, chỉnh sửa Box và dán vào ô Video hướng dẫn.

Ứng dụng tự chuyển link Drive thành link xem trước để nhúng vào trang báo cáo. Không cần Google Drive API hoặc OAuth.

## 8. Kiểm tra sau khi cài

1. Đăng nhập SuperAdmin.
2. Tạo một User và một Admin thử nghiệm.
3. Đăng nhập Admin: chỉ thấy User, không thấy Admin/SuperAdmin.
4. Admin đổi mật khẩu User; đăng nhập lại User bằng mật khẩu mới.
5. Đăng nhập SuperAdmin và đổi mật khẩu Admin.
6. Thêm bài Blog có ảnh; kiểm tra ảnh hiển thị.
7. Dán video Drive vào một Box; kiểm tra video tại đúng trang báo cáo.
8. Ẩn Box; kiểm tra Box biến mất khỏi trang chính.
9. Xử lý thử một báo cáo, nhấn **Lưu báo cáo**, xác nhận và mở **Báo cáo đã lưu** trong menu tài khoản.
10. Vào **Quản lý Donate** để thêm tài khoản ngân hàng; vào **Quản lý trang & slug** để thử đổi đường dẫn.

> Mỗi khi project được cập nhật file `firestore.rules`, bạn cần mở **Firestore Database > Rules**, dán lại toàn bộ file và nhấn **Publish**. Nếu chưa Publish, ứng dụng sẽ báo `Missing or insufficient permissions` cho các chức năng mới.

## 9. Lưu ý về chi phí

- Firebase Spark là gói không cần phương thức thanh toán và có hạn mức miễn phí.
- ImgBB và Google Drive phụ thuộc hạn mức tài khoản miễn phí tương ứng.
- Vercel Hobby có hạn mức miễn phí; nếu vượt hạn mức, chức năng có thể tạm dừng.
- Không cam kết mọi dịch vụ bên thứ ba sẽ giữ chính sách miễn phí vĩnh viễn. Hãy kiểm tra trang Usage định kỳ và không nâng cấp lên gói trả phí nếu chưa được phép.
