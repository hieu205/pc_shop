# API Testing Guide - Computer Shop Backend

## 📋 Tổng quan

Guide này cung cấp hướng dẫn chi tiết để test tất cả APIs của Computer Shop Backend đang chạy trên `http://localhost:8080` sử dụng **Postman**.

**🔧 Generated từ actual implementation:** Tài liệu này được tạo dựa trên code thực tế từ các Controller và DTO classes (07/09/2025)

**⚠️ JSON Format Convention:** Tất cả JSON fields sử dụng `snake_case` format theo copilot-instructions.md

---

## 🔐 JWT Authentication Setup

### Environment Setup trong Postman

1. Tạo Environment mới: **"Computer Shop"**
2. Thêm variables:
   - `baseUrl`: `http://localhost:8080`
   - `accessToken`: (để trống, sẽ auto-set sau khi login)
   - `refreshToken`: (để trống, sẽ auto-set sau khi login)

### Authorization Header Template

Cho tất cả protected endpoints:

```
Authorization: Bearer {{accessToken}}
```

---

## 👥 User Management & Authentication APIs

### 1. Register User

```
POST {{baseUrl}}/api/v1/users/register
```

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "username": "testuser123",
  "email": "test@example.com",
  "password": "password123",
  "full_name": "Nguyen Van Test",
  "phone": "0901234567",
  "address": "123 Test Street, Ho Chi Minh City"
}
```

**Tests Script (Auto-save tokens):**

```javascript
if (pm.response.code === 201) {
  const response = pm.response.json();
  pm.environment.set("accessToken", response.data.access_token);
  pm.environment.set("refreshToken", response.data.refresh_token);
}
```

### 2. Login User

```
POST {{baseUrl}}/api/v1/users/login
```

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "username": "testuser123",
  "password": "password123"
}
```

**Tests Script:**

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("accessToken", response.data.access_token);
  pm.environment.set("refreshToken", response.data.refresh_token);
}
```

### 3. Refresh Token

```
POST {{baseUrl}}/api/v1/users/refresh-token?refreshToken={{refreshToken}}
```

### 4. Logout User

```
POST {{baseUrl}}/api/v1/users/logout
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 5. Get Current User Profile (Authenticated)

```
GET {{baseUrl}}/api/v1/users/profile
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 6. Update Current User Profile (Authenticated)

```
PUT {{baseUrl}}/api/v1/users/profile
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "email": "newemail@example.com",
  "full_name": "Updated Full Name",
  "phone": "0907654321",
  "address": "New Address, District 1, Ho Chi Minh City"
}
```

### 7. Create User (ADMIN only)

```
POST {{baseUrl}}/api/v1/users/create
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "username": "staffuser",
  "password": "staff123",
  "email": "staff@example.com",
  "full_name": "Staff User",
  "phone": "0909876543",
  "address": "Staff Address",
  "role": "STAFF"
}
```

### 8. Get All Users (ADMIN only)

```
GET {{baseUrl}}/api/v1/users?page=0&size=10&sort=createdAt,desc
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 9. Get User by ID (ADMIN or Owner)

```
GET {{baseUrl}}/api/v1/users/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 10. Update User (ADMIN or Owner)

```
PUT {{baseUrl}}/api/v1/users/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "username": "testuser123",
  "password": "newpassword123",
  "email": "updated@example.com",
  "full_name": "Updated Name",
  "phone": "0911111111",
  "address": "Updated Address",
  "role": "CUSTOMER"
}
```

### 11. Delete User (ADMIN only)

```
DELETE {{baseUrl}}/api/v1/users/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 12. Get User by Username (ADMIN only)

```
GET {{baseUrl}}/api/v1/users/username/testuser123
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 13. Get Users by Role (ADMIN only)

```
GET {{baseUrl}}/api/v1/users/role/CUSTOMER
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 14. Check Username Exists (Public)

```
GET {{baseUrl}}/api/v1/users/check/username/testuser123
```

### 15. Check Email Exists (Public)

```
GET {{baseUrl}}/api/v1/users/check/email/test@example.com
```

---

## 🛒 Product Management APIs

### 1. Get All Products (Public)

```
GET {{baseUrl}}/api/v1/products?page=0&size=10&sort=name,asc
```

### 2. Get Product by ID (Public)

```
GET {{baseUrl}}/api/v1/products/1
```

### 3. Get Products by Category (Public)

```
GET {{baseUrl}}/api/v1/products/category/1?page=0&size=10
```

### 4. Search Products (Public)

```
GET {{baseUrl}}/api/v1/products/search?keyword=intel&page=0&size=10
```

### 5. Create Product (ADMIN only)

