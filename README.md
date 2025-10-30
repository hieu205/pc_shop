# Computer Shop E-commerce Project

## Tổng quan dự án
Website thương mại điện tử chuyên bán linh kiện máy tính với đầy đủ tính năng:

### Các tính năng chính:
- **3 Roles:** Customer, Staff, Admin với phân quyền rõ ràng
- **Hệ thống bình luận:** 2 cấp (comment gốc + reply từ staff)
- **Quản lý kho:** Cảnh báo sắp hết hàng, lịch sử nhập xuất
- **Build PC:** Customer xây dựng cấu hình PC và xuất PDF
- **Khuyến mãi:** Giảm % hoặc tiền cố định
- **Thanh toán:** COD (Cash on Delivery)
- **Đơn hàng:** Quản lý trạng thái đơn hàng

### Cấu trúc thư mục:
```
computer_shop/
├── .github/
│   └── copilot-instructions.md
├── backend/ (Spring Boot)
├── frontend/ (React + Vite + TypeScript)
├── SYSTEM_DESIGN.md
├── database_schema.sql
└── README.md
```

## Hướng dẫn setup

### 1. Database (PostgreSQL)
```sql
-- Chạy file database_schema.sql để tạo database và sample data
psql -h localhost -U postgres -d pc_shop_database -f database_schema.sql
```

### 2. Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
Server sẽ chạy tại: http://localhost:8080

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Client sẽ chạy tại: http://localhost:3000

## Tài khoản demo
- **Admin:** admin / admin123
- **Staff:** staff / staff123

## Technology Stack
- **Backend:** Java 17, Spring Boot 3.2, PostgreSQL, JWT, Maven
- **Frontend:** React 18, TypeScript, Vite, Redux Toolkit, Axios
- **Database:** PostgreSQL 14+

## API Documentation
Xem file `SYSTEM_DESIGN.md` để biết chi tiết về API endpoints và kiến trúc hệ thống.
