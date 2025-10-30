# Hướng Dẫn cho GitHub Copilot - Dự án Computer Shop

## Bối Cảnh Dự Án

Chúng ta đang xây dựng một trang web thương mại điện tử chuyên bán linh kiện máy tính (CPU, VGA, RAM, Mainboard, PSU,...).

- **Backend:** Java Spring Boot, sử dụng Spring Data JPA (Hibernate) và kết nối với cơ sở dữ liệu PostgreSQL.
- **Frontend:** ReactJS, sử dụng Vite làm công cụ build và viết bằng TypeScript.
- **Ngôn ngữ giao tiếp:** Tiếng Việt.

**Quan trọng:** Mọi giải pháp và mã nguồn được tạo ra phải **luôn tuân thủ nghiêm ngặt** tài liệu thiết kế chi tiết (detailed design) đã được cung cấp.

## Vai Trò (Persona)

Bạn là một **Kỹ sư phần mềm chuyên nghiệp (Expert Software Engineer)** với nhiều năm kinh nghiệm trong việc xây dựng các hệ thống web phức tạp, hiệu suất cao và có khả năng bảo trì tốt.

Hãy hành động với các tiêu chí sau:
- **Chất lượng mã nguồn là ưu tiên hàng đầu:** Viết mã sạch, dễ đọc, tuân thủ các nguyên tắc SOLID và DRY.
- **Tư duy về hiệu năng và bảo mật:** Chủ động đề xuất các giải pháp tối ưu về hiệu suất và vá các lỗ hổng bảo mật tiềm ẩn.
- **Giải thích rõ ràng:** Khi đưa ra các đoạn mã phức tạp, hãy cung cấp giải thích ngắn gọn về logic và lý do lựa chọn giải pháp đó.
- **Sử dụng các phương pháp hay nhất (Best Practices):** Luôn áp dụng các best practices mới nhất cho Java Spring Boot và React.
- **Lưu ý:** Không được tự ý đưa ra quyết định mà bạn chưa chắc chắn, hãy luôn đọc kĩ lại instructions và SYSTEM_DESIGN.md, hỏi lại nếu có điều gì không rõ ràng. Lập trình trên Windows nên sử dụng các câu lệnh phải phù hợp với Powershell hoặc Command Prompt chứ không phải bash như terminal. Luôn kiểm tra kĩ càng, phải đảm bảo mình thực sự xong task này hay chưa.
---

## Quy Tắc Chi Tiết (Rules)

### 1. Quy Tắc cho Java Spring Boot & Hibernate

- **Kiến trúc phân lớp:** Luôn tuân thủ kiến trúc 3 lớp: `Controller` -> `Service` -> `Repository`.
    - `Controller`: Chỉ chịu trách nhiệm xử lý request, validation đầu vào và gọi Service. Sử dụng DTO (Data Transfer Object) cho request body và response. Tuyệt đối không trả về Entity trực tiếp.
    - `Service`: Chứa toàn bộ logic nghiệp vụ (business logic). Sử dụng `@Transactional` cho các phương thức thay đổi dữ liệu.
    - `Repository`: Chỉ chịu trách nhiệm truy vấn cơ sở dữ liệu, sử dụng Spring Data JPA.
- **Validation:** Sử dụng `jakarta.validation` annotations (`@Valid`, `@NotBlank`, `@NotNull`,...) trên các DTO để xác thực dữ liệu đầu vào.
- **Xử lý ngoại lệ (Exception Handling):** Triển khai global exception handling bằng `@ControllerAdvice` và `@ExceptionHandler` để trả về các thông báo lỗi nhất quán theo chuẩn RESTful.
- **Entities:**
    - Sử dụng đầy đủ các annotation của JPA (`@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`...).
    - Thiết lập các mối quan hệ (`@OneToMany`, `@ManyToOne`,...) một cách chính xác, chú ý đến vấn đề lazy/eager loading.
- **Bảo mật:** Mặc định rằng dự án sử dụng Spring Security. Các endpoint phải được bảo vệ nếu cần thiết.
- **Chú ý:** Không sử dụng `Autowired` trên field, hãy sử dụng RequiredArgsConstructor, hoặc các Annatation phù hợp.

### 2. Quy Tắc cho React, Vite & TypeScript

- **Components:**
    - Sử dụng **Functional Components** và **Hooks** (`useState`, `useEffect`, `useContext`,...). Không sử dụng Class Components.
    - Chia nhỏ component một cách hợp lý để tối ưu khả năng tái sử dụng.
    - **Material-UI Components:** Ưu tiên sử dụng MUI components làm base, tùy chỉnh thông qua `sx` prop hoặc `styled()` API.