```
POST {{baseUrl}}/api/v1/products
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "name": "Intel Core i7-13700K",
  "description": "Bộ xử lý Intel Core i7 thế hệ 13, 16 cores, 24 threads",
  "price": 12500000,
  "quantity": 50,
  "low_stock_threshold": 10,
  "image_url": "https://example.com/intel-i7.jpg",
  "category_id": 1,
  "specifications": {
    "cores": 16,
    "threads": 24,
    "base_clock": "3.4 GHz",
    "boost_clock": "5.4 GHz",
    "socket": "LGA1700",
    "cache": "30MB",
    "tdp": "125W"
  }
}
```

### 6. Update Product (ADMIN only)

```
PUT {{baseUrl}}/api/v1/products/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):** (Same format as Create Product)

### 7. Delete Product (ADMIN only)

```
DELETE {{baseUrl}}/api/v1/products/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

---

## 📂 Category Management APIs

### 1. Get All Categories (Public)

```
GET {{baseUrl}}/api/v1/categories
```

### 2. Get Category by ID (Public)

```
GET {{baseUrl}}/api/v1/categories/1
```

### 3. Get Sub-Categories by Parent (Public)

```
GET {{baseUrl}}/api/v1/categories/parent/1
```

### 4. Create Category (ADMIN only)

```
POST {{baseUrl}}/api/v1/categories
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "name": "CPU",
  "description": "Bộ xử lý trung tâm",
  "parent_category_id": null
}
```

### 5. Update Category (ADMIN only)

```
PUT {{baseUrl}}/api/v1/categories/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "name": "CPU - Processors",
  "description": "Bộ xử lý trung tâm - Central Processing Units",
  "parent_category_id": null
}
```

### 6. Delete Category (ADMIN only)

```
DELETE {{baseUrl}}/api/v1/categories/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

---

## 🛍️ Shopping Cart APIs

### 1. Get User Cart (Authenticated)

```
GET {{baseUrl}}/api/v1/cart/user/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 2. Add Item to Cart (Authenticated)

```
POST {{baseUrl}}/api/v1/cart/user/1/items
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "product_id": 1,
  "quantity": 2
}
```

### 3. Update Cart Item Quantity (Authenticated)

```
PUT {{baseUrl}}/api/v1/cart/user/1/items/1?quantity=5
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 4. Remove Item from Cart (Authenticated)

```
DELETE {{baseUrl}}/api/v1/cart/user/1/items/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 5. Clear Cart (Authenticated)

```
DELETE {{baseUrl}}/api/v1/cart/user/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 6. Merge Guest Cart (Authenticated)

```
POST {{baseUrl}}/api/v1/cart/merge
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "guest_cart_items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 2,
      "quantity": 1
    }
  ]
}
```

---

## 📦 Order Management APIs

### 1. Get All Orders (ADMIN/STAFF only)

```
GET {{baseUrl}}/api/v1/orders?page=0&size=10&sort=createdAt,desc
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 2. Get User Orders (Authenticated)

```
GET {{baseUrl}}/api/v1/orders/user/1?page=0&size=10
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 3. Get Order by ID (Owner/ADMIN/STAFF)

```
GET {{baseUrl}}/api/v1/orders/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 4. Get Order by Code (Public)

```
GET {{baseUrl}}/api/v1/orders/code/ORD-20240907-001
```

### 5. Get Orders by Status (ADMIN/STAFF only)

```
GET {{baseUrl}}/api/v1/orders/status/PENDING?page=0&size=10
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 6. Create Order from Cart (Authenticated)

```
POST {{baseUrl}}/api/v1/orders/user/1/from-cart
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "customer_name": "Nguyen Van A",
  "customer_email": "customer@example.com",
  "shipping_address": "123 ABC Street, District 1, Ho Chi Minh City",
  "shipping_phone": "0901234567",
  "payment_method": "COD",
  "notes": "Giao hang trong gio hanh chinh",
  "promotion_id": null
}
```

### 7. Update Order Status (ADMIN/STAFF only)

```
PATCH {{baseUrl}}/api/v1/orders/1/status?status=PROCESSING
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 8. Cancel Order (Owner/ADMIN)

