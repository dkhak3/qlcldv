# QLCL-DV — Hệ thống báo cáo tuần

QLCL-DV là ứng dụng nội bộ dùng để xử lý, tổng hợp, lưu trữ và xuất các báo cáo nghiệp vụ. Hệ thống được xây dựng bằng React + Vite, sử dụng Firebase Authentication/Firestore cho tài khoản và dữ liệu, Vercel Serverless Functions cho các thao tác quản trị, ImgBB để lưu ảnh blog và Vercel để triển khai website.

Website chỉ cho phép người đã đăng nhập truy cập nội dung nghiệp vụ. Hệ thống có ba vai trò: `User`, `Admin` và `SuperAdmin`.

> Tài liệu này được viết theo hướng A–Z. Một người mới nhận mã nguồn có thể làm lần lượt từ trên xuống để chạy dự án trên máy và triển khai thành công lên Vercel.

## Mục lục

1. [Công nghệ sử dụng](#1-công-nghệ-sử-dụng)
2. [Các chức năng của dự án](#2-các-chức-năng-của-dự-án)
3. [Phân quyền](#3-phân-quyền)
4. [Cấu trúc dự án](#4-cấu-trúc-dự-án)
5. [Chuẩn bị](#5-chuẩn-bị)
6. [Cài dự án về máy](#6-cài-dự-án-về-máy)
7. [Thiết lập Firebase từ đầu](#7-thiết-lập-firebase-từ-đầu)
8. [Thiết lập ImgBB](#8-thiết-lập-imgbb)
9. [Khai báo biến môi trường](#9-khai-báo-biến-môi-trường)
10. [Chạy thử trên localhost](#10-chạy-thử-trên-localhost)
11. [Tạo SuperAdmin đầu tiên](#11-tạo-superadmin-đầu-tiên)
12. [Đưa dự án lên GitHub lần đầu](#12-đưa-dự-án-lên-github-lần-đầu)
13. [Cách viết commit hằng ngày](#13-cách-viết-commit-hằng-ngày)
14. [Triển khai dự án lên Vercel](#14-triển-khai-dự-án-lên-vercel)
15. [Cập nhật website](#15-cập-nhật-website)
16. [Danh sách kiểm tra](#16-danh-sách-kiểm-tra)
17. [Xử lý lỗi thường gặp](#17-xử-lý-lỗi-thường-gặp)
18. [Bảo mật và sao lưu](#18-bảo-mật-và-sao-lưu)

## 1. Công nghệ sử dụng

- React 18, React Router và Redux Toolkit.
- Vite để phát triển và build frontend.
- Firebase Authentication để đăng nhập.
- Cloud Firestore để lưu dữ liệu.
- Firebase Admin SDK trong các API phía máy chủ.
- Vercel Serverless Functions trong thư mục `api/`.
- ExcelJS và FileSaver để tạo/tải tệp Excel.
- ImgBB để lưu ảnh được tải từ trang quản trị blog.
- Tailwind CSS và CSS riêng cho giao diện.

## 2. Các chức năng của dự án

### 2.1. Đăng nhập và tài khoản

- Bắt buộc đăng nhập trước khi truy cập trang chính và nội dung nghiệp vụ.
- Tạo SuperAdmin đầu tiên bằng `SETUP_SECRET` và API phía máy chủ.
- Đổi mật khẩu cá nhân.
- SuperAdmin/Admin quản lý người dùng theo phạm vi quyền.
- Mỗi lần đăng nhập, người dùng được đưa về trang chính, không giữ URL quản trị của phiên trước.

### 2.2. Các Box báo cáo

Hệ thống có năm Box nghiệp vụ chính:

1. Báo cáo Camera.
2. Báo cáo GPS.
3. Báo cáo TXDL.
4. Báo cáo Tốc độ - 4H.
5. Báo cáo Hỗ trợ GSTT.

Năm Box chính không thể xóa. SuperAdmin/Admin có thể tạo Box tùy chỉnh, sửa tên, mô tả, màu sắc, biểu tượng, đường dẫn, trạng thái hiển thị và xóa Box không phải Box lõi.

Các trang báo cáo hỗ trợ đọc Excel, xử lý dữ liệu theo nghiệp vụ, xem kết quả và tải báo cáo Excel.

### 2.3. Báo cáo đã lưu

- Hỏi xác nhận trước khi lưu.
- Lưu dữ liệu vào collection `saved_reports`.
- Hiển thị ngày giờ theo `dd/MM/yyyy HH:mm:ss`.
- Lọc theo người lưu và phân trang.
- Xem chi tiết và tải Excel theo dạng báo cáo gốc.
- User chỉ xem/xóa báo cáo của mình.
- Admin xem báo cáo Admin/User, không xóa báo cáo SuperAdmin.
- SuperAdmin xem/xóa báo cáo của tất cả người dùng.

### 2.4. Blog

- Chỉ người đã đăng nhập mới xem được Blog nghiệp vụ.
- Danh sách bài viết có phân trang và trang chi tiết dùng slug.
- Slug được gắn thêm chuỗi/số ngẫu nhiên để hạn chế trùng.
- SuperAdmin/Admin thêm, sửa, xóa, ẩn/hiện và xuất bản bài viết.
- Hỗ trợ ảnh bìa, ảnh trong nội dung và liên kết video Google Drive.
- Ảnh được đưa lên ImgBB qua API phía máy chủ.
- Chuyên mục được lưu trong `blog_categories`; SuperAdmin/Admin được thêm, sửa, xóa.

Danh sách chuyên mục mặc định nằm tại `src/services/blogCategoryService.js`. Nếu không muốn tạo chuyên mục mẫu, dùng danh sách rỗng:

```js
export const DEFAULT_BLOG_CATEGORIES = [];
```

Không dùng `['']`, vì đó là một phần tử rỗng. Việc sửa mã nguồn không tự xóa chuyên mục đã tồn tại trong Firestore.

### 2.5. Donate và Top Donate

- Donate xuất hiện trên Header sau khi đăng nhập.
- Hiển thị nhiều hình thức/tài khoản ngân hàng và ảnh QR.
- SuperAdmin quản lý tài khoản Donate: thêm, sửa, xóa, ẩn, hiện.
- Trang Donate có khu vực Top Donate, sắp xếp theo số tiền.
- SuperAdmin/Admin quản lý Top Donate: thêm, sửa, xóa, ẩn, hiện.

### 2.6. Quản lý đường dẫn và giao diện

- SuperAdmin đổi tên hiển thị, slug và trạng thái ẩn/hiện của từng trang.
- Các đường dẫn quản trị nằm trong menu tài khoản, không đặt trực tiếp ngoài Header.
- Menu tài khoản đóng khi bấm ra ngoài.
- Có chế độ sáng/tối, responsive, thông báo và trang 404.
- Có phân trang ở Blog, quản lý Blog, Box, User và báo cáo đã lưu.

## 3. Phân quyền

| Chức năng                    | User  | Admin | SuperAdmin |
| ---------------------------- | :---: | :---: | :--------: |
| Dùng các báo cáo             |  Có   |  Có   |     Có     |
| Xem Blog và Donate           |  Có   |  Có   |     Có     |
| Lưu/xem/xóa báo cáo của mình |  Có   |  Có   |     Có     |
| Xem báo cáo của User         | Không |  Có   |     Có     |
| Xem báo cáo mọi tài khoản    | Không | Không |     Có     |
| Quản lý Blog/chuyên mục      | Không |  Có   |     Có     |
| Quản lý Box báo cáo          | Không |  Có   |     Có     |
| Quản lý Top Donate           | Không |  Có   |     Có     |
| Quản lý tài khoản Donate     | Không | Không |     Có     |
| Tạo/phân quyền User và Admin | Không |  Có   |     Có     |
| Phân quyền SuperAdmin        | Không | Không |     Có     |
| Quản lý tên trang và slug    | Không | Không |     Có     |

- Admin chỉ gán vai trò `User` hoặc `Admin`.
- SuperAdmin gán được `User`, `Admin` hoặc `SuperAdmin`.
- Các API quản trị xác minh Firebase ID token ở phía máy chủ; không chỉ dựa vào việc ẩn nút trên giao diện.

## 4. Cấu trúc dự án

```text
qlcldv/
├── api/                     # Vercel Serverless Functions
├── public/
│   └── templates/           # File Excel mẫu
├── src/
│   ├── components/          # Thành phần giao diện dùng chung
│   ├── data/                # Dữ liệu mặc định
│   ├── lib/                 # Firebase client, gọi API
│   ├── pages/               # Các trang
│   ├── services/            # Firestore và nghiệp vụ
│   ├── store/               # Redux
│   ├── utils/               # Xử lý báo cáo, slug, ngày tháng
│   └── main.jsx             # Điểm khởi động React
├── .env.example             # Mẫu biến môi trường
├── .env.local               # Biến local, không đưa lên GitHub
├── firestore.rules          # Firestore Security Rules
├── index.html               # Entry HTML của Vite
├── package.json             # Dependency và lệnh npm
├── vercel.json              # Rewrite SPA cho Vercel
└── vite.config.js           # Cấu hình Vite
```

Các collection Firestore chính:

| Collection          | Mục đích                             |
| ------------------- | ------------------------------------ |
| `users`             | Hồ sơ, tên đăng nhập, vai trò        |
| `report_boxes`      | Cấu hình Box báo cáo                 |
| `saved_reports`     | Báo cáo đã lưu                       |
| `blog_posts`        | Bài viết Blog                        |
| `blog_categories`   | Chuyên mục Blog                      |
| `donation_accounts` | Tài khoản/QR Donate                  |
| `top_donates`       | Danh sách Top Donate                 |
| `site_pages`        | Tên trang, slug, trạng thái hiển thị |

## 5. Chuẩn bị

Cài Node.js 22 LTS, Git và Visual Studio Code. Chuẩn bị tài khoản GitHub, Firebase, Vercel và ImgBB.

Kiểm tra:

```bash
node -v
npm -v
git --version
```

## 6. Cài dự án về máy

### Khi dự án đã có trên GitHub

```bash
cd ~/Workspace/reactjs
git clone https://github.com/TEN_GITHUB/qlcldv.git
cd qlcldv
npm install
```

### Khi đã có sẵn thư mục dự án

```bash
cd /Users/duykha/Workspace/reactjs/qlcldv
npm install
```

Không chép một gói code nhỏ rồi chọn **Replace** toàn bộ thư mục `src`, vì Finder có thể xóa file không có trong gói mới. Hãy ghi đè đúng từng file hoặc dùng Git.

Kiểm tra file bắt buộc:

```bash
ls index.html package.json src/main.jsx
```

Nếu `src/main.jsx` không tồn tại thì Vite không thể build.

## 7. Thiết lập Firebase từ đầu

### Bước 1 — Tạo project và Web App

1. Mở [Firebase Console](https://console.firebase.google.com/).
2. Chọn **Create a project**, đặt tên ví dụ `qlcldv`.
3. Vào **Project settings** → **Your apps** → biểu tượng Web `</>`.
4. Đặt tên `QLCL-DV Web` → **Register app**.
5. Sao chép object `firebaseConfig`.

Ánh xạ:

| Firebase Web config | Biến dự án                          |
| ------------------- | ----------------------------------- |
| `apiKey`            | `VITE_FIREBASE_API_KEY`             |
| `authDomain`        | `VITE_FIREBASE_AUTH_DOMAIN`         |
| `projectId`         | `VITE_FIREBASE_PROJECT_ID`          |
| `storageBucket`     | `VITE_FIREBASE_STORAGE_BUCKET`      |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId`             | `VITE_FIREBASE_APP_ID`              |

### Bước 2 — Bật Email/Password

Firebase Console → **Authentication** → **Get started** → **Sign-in method** → **Email/Password** → bật lựa chọn đầu tiên → **Save**.

### Bước 3 — Tạo Firestore

Firebase Console → **Firestore Database** → **Create database** → **Production mode** → chọn region gần người dùng.

Không cần tạo thủ công collection; ứng dụng tạo document khi có dữ liệu đầu tiên.

### Bước 4 — Publish Security Rules

1. Mở `firestore.rules` trong dự án và sao chép toàn bộ.
2. Firebase Console → **Firestore Database** → **Rules**.
3. Dán đè nội dung cũ → **Publish**.

Mỗi lần sửa rules phải Publish lại. Nếu muốn dùng Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

Khi CLI hỏi file rules, chọn `firestore.rules` và không ghi đè file hiện có.

### Bước 5 — Tạo Service Account

Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**.

Lấy đúng ba trường từ JSON:

| Trường JSON    | Biến server             |
| -------------- | ----------------------- |
| `project_id`   | `FIREBASE_PROJECT_ID`   |
| `client_email` | `FIREBASE_CLIENT_EMAIL` |
| `private_key`  | `FIREBASE_PRIVATE_KEY`  |

Không đưa file JSON hay private key lên GitHub. Nếu khóa từng bị lộ, xóa/revoke khóa cũ và tạo khóa mới.

### Bước 6 — Authorized domains

Firebase Console → **Authentication** → **Settings** → **Authorized domains**:

- Giữ/thêm `localhost`.
- Sau khi deploy, thêm domain như `qlcldv.vercel.app`.
- Nếu có custom domain, thêm cả domain đó.

Chỉ nhập tên miền, không nhập `https://` hay `/login`.

## 8. Thiết lập ImgBB

1. Mở [ImgBB API](https://api.imgbb.com/).
2. Đăng nhập và tạo API key.
3. Đưa key vào `IMGBB_API_KEY`.
4. Không thêm tiền tố `VITE_`, vì upload chạy ở phía máy chủ.

Nếu chưa có ImgBB key, phần tải ảnh Blog sẽ lỗi nhưng các chức năng khác vẫn có thể chạy.

## 9. Khai báo biến môi trường

### Tạo `.env.local`

```bash
cp .env.example .env.local
```

Điền đủ:

```env
# Firebase Web — frontend
VITE_FIREBASE_API_KEY=gia_tri_apiKey
VITE_FIREBASE_AUTH_DOMAIN=ten-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ten-project
VITE_FIREBASE_STORAGE_BUCKET=ten-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxxxxxxxxx

# Firebase Admin — chỉ server
FIREBASE_PROJECT_ID=ten-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ten-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nNOI_DUNG_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Chỉ server
IMGBB_API_KEY=api_key_imgbb
SETUP_SECRET=mot_chuoi_ngau_nhien_rat_dai_va_kho_doan
```

Quy tắc:

- Tên biến phải chính xác và phân biệt hoa/thường.
- Không có khoảng trắng quanh `=`.
- Trong `.env.local`, giữ `\n` trong private key như mẫu.
- Không thêm `VITE_` cho Firebase Admin, ImgBB hoặc `SETUP_SECRET`.
- Biến bắt đầu bằng `VITE_` được đưa vào frontend, không phải secret.
- Sửa `.env.local` xong phải dừng rồi chạy lại server.

Tạo `SETUP_SECRET` ngẫu nhiên:

```bash
openssl rand -base64 36
```

Nếu project local đã liên kết Vercel, có thể tải biến Development:

```bash
npx vercel link
npx vercel env pull .env.local
```

`env pull` sẽ thay file đích; sao lưu `.env.local` nếu có giá trị chưa nằm trên Vercel.

## 10. Chạy thử trên localhost

### Chỉ chạy frontend

```bash
npm run dev
```

Mở `http://localhost:5173`.

Cách này phù hợp xem giao diện. Những chức năng gọi `/api/*` như tạo User, quản trị mật khẩu, upload ImgBB và tạo SuperAdmin có thể không chạy vì Vite không tự chạy Vercel Functions.

### Chạy đầy đủ frontend và API

```bash
npx vercel dev --listen 3000
```

Mở `http://localhost:3000`.

Lần đầu Vercel CLI hỏi:

- **Set up and develop?** → `Y`.
- **Which scope?** → chọn tài khoản/team.
- **Link to existing project?** → `Y` nếu project đã có.
- **Which project?** → chọn `qlcldv`.
- Nếu chưa có → **Create a new project** và đặt tên `qlcldv`.
- **Customize settings?** → `N` nếu Vite đã được nhận đúng.

Thư mục `.vercel/` chỉ chứa thông tin liên kết local, không commit.

### Kiểm tra bản production

```bash
npm run build
npm run preview
```

Build thành công sẽ tạo `dist/`. Cảnh báo chunk lớn không đồng nghĩa build thất bại. `npm run preview` chỉ phục vụ frontend; dùng `vercel dev` để thử API.

## 11. Tạo SuperAdmin đầu tiên

Chỉ thực hiện sau khi Authentication, Firestore, rules và toàn bộ biến môi trường đã đúng.

Chạy đầy đủ:

```bash
npx vercel dev --listen 3000
```

Mở:

```text
http://localhost:3000/khoi-tao-superadmin
```

Trên production: `https://TEN-DOMAIN.vercel.app/khoi-tao-superadmin`.

Điền họ tên, tên đăng nhập, mật khẩu tối thiểu 10 ký tự và đúng giá trị `SETUP_SECRET`. API chỉ tạo khi chưa có tài khoản mang vai trò `superadmin`.

Sau khi tạo:

1. Đăng nhập tài khoản vừa tạo.
2. Kiểm tra các trang quản trị.
3. Có thể rotate `SETUP_SECRET` trên Vercel.

Nếu đã xóa Firestore nhưng chưa xóa Firebase Authentication, phải kiểm tra cả hai nơi trước khi tạo lại.

## 12. Đưa dự án lên GitHub lần đầu

### Bước 1 — Tạo repository trống

1. GitHub → dấu `+` → **New repository**.
2. Đặt tên `qlcldv`.
3. Chọn **Private** nếu là hệ thống nội bộ.
4. Không tạo sẵn README, `.gitignore` hoặc License.
5. Chọn **Create repository**.

URL sẽ có dạng `https://github.com/TEN_GITHUB/qlcldv.git`.

### Bước 2 — Kiểm tra `.gitignore`

Đảm bảo `.gitignore` có:

```gitignore
node_modules/
dist/
.env
.env.local
.env.*.local
.vercel/
*.log
.DS_Store
*serviceAccount*.json
firebase-adminsdk-*.json
```

### Bước 3 — Khởi tạo Git

```bash
cd /Users/duykha/Workspace/reactjs/qlcldv
git status
```

Nếu báo `fatal: not a git repository`:

```bash
git init
git branch -M main
```

Nếu Git hỏi danh tính:

```bash
git config --global user.name "Nguyen Huu Duy Kha"
git config --global user.email "EMAIL_GITHUB_CUA_BAN"
```

### Bước 4 — Kiểm tra bí mật

```bash
git status
git ls-files | grep -E '(^|/)\.env|firebase-adminsdk|serviceAccount|(^|/)\.vercel/'
```

Lệnh thứ hai không nên in gì. Không commit `.env.local`, Service Account JSON, `node_modules/`, `dist/` hoặc `.vercel/`.

### Bước 5 — Commit đầu tiên

```bash
git add .
git status
git commit -m "feat: initialize complete QLCL-DV system"
```

`git add .` chuẩn bị file; `git status` cho bạn kiểm tra; `git commit` tạo mốc phiên bản trên máy.

### Bước 6 — Kết nối và push GitHub

```bash
git remote -v
```

Nếu chưa có `origin`:

```bash
git remote add origin https://github.com/TEN_GITHUB/qlcldv.git
```

Nếu `origin` sai:

```bash
git remote set-url origin https://github.com/TEN_GITHUB/qlcldv.git
```

Push:

```bash
git branch -M main
git push -u origin main
```

GitHub có thể yêu cầu đăng nhập trình duyệt hoặc Personal Access Token. Sau khi thành công, tải lại repository và chắc chắn không có `.env.local` hoặc private key.

## 13. Cách viết commit hằng ngày

- **Commit** là mốc lưu thay đổi trong Git trên máy.
- **Push** đưa commit lên GitHub.
- Commit rồi nhưng chưa push thì GitHub chưa có bản mới.

Quy trình an toàn:

```bash
cd /Users/duykha/Workspace/reactjs/qlcldv
git status
git diff
npm run build
git add TEN_FILE_DA_SUA
git diff --staged
git commit -m "loai: mô tả ngắn thay đổi"
git push
```

Ví dụ chỉ sửa README:

```bash
git add README.md
git commit -m "docs: rewrite installation and deployment guide"
git push
```

Quy ước:

| Loại       | Khi dùng         | Ví dụ                                           |
| ---------- | ---------------- | ----------------------------------------------- |
| `feat`     | Thêm chức năng   | `feat: add Top Donate management`               |
| `fix`      | Sửa lỗi          | `fix: include unanswered staff in speed report` |
| `docs`     | Sửa tài liệu     | `docs: update Firebase setup guide`             |
| `refactor` | Sắp xếp code     | `refactor: simplify report mapping`             |
| `style`    | Sửa giao diện    | `style: improve Donate mobile layout`           |
| `chore`    | Cấu hình/phụ trợ | `chore: update dependencies`                    |

Một commit nên chứa một nhóm thay đổi liên quan. Tránh nội dung mơ hồ như `update`, `fix`, `abc`, `final final`.

Nếu không chắc đã có commit chưa:

```bash
git log --oneline -5
```

## 14. Triển khai dự án lên Vercel

### Bước 1 — Import GitHub

1. Đăng nhập [Vercel](https://vercel.com/).
2. **Add New...** → **Project**.
3. Kết nối GitHub và Import repository `qlcldv`.
4. Kiểm tra:

| Mục              | Giá trị         |
| ---------------- | --------------- |
| Framework Preset | `Vite`          |
| Root Directory   | `./`            |
| Install Command  | `npm install`   |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |
| Node.js Version  | `22.x`          |

### Bước 2 — Environment Variables

Vercel project → **Settings** → **Environment Variables**. Thêm đủ:

| Biến                                | Nguồn                          | Kiểu nên dùng |
| ----------------------------------- | ------------------------------ | ------------- |
| `VITE_FIREBASE_API_KEY`             | Web config `apiKey`            | Config        |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Web config `authDomain`        | Config        |
| `VITE_FIREBASE_PROJECT_ID`          | Web config `projectId`         | Config        |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Web config `storageBucket`     | Config        |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Web config `messagingSenderId` | Config        |
| `VITE_FIREBASE_APP_ID`              | Web config `appId`             | Config        |
| `FIREBASE_PROJECT_ID`               | Service Account `project_id`   | Secret        |
| `FIREBASE_CLIENT_EMAIL`             | Service Account `client_email` | Secret        |
| `FIREBASE_PRIVATE_KEY`              | Service Account `private_key`  | Secret        |
| `IMGBB_API_KEY`                     | ImgBB                          | Secret        |
| `SETUP_SECRET`                      | Chuỗi tự tạo >= 24 ký tự       | Secret        |

Chọn cả `Production`, `Preview`, `Development` nếu dùng chung Firebase. Có thể tách riêng Production về sau.

Với `FIREBASE_PRIVATE_KEY`:

- Dán từ `-----BEGIN PRIVATE KEY-----` đến `-----END PRIVATE KEY-----`.
- Không dán `FIREBASE_PRIVATE_KEY=` vào ô Value.
- Không cần dấu nháy ngoài cùng trong giao diện Vercel.
- Có thể giữ xuống dòng thật; code server cũng xử lý chuỗi có `\n`.

Cảnh báo public prefix cho biến `VITE_` là bình thường với Firebase Web config. Không dùng `VITE_` cho private key, ImgBB key hay setup secret.

### Bước 3 — Deploy

1. Chọn **Deploy**, chờ **Ready**.
2. Mở domain, ví dụ `https://qlcldv.vercel.app`.
3. Thêm `qlcldv.vercel.app` vào Firebase Authorized domains.
4. Kiểm tra đăng nhập và các API.

Sau khi sửa biến Vercel: **Deployments** → menu bản mới nhất → **Redeploy** → `Production`. Có thể bỏ **Use existing Build Cache** để build sạch.

### File `vercel.json`

Giữ đúng tên `vercel.json` ở thư mục gốc:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Rewrite giúp React Router mở trực tiếp `/donate`, `/blog/...`, `/quan-ly-user` mà không 404.

Không dùng `vercel.deploy.json` làm cấu hình production vì Vercel tự đọc `vercel.json`. Nếu file test không còn dùng, có thể bỏ sau khi xác nhận `vercel.json` đúng.

## 15. Cập nhật website

Khi GitHub đã kết nối Vercel:

```bash
git status
npm run build
git add TEN_FILE_DA_SUA
git commit -m "fix: mô tả lỗi đã sửa"
git push
```

- Push `main` tạo deployment Production nếu `main` là Production Branch.
- Push branch khác thường tạo Preview Deployment.
- Không cần `vercel --prod` hằng ngày khi Git integration đang hoạt động.
- Nếu chỉ đổi biến môi trường, dùng Redeploy.

## 16. Danh sách kiểm tra

- [ ] `/login` không trắng trang.
- [ ] Chưa đăng nhập không vào được nội dung nghiệp vụ.
- [ ] Đăng nhập xong chuyển về trang chính.
- [ ] Menu tài khoản đóng khi bấm ra ngoài.
- [ ] Quản lý User tải danh sách và tạo tài khoản được.
- [ ] Admin chỉ phân quyền User/Admin.
- [ ] SuperAdmin phân quyền được cả ba vai trò.
- [ ] Năm Box lõi không xóa được; Box tùy chỉnh xóa được.
- [ ] Blog và ảnh tải đúng; upload ImgBB thành công.
- [ ] Donate hiển thị QR, tài khoản và Top Donate.
- [ ] Xử lý, lưu, xem và tải Excel báo cáo thành công.
- [ ] Quyền xem/xóa báo cáo đã lưu đúng vai trò.
- [ ] Tải lại trực tiếp `/donate` hoặc route sâu không 404.
- [ ] Giao diện sáng/tối và mobile hoạt động.

## 17. Xử lý lỗi thường gặp

### `Failed to resolve /src/main.jsx`

File `src/main.jsx` bị thiếu, thường do chọn Replace thư mục:

```bash
ls src/main.jsx
git status
git restore src/main.jsx
```

Nếu nhiều file `src` bị xóa:

```bash
git ls-files --deleted src
git ls-files --deleted -z src | xargs -0 git restore --
npm run build
```

### `Thiếu biến môi trường FIREBASE_PROJECT_ID`

- Phải có `FIREBASE_PROJECT_ID`, không chỉ `VITE_FIREBASE_PROJECT_ID`.
- `.env.local` phải cùng cấp `package.json`.
- Dừng và chạy lại server.
- Trên Vercel, thêm đúng project/environment rồi Redeploy.
- Chạy local đầy đủ bằng `npx vercel dev --listen 3000`.

### `ERR_REQUIRE_ESM` liên quan `jose` và `jwks-rsa`

Thêm vào `package.json`:

```json
{
  "overrides": {
    "jwks-rsa": {
      "jose": "4.15.9"
    }
  }
}
```

Hoặc:

```bash
npm pkg set 'overrides.jwks-rsa.jose=4.15.9'
npm install
npm run build
git add package.json package-lock.json
git commit -m "fix: pin jose version for Vercel functions"
git push
```

Đây là workaround tương thích; khi nâng dependency, cần kiểm tra lại trước khi bỏ override.

### `Missing or insufficient permissions`

1. Publish lại `firestore.rules`.
2. Kiểm tra đang kết nối đúng Firebase project.
3. Kiểm tra `users/{uid}` có `role` đúng.
4. Đăng xuất rồi đăng nhập lại để token nhận claim mới.

### Quản lý User báo `Không thể kết nối máy chủ`

1. Vercel → project → **Logs**.
2. Lọc request `/api/manage-users`.
3. Kiểm tra ba biến Firebase Admin.
4. Kiểm tra private key đủ BEGIN/END và xuống dòng.
5. Kiểm tra lỗi `jose` ở trên.
6. Redeploy sau khi sửa.

### `Unexpected end of JSON input`

Frontend đang đọc JSON nhưng API trả body rỗng do Function crash. Xem Terminal khi chạy `vercel dev` hoặc Vercel Logs, rồi sửa lỗi thật ở API/env/dependency.

### Trang trắng trên localhost

1. DevTools → **Console**.
2. Xem Terminal chạy Vite/Vercel.
3. Chạy `npm run build` để bắt lỗi import/syntax.
4. Hard reload.
5. Mở đúng port: `5173` cho Vite, `3000` cho Vercel Dev.

Đảm bảo title HTML đóng đúng:

```html
<title>QLCL-DV | Báo cáo tuần</title>
```

### Route Vercel bị 404

Kiểm tra file tên đúng `vercel.json`, nằm ở gốc và có rewrite SPA. Commit, push và redeploy.

### `auth/unauthorized-domain`

Thêm domain vào Firebase → Authentication → Settings → Authorized domains.

### Tạo SuperAdmin thất bại

- `SETUP_SECRET` phải khớp 100% và dài tối thiểu 24 ký tự.
- Ba biến Firebase Admin phải tồn tại.
- Email/Password và Firestore đã bật.
- Kiểm tra có SuperAdmin cũ trong `users` hay chưa.
- Xem log `/api/bootstrap-superadmin`.
- Không mở trực tiếp API bằng trình duyệt vì API tạo tài khoản yêu cầu `POST`, không phải `GET`.

## 18. Bảo mật và sao lưu

Không đưa lên GitHub:

- `.env.local`
- Private key và Service Account JSON
- ImgBB API key
- `SETUP_SECRET`
- `.vercel/`

Trước khi push:

```bash
git status
git diff --staged
```

Nếu secret từng bị commit, xóa ở commit mới chưa đủ vì lịch sử vẫn còn. Hãy rotate/revoke secret ngay và làm sạch lịch sử Git nếu cần.

Nên xuất dữ liệu Firestore định kỳ, giữ bản sao file Excel mẫu, dùng GitHub làm lịch sử mã nguồn và thử clone sạch theo README sau các thay đổi lớn.

## Tài liệu chính thức

- [Firebase Web setup](https://firebase.google.com/docs/web/setup)
- [Firebase Password Authentication](https://firebase.google.com/docs/auth/web/password-auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK setup](https://firebase.google.com/docs/admin/setup)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Vercel Git deployments](https://vercel.com/docs/git)
- [Vercel Vite](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel CLI dev](https://vercel.com/docs/cli/dev)
- [Vercel CLI pull](https://vercel.com/docs/cli/pull)
- [GitHub: thêm code local lên GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [GitHub: quản lý remote](https://docs.github.com/en/get-started/git-basics/managing-remote-repositories)
- [GitHub: push commit](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository)

## Lệnh nhớ nhanh

```bash
# Cài và chạy đầy đủ local
npm install
npx vercel dev --listen 3000

# Kiểm tra trước khi cập nhật
git status
npm run build

# Commit và push
git add .
git status
git commit -m "feat: mô tả thay đổi"
git push
```

Nếu quên một bước, quay lại đúng mục trong README và làm theo thứ tự; nên đọc log và giải quyết từng lỗi một.