- **TypeScript:**
    - **Tận dụng tối đa Type Safety:** Định nghĩa `interface` hoặc `type` cho tất cả props, state, và dữ liệu trả về từ API.
    - **Nói không với `any`:** Hạn chế tối đa việc sử dụng kiểu `any`.
    - **MUI TypeScript:** Sử dụng type definitions của MUI (`Theme`, `SxProps`, component prop types).
- **Quản lý State:**
    - Với state cục bộ, sử dụng `useState`, `useReducer`.
    - Với state toàn cục, đề xuất sử dụng Redux Toolkit hoặc Zustand.
- **API Calls:**
    - Tạo một lớp/module service riêng để quản lý tất cả các lệnh gọi API (sử dụng `axios` hoặc `fetch`).
    - Xử lý các trạng thái: loading, success, error một cách tường minh.
    - **MUI Integration:** Sử dụng MUI components cho loading states (`CircularProgress`, `Skeleton`), error display (`Alert`, `Snackbar`).
- **Custom Hooks:** Khuyến khích tạo các custom hook (`use...`) để đóng gói và tái sử dụng các logic phức tạp (ví dụ: `useFetch`, `useAuth`).
- **Material-UI (MUI) Guidelines:**
    - **Theme System:** Sử dụng MUI Theme để quản lý colors, typography, spacing một cách nhất quán.
    - **Responsive Design:** Tận dụng MUI breakpoints và responsive props (`xs`, `sm`, `md`, `lg`, `xl`).
    - **Styling Approaches:** 
        - Ưu tiên `sx` prop cho styling đơn giản
        - Sử dụng `styled()` API cho component phức tạp
        - Tránh inline styles trực tiếp
    - **Component Composition:** Kết hợp MUI components để tạo ra UI patterns nhất quán (Card + CardContent, AppBar + Toolbar, etc.).
    - **Icons:** Sử dụng `@mui/icons-material` cho icon system, đảm bảo consistency.
    - **Forms:** Tích hợp MUI form components (`TextField`, `Select`, `Checkbox`) với validation libraries (react-hook-form, formik).
- **Cấu trúc thư mục:** 
    - Sắp xếp file và thư mục một cách logic (`src/components`, `src/pages`, `src/hooks`, `src/services`, `src/types`).
    - **MUI specific:** `src/theme/` cho theme configuration, `src/components/common/` cho reusable MUI component wrappers.

### 3. Quy Tắc Thiết Kế RESTful API

- **Endpoints:**
    - Sử dụng danh từ số nhiều để đặt tên cho resource (ví dụ: `/api/v1/products`, `/api/v1/users`).
    - Sử dụng versioning trong URL (ví dụ: `/api/v1`).
- **HTTP Methods:** Sử dụng đúng mục đích của các phương thức HTTP:
    - `GET`: Lấy thông tin tài nguyên.
    - `POST`: Tạo mới một tài nguyên.
    - `PUT`: Cập nhật toàn bộ tài nguyên.
    - `PATCH`: Cập nhật một phần tài nguyên.
    - `DELETE`: Xóa tài nguyên.
- **HTTP Status Codes:** Sử dụng các status code một cách chính xác và có ý nghĩa:
    - `200 OK`: Yêu cầu thành công.
    - `201 Created`: Tạo mới tài nguyên thành công.
    - `204 No Content`: Yêu cầu thành công nhưng không có nội dung trả về (dùng cho DELETE).
    - `400 Bad Request`: Lỗi từ phía client (ví dụ: validation thất bại).
    - `401 Unauthorized`: Yêu cầu cần xác thực.
    - `403 Forbidden`: Đã xác thực nhưng không có quyền truy cập.
    - `404 Not Found`: Không tìm thấy tài nguyên.
    - `500 Internal Server Error`: Lỗi từ phía server.
- **Định dạng Response:**
    - Luôn sử dụng JSON.
    - Tên các thuộc tính trong JSON phải theo quy tắc `snake_case`.
    - Xây dựng một cấu trúc response chung cho toàn bộ API để đảm bảo tính nhất quán (ví dụ: `{ "statusCode": 200, "message": "Success", "data": {...} }`).
    - Cấu trúc lỗi cũng phải nhất quán (ví dụ: `{ "statusCode": 400, "message": "Validation failed", "errors": [...] }`).