```
PATCH {{baseUrl}}/api/v1/orders/1/cancel
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

---

## 💬 Comment Management APIs

### 1. Get Product Comments (Public)

```
GET {{baseUrl}}/api/v1/comments/product/1?page=0&size=10
```

### 2. Get Comment by ID (Public)

```
GET {{baseUrl}}/api/v1/comments/1
```

### 3. Create Comment (Authenticated)

```
POST {{baseUrl}}/api/v1/comments/product/1/user/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "content": "San pham rat tot, chay cuc manh!",
  "parent_comment_id": null
}
```

### 4. Reply to Comment (Authenticated)

```
POST {{baseUrl}}/api/v1/comments/1/reply/user/2
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "content": "Cam on ban da danh gia san pham!",
  "parent_comment_id": 1
}
```

### 5. Update Comment (Owner/ADMIN)

```
PUT {{baseUrl}}/api/v1/comments/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "content": "San pham tuyet voi, hieu nang cao va on dinh!",
  "parent_comment_id": null
}
```

### 6. Delete Comment (Owner/ADMIN)

```
DELETE {{baseUrl}}/api/v1/comments/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

---

## 🔐 Role Management APIs

### 1. Get All Roles (ADMIN only)

```
GET {{baseUrl}}/api/v1/roles?page=0&size=10
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 2. Get Roles List (ADMIN/STAFF)

```
GET {{baseUrl}}/api/v1/roles/list
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 3. Get Role by ID (ADMIN only)

```
GET {{baseUrl}}/api/v1/roles/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 4. Create Role (ADMIN only)

```
POST {{baseUrl}}/api/v1/roles
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "name": "MANAGER",
  "description": "Store Manager Role"
}
```

### 5. Update Role (ADMIN only)

```
PUT {{baseUrl}}/api/v1/roles/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "name": "ADMIN",
  "description": "Administrator Role - Full Access"
}
```

### 6. Delete Role (ADMIN only)

```
DELETE {{baseUrl}}/api/v1/roles/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 7. Get Role Statistics (ADMIN only)

```
GET {{baseUrl}}/api/v1/roles/1/stats
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 8. Check Role Name Availability (ADMIN only)

```
GET {{baseUrl}}/api/v1/roles/check-name?name=MANAGER
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

---

## 📊 Inventory Management APIs

### 1. Get All Inventory Products (ADMIN/STAFF only)

```
GET {{baseUrl}}/api/v1/inventory/products?page=0&size=20
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 2. Get Product Inventory (ADMIN/STAFF only)

```
GET {{baseUrl}}/api/v1/inventory/products/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 3. Get Low Stock Products (ADMIN/STAFF only)

```
GET {{baseUrl}}/api/v1/inventory/low-stock?threshold=10
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 4. Get Out of Stock Products (ADMIN/STAFF only)

```
GET {{baseUrl}}/api/v1/inventory/out-of-stock
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 5. Get Products Need Restock (ADMIN/STAFF only)

```
GET {{baseUrl}}/api/v1/inventory/need-restock
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 6. Adjust Product Stock (ADMIN/STAFF only)

```
POST {{baseUrl}}/api/v1/inventory/products/1/adjust
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "change_type": "RESTOCK",
  "quantity": 50,
  "reason": "Nhap hang tu nha cung cap",
  "performed_by": 1
}
```

### 7. Update Stock Threshold (ADMIN/STAFF only)

```
PUT {{baseUrl}}/api/v1/inventory/products/1/threshold
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "low_stock_threshold": 15
}
```

### 8. Reserve Stock (ADMIN/STAFF only)

```
POST {{baseUrl}}/api/v1/inventory/products/1/reserve
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "quantity": 5,
  "reserved_for": "Order #123"
}
```

### 9. Release Reserved Stock (ADMIN/STAFF only)

```
POST {{baseUrl}}/api/v1/inventory/products/1/release
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "quantity": 5,
  "reason": "Order cancelled"
}
```

### 10. Get Inventory Logs (ADMIN/STAFF only)

```
GET {{baseUrl}}/api/v1/inventory/logs?page=0&size=20
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 11. Get Product Inventory Logs (ADMIN/STAFF only)

```
GET {{baseUrl}}/api/v1/inventory/products/1/logs?page=0&size=10
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 12. Check Stock Availability (ADMIN/STAFF only)

```
GET {{baseUrl}}/api/v1/inventory/products/1/availability
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

---

## 🎯 Promotion Management APIs

### 1. Get Active Promotions (Public)

```
GET {{baseUrl}}/api/v1/promotions/active
```

### 2. Get Applicable Promotions (Public)

```
GET {{baseUrl}}/api/v1/promotions/applicable?price=1000000
```

### 3. Get Best Promotion (Public)

```
GET {{baseUrl}}/api/v1/promotions/best?price=2000000
```

### 4. Calculate Discount (Public)

```
GET {{baseUrl}}/api/v1/promotions/1/calculate-discount?originalPrice=1500000
```

### 5. Check if Promotion is Active (Public)

```
GET {{baseUrl}}/api/v1/promotions/1/is-active
```

### 6. Check if Promotion is Applicable (Public)

```
GET {{baseUrl}}/api/v1/promotions/1/is-applicable?price=1000000
```

