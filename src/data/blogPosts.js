export const initialBlogPosts = [
  {
    id: "blog-1",
    slug: "loc-du-lieu-excel-nhanh-bang-phim-tat",
    title: "Lọc dữ liệu Excel nhanh bằng bộ phím tắt dễ nhớ",
    excerpt: "Một quy trình ngắn giúp lọc, kiểm tra và sao chép dữ liệu Excel mà không phải thao tác chuột quá nhiều.",
    category: "Excel",
    tags: ["Excel", "Phím tắt", "Năng suất"],
    author: "Nguyễn Hữu Duy Kha",
    status: "published",
    featured: true,
    coverUrl: "/blog/covers/excel-shortcuts.svg",
    videoUrl: "",
    createdAt: "2026-09-01T08:30:00.000Z",
    updatedAt: "2026-09-04T03:15:00.000Z",
    readTime: 5,
    views: 128,
    content: `Khi phải xử lý báo cáo lặp lại mỗi tuần, vài phím tắt đúng chỗ có thể tiết kiệm rất nhiều thời gian. Bộ thao tác dưới đây phù hợp với các bảng dữ liệu có hàng tiêu đề rõ ràng.

## Bắt đầu bằng vùng dữ liệu sạch

Đặt con trỏ vào một ô bất kỳ trong bảng rồi dùng Ctrl + Shift + L để bật bộ lọc. Trước khi lọc, hãy kiểm tra xem bảng có dòng hoặc cột trống nằm giữa vùng dữ liệu hay không.

## Ba thao tác nên ghi nhớ

- Ctrl + phím mũi tên để di chuyển nhanh đến cuối vùng dữ liệu.
- Ctrl + Shift + phím mũi tên để chọn toàn bộ vùng liên tục.
- Alt + phím mũi tên xuống để mở danh sách lọc tại cột đang chọn.

Sau khi lọc xong, chỉ sao chép các ô đang hiển thị để tránh mang theo những hàng đã bị ẩn. Bạn nên kiểm tra lại tổng số dòng trước và sau khi dán sang báo cáo.`,
  },
  {
    id: "blog-2",
    slug: "chuan-hoa-bien-so-xe-truoc-khi-doi-chieu",
    title: "Chuẩn hóa biển số xe trước khi đối chiếu dữ liệu",
    excerpt: "Cách loại bỏ khoảng trắng, dấu chấm và khác biệt chữ hoa để tránh một xe bị tính thành nhiều bản ghi.",
    category: "Dữ liệu",
    tags: ["Biển số", "Đối chiếu", "Camera"],
    author: "Nguyễn Hữu Duy Kha",
    status: "published",
    featured: false,
    coverUrl: "/blog/covers/vehicle-data.svg",
    videoUrl: "",
    createdAt: "2026-08-29T02:20:00.000Z",
    updatedAt: "2026-08-29T02:20:00.000Z",
    readTime: 4,
    views: 94,
    content: `Biển số xe trong file theo dõi có thể được nhập theo nhiều kiểu như 50H-123.45, 50H 12345 hoặc 50h12345. Nếu so sánh trực tiếp, hệ thống có thể hiểu đây là ba xe khác nhau.

## Quy tắc chuẩn hóa

- Chuyển toàn bộ ký tự về chữ hoa.
- Xóa khoảng trắng, dấu chấm và dấu gạch ngang.
- Loại bỏ ký tự không phải chữ hoặc số.

Sau khi chuẩn hóa, cả ba cách nhập đều trở thành 50H12345. Nên giữ thêm giá trị gốc để hiển thị, còn giá trị chuẩn hóa chỉ dùng làm khóa so sánh.`,
  },
  {
    id: "blog-3",
    slug: "kiem-tra-file-bao-cao-truoc-khi-upload",
    title: "5 bước kiểm tra file báo cáo trước khi upload",
    excerpt: "Danh sách kiểm tra ngắn giúp phát hiện sai sheet, sai cột và sai định dạng ngày trước khi tổng hợp.",
    category: "Quy trình",
    tags: ["Checklist", "Excel", "Báo cáo tuần"],
    author: "Nguyễn Hữu Duy Kha",
    status: "published",
    featured: false,
    coverUrl: "/blog/covers/file-check.svg",
    videoUrl: "",
    createdAt: "2026-08-25T09:00:00.000Z",
    updatedAt: "2026-08-26T04:10:00.000Z",
    readTime: 6,
    views: 76,
    content: `Một file đúng định dạng giúp quá trình tổng hợp diễn ra nhanh và hạn chế kết quả sai. Trước khi tải lên hệ thống, hãy kiểm tra lần lượt các mục sau.

## Checklist nhanh

- Tên sheet vẫn đúng với biểu mẫu đang sử dụng.
- Hàng tiêu đề không bị xóa, đổi tên hoặc gộp thêm ô.
- Ngày tháng là giá trị ngày thật, không phải chuỗi nhập tay bất thường.
- Biển số xe và chi nhánh không để trống.
- File được lưu ở định dạng XLSX.

Nếu vừa chỉnh sửa file trên Google Sheets, hãy tải lại dưới định dạng Microsoft Excel và mở thử một lần trước khi đưa vào hệ thống.`,
  },
  {
    id: "blog-4",
    slug: "meo-doc-nhanh-ket-qua-camera-gps",
    title: "Mẹo đọc nhanh kết quả Camera và GPS theo chi nhánh",
    excerpt: "Tập trung vào trạng thái chốt kỳ và dùng trang chi tiết xe để kiểm tra những con số bất thường.",
    category: "Báo cáo",
    tags: ["Camera", "GPS", "Chi nhánh"],
    author: "Nguyễn Hữu Duy Kha",
    status: "published",
    featured: false,
    coverUrl: "/blog/covers/report-dashboard.svg",
    videoUrl: "",
    createdAt: "2026-08-21T07:45:00.000Z",
    updatedAt: "2026-08-21T07:45:00.000Z",
    readTime: 3,
    views: 63,
    content: `Khi số liệu của một chi nhánh thay đổi mạnh, đừng chỉ nhìn tổng. Hãy mở trang chi tiết để xem danh sách biển số ở từng trạng thái.

## Cách kiểm tra

Đầu tiên, so sánh tổng phương tiện với ba nhóm trạng thái. Tiếp theo, sao chép danh sách biển số của nhóm có biến động và đối chiếu với dữ liệu ngày cuối kỳ.

Việc kiểm tra theo biển số giúp phát hiện nhanh trường hợp trùng dữ liệu, xe đổi trạng thái hoặc chi nhánh được nhập chưa thống nhất.`,
  },
  {
    id: "blog-5",
    slug: "tu-dong-hoa-thu-muc-bao-cao-theo-tuan",
    title: "Tự động hóa cách đặt tên thư mục báo cáo theo tuần",
    excerpt: "Quy ước tên thư mục nhất quán để tìm kiếm và bàn giao báo cáo thuận tiện hơn.",
    category: "Năng suất",
    tags: ["Windows", "Tuần", "Tổ chức file"],
    author: "Nguyễn Hữu Duy Kha",
    status: "draft",
    featured: false,
    coverUrl: "/blog/covers/week-folders.svg",
    videoUrl: "",
    createdAt: "2026-09-03T06:30:00.000Z",
    updatedAt: "2026-09-03T06:30:00.000Z",
    readTime: 4,
    views: 0,
    content: `Bản nháp hướng dẫn cách thống nhất tên thư mục báo cáo theo tuần để mọi thành viên đều có thể tìm kiếm nhanh.

## Cấu trúc gợi ý

Sử dụng định dạng TUẦN 01 THÁNG 09 (31.08 – 06.09). Dấu chấm thay cho dấu gạch chéo giúp tên thư mục tương thích tốt trên Windows.`,
  },
];