### 7. Get All Promotions (ADMIN only)

```
GET {{baseUrl}}/api/v1/promotions?page=0&size=10
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 8. Get Promotion by ID (Public)

```
GET {{baseUrl}}/api/v1/promotions/1
```

### 9. Get Promotions by Type (ADMIN only)

```
GET {{baseUrl}}/api/v1/promotions/type/PERCENTAGE?page=0&size=10
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 10. Create Promotion (ADMIN only)

```
POST {{baseUrl}}/api/v1/promotions
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "name": "Summer Sale 2024",
  "description": "Uu dai mua he - Giam 20% cho don hang tren 2 trieu",
  "code": "SUMMER2024",
  "discount_type": "PERCENTAGE",
  "discount_value": 20.0,
  "min_order_value": 2000000.0,
  "max_discount": 500000.0,
  "usage_limit": 100,
  "start_date": "2024-06-01T00:00:00",
  "end_date": "2024-08-31T23:59:59",
  "is_active": true
}
```

### 11. Update Promotion (ADMIN only)

```
PUT {{baseUrl}}/api/v1/promotions/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):** (Same format as Create Promotion)

### 12. Delete Promotion (ADMIN only)

```
DELETE {{baseUrl}}/api/v1/promotions/1
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 13. Activate Promotion (ADMIN only)

```
PUT {{baseUrl}}/api/v1/promotions/1/activate
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 14. Deactivate Promotion (ADMIN only)

```
PUT {{baseUrl}}/api/v1/promotions/1/deactivate
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
```

### 15. Validate Promotion (ADMIN only)

```
POST {{baseUrl}}/api/v1/promotions/validate
```

**Headers:**

```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (JSON):** (Same format as Create Promotion)

---

## 📝 Test Scenarios

### Scenario 1: Complete Customer Journey

```javascript
// 1. Register new customer
// 2. Login and get tokens
// 3. Browse categories and products
// 4. Add items to cart
// 5. Apply promotion
// 6. Create order
// 7. Track order by code
// 8. Add product review
```

### Scenario 2: Admin Management Flow

```javascript
// 1. Login as ADMIN
// 2. Create categories and products
// 3. Manage inventory
// 4. Create promotions
// 5. Process orders
// 6. Manage users and roles
```

### Scenario 3: Staff Operations

```javascript
// 1. Login as STAFF
// 2. Update product inventory
// 3. Process customer orders
// 4. Reply to customer comments
// 5. Generate inventory reports
```

---

## ⚠️ Important Notes

### JSON Convention

- **All JSON fields use `snake_case` format** (e.g., `full_name`, `product_id`)
- Follow this convention consistently in all API requests
- Backend automatically maps snake_case to camelCase using `@JsonProperty`

### Authentication Flow

- Access tokens expire after configured time (default: 30 days)
- Use refresh token to get new access token
- Logout revokes tokens from database
- Include `Authorization: Bearer {token}` header for protected endpoints

### Role-Based Access Control

- **PUBLIC**: Categories, Products (read), Comments (read), Promotions (read)
- **CUSTOMER**: Cart management, Order creation, Comment creation, Profile management
- **STAFF**: Product management, Order processing, Inventory management
- **ADMIN**: Full access to all resources including user and role management

### Error Handling

- All responses follow `ApiResponse<T>` format
- Validation errors return detailed field-level messages
- HTTP status codes follow REST conventions

### Testing Best Practices

1. Set up Postman environment variables for token management
2. Use Pre-request Scripts for automatic token refresh
3. Test edge cases: invalid tokens, insufficient permissions
4. Validate response structure and data types
5. Test pagination parameters for list endpoints

---

## 🔧 Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Delete successful (no response body)
- `400 Bad Request`: Validation failed or malformed request
- `401 Unauthorized`: Token invalid or missing
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

---

## 📊 API Summary

**Total Endpoints**: 80+

### By Controller:

- **UserController**: 15 endpoints
- **ProductController**: 7 endpoints
- **CategoryController**: 6 endpoints
- **CartController**: 6 endpoints
- **OrderController**: 8 endpoints
- **CommentController**: 6 endpoints
- **RoleController**: 8 endpoints
- **InventoryController**: 12 endpoints
- **PromotionController**: 15 endpoints

### By Access Level:

- **Public**: 20+ endpoints
- **Customer**: 15+ endpoints
- **Staff**: 25+ endpoints
- **Admin**: All endpoints

---

**Cập nhật lần cuối:** 07/09/2025  
**Backend Version:** Spring Boot 3.x với JWT Authentication  
**JSON Convention:** snake_case format  
**Trạng thái:** ✅ Ready for Testing
