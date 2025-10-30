# System Design - Computer Shop E-commerce

## 1. Tổng quan hệ thống

### 1.1 Mô tả
Hệ thống thương mại điện tử chuyên bán linh kiện máy tính với các chức năng:
- Quản lý sản phẩm theo danh mục (CPU, VGA, RAM, Mainboard, PSU, etc.)
- Quản lý người dùng và phân quyền (3 roles: CUSTOMER, STAFF, ADMIN)
- Hệ thống bình luận/đánh giá sản phẩm (2 cấp: comment gốc + reply, yêu cầu đăng nhập)
- Quản lý kho hàng với cảnh báo sắp hết hàng
- **Tính năng Build PC (Frontend-only)**: Tự động tính tổng tiền và xuất PDF, không lưu database
- **Guest Shopping**: Cho phép xem sản phẩm và thêm vào giỏ hàng không cần đăng nhập
- Hệ thống khuyến mãi (giảm % hoặc tiền cố định)
- Giỏ hàng và đặt hàng (COD - thanh toán khi nhận hàng, yêu cầu đăng nhập khi checkout)
- Quản lý đơn hàng

### 1.2 Kiến trúc tổng thể
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React.js      │    │   Spring Boot    │    │   PostgreSQL    │
│   Frontend      │◄──►│    Backend       │◄──►│    Database     │
│   (Port 3000)   │    │   (Port 8080)    │    │   (Port 5432)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Kiến trúc Backend (Spring Boot)

### 2.1 Cấu trúc thư mục
```
src/main/java/com/computershop/
├── ComputerShopApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── JpaConfig.java
│   └── CorsConfig.java
├── controller/
│   ├── UserController.java
│   ├── RoleController.java
│   ├── ProductController.java
│   ├── CategoryController.java
│   ├── CartController.java
│   ├── OrderController.java
│   ├── CommentController.java
│   ├── InventoryController.java
│   └── PromotionController.java
├── dto/
│   ├── request/
│   └── response/
├── entity/
│   ├── Role.java
│   ├── User.java
│   ├── Token.java
│   ├── Category.java
│   ├── Product.java
│   ├── Cart.java
│   ├── CartItem.java
│   ├── Order.java
│   ├── OrderItem.java
│   ├── Comment.java
│   ├── InventoryLog.java
│   └── Promotion.java
├── repository/
├── service/
│   ├── impl/
│   └── interfaces/
├── exception/
│   ├── GlobalExceptionHandler.java
│   └── custom/
└── util/
```

### 2.2 Các Entity chính

#### Role Entity
- id (BIGINT, Primary Key)
- name (VARCHAR(50), UNIQUE NOT NULL - ADMIN, STAFF, CUSTOMER)

#### User Entity
- id (BIGINT, Primary Key)
- username (VARCHAR(50), UNIQUE NOT NULL)
- email (VARCHAR(100), UNIQUE NOT NULL)
- password (VARCHAR(255), NOT NULL)
- fullName (VARCHAR(100), NOT NULL)
- phone (VARCHAR(20))
- address (TEXT)
- roleId (BIGINT, Foreign Key to Role)
- isActive (BOOLEAN, default true)
- createdAt, updatedAt (TIMESTAMP)

#### Token Entity
- id (BIGINT, Primary Key)
- token (VARCHAR(500), UNIQUE NOT NULL)
- tokenType (VARCHAR(50), NOT NULL, default 'ACCESS_TOKEN')
- expirationDate (TIMESTAMP, NOT NULL)
- revoked (BOOLEAN, default false)
- expired (BOOLEAN, default false)
- userId (BIGINT, Foreign Key to User)

#### Category Entity
- id (BIGINT, Primary Key)
- name (VARCHAR(100), NOT NULL)
- description (TEXT)
- parentCategoryId (BIGINT, Foreign Key to Category - self-reference)
- isActive (BOOLEAN, default true)
- createdAt, updatedAt (TIMESTAMP)

#### Product Entity
- id (BIGINT, Primary Key)
- name (VARCHAR(200), NOT NULL)
- description (TEXT)
- price (DECIMAL(15,2), NOT NULL)
- quantity (INTEGER, NOT NULL, default 0)
- lowStockThreshold (INTEGER, default 10)
- imageUrl (VARCHAR(500))
- categoryId (BIGINT, Foreign Key to Category)
- specifications (JSONB - lưu thông số kỹ thuật)
- isActive (BOOLEAN, default true)
- createdAt, updatedAt (TIMESTAMP)

#### Cart Entity
- id (BIGINT, Primary Key)
- userId (BIGINT, Foreign Key to User, UNIQUE - mỗi user 1 cart)
- createdAt, updatedAt (TIMESTAMP)

#### CartItem Entity
- id (BIGINT, Primary Key)
- cartId (BIGINT, Foreign Key to Cart)
- productId (BIGINT, Foreign Key to Product)
- quantity (INTEGER, NOT NULL, default 1)
- createdAt, updatedAt (TIMESTAMP)
- UNIQUE constraint trên (cartId, productId)

#### Order Entity
- id (BIGINT, Primary Key)
- orderCode (VARCHAR(50), UNIQUE NOT NULL - mã tra cứu)
- userId (BIGINT, Foreign Key to User)
- customerName (VARCHAR(100), NOT NULL - snapshot)
- customerEmail (VARCHAR(100), NOT NULL - snapshot)
- totalAmount (DECIMAL(15,2), NOT NULL)
- discountAmount (DECIMAL(15,2), default 0)
- finalAmount (DECIMAL(15,2), NOT NULL)
- promotionId (BIGINT, Foreign Key to Promotion, nullable)
- status (VARCHAR(20), NOT NULL, default 'PENDING')
- paymentMethod (VARCHAR(20), default 'COD')
- shippingAddress (TEXT, NOT NULL)
- shippingPhone (VARCHAR(20))
- notes (TEXT)
- createdAt, updatedAt (TIMESTAMP)

#### OrderItem Entity
- id (BIGINT, Primary Key)
- orderId (BIGINT, Foreign Key to Order)
- productId (BIGINT, Foreign Key to Product)
- productName (VARCHAR(200), NOT NULL - snapshot)
- quantity (INTEGER, NOT NULL)
- price (DECIMAL(15,2), NOT NULL - snapshot)
- createdAt (TIMESTAMP)

#### Comment Entity
- id (BIGINT, Primary Key)
- userId (BIGINT, Foreign Key to User)
- productId (BIGINT, Foreign Key to Product)
- parentCommentId (BIGINT, Foreign Key to Comment - nullable)
- content (TEXT, NOT NULL)
- isStaffReply (BOOLEAN, default false)
- createdAt, updatedAt (TIMESTAMP)

#### InventoryLog Entity
- id (BIGINT, Primary Key)
- productId (BIGINT, Foreign Key to Product)
- changeType (VARCHAR(10), NOT NULL - 'IN' hoặc 'OUT')
- quantityChange (INTEGER, NOT NULL - số lượng thay đổi +/-)
- reason (VARCHAR(200))
- performedBy (BIGINT, Foreign Key to User)
- createdAt (TIMESTAMP)

#### Promotion Entity
- id (BIGINT, Primary Key)
- name (VARCHAR(200), NOT NULL)
- description (TEXT)
- discountType (VARCHAR(20), NOT NULL - 'PERCENTAGE' hoặc 'FIXED_AMOUNT')
- discountValue (DECIMAL(15,2), NOT NULL)
- minimumOrderAmount (DECIMAL(15,2), default 0)
- startDate, endDate (TIMESTAMP, NOT NULL)
- isActive (BOOLEAN, default true)
- createdAt, updatedAt (TIMESTAMP)

## 3. Kiến trúc Frontend (React + TypeScript + Material-UI)

### 3.1 Technology Stack
- **React 18+** với Functional Components và Hooks
- **TypeScript** cho type safety và developer experience
- **Vite** cho fast development và optimized builds
- **Material-UI (MUI) v5** cho component library và design system
- **Redux Toolkit** cho state management
- **React Router v6** cho routing
- **Axios** cho API communication

### 3.2 Cấu trúc thư mục chuyên nghiệp
```
src/
├── components/
│   ├── common/           # Reusable MUI component wrappers
│   │   ├── DataTable/
│   │   ├── LoadingButton/
│   │   ├── ConfirmDialog/
│   │   └── SearchField/
│   ├── layout/           # Layout components
│   │   ├── AppBar/
│   │   ├── Sidebar/
│   │   ├── Footer/
│   │   └── Breadcrumbs/
│   ├── product/          # Product-specific components
│   │   ├── ProductCard/
│   │   ├── ProductFilter/
│   │   ├── ProductDetail/
│   │   └── ProductSearch/
│   ├── auth/             # Authentication components
│   │   ├── LoginForm/
│   │   ├── RegisterForm/
│   │   └── ProtectedRoute/
│   ├── comment/          # Comment system components
│   │   ├── CommentList/
│   │   ├── CommentForm/
│   │   └── CommentItem/
│   ├── cart/             # Shopping cart components
│   │   ├── CartDrawer/
│   │   ├── CartItem/
│   │   └── CartSummary/
│   ├── buildpc/          # Build PC feature components
│   │   ├── PCBuilder/
│   │   ├── ComponentSelector/
│   │   ├── CompatibilityChecker/
│   │   └── PDFExporter/
│   └── admin/            # Admin panel components
│       ├── Dashboard/
│       ├── UserManagement/
│       ├── ProductManagement/
│       └── OrderManagement/
├── pages/                # Route components
│   ├── Home/
│   ├── Products/
│   ├── ProductDetail/
│   ├── Cart/
│   ├── Checkout/
│   ├── Login/
│   ├── Register/
│   ├── Profile/
│   ├── BuildPC/          # Frontend-only, không kết nối API
│   ├── MyOrders/
│   ├── Admin/
│   └── Staff/
├── hooks/                # Custom React hooks
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useApi.ts
│   ├── useLocalStorage.ts
│   └── useSnackbar.ts
├── services/             # API service layer
│   ├── api.ts            # Axios instance và interceptors
│   ├── auth.service.ts
│   ├── product.service.ts
│   ├── cart.service.ts
│   ├── order.service.ts
│   └── user.service.ts
├── store/                # Redux Toolkit store
│   ├── index.ts
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── cartSlice.ts
│   │   ├── productSlice.ts
│   │   └── snackbarSlice.ts
│   └── middleware/
├── types/                # TypeScript type definitions
│   ├── api.types.ts
│   ├── auth.types.ts
│   ├── product.types.ts
│   ├── cart.types.ts
│   └── common.types.ts
├── utils/                # Utility functions
│   ├── constants.ts
│   ├── formatters.ts
│   ├── validators.ts
│   └── helpers.ts
├── theme/                # Material-UI theme configuration
│   ├── index.ts
│   ├── palette.ts
│   ├── typography.ts
│   └── components.ts
└── assets/               # Static assets
    ├── images/
    ├── icons/
    └── fonts/
```

### 3.3 Material-UI Design System

#### 3.3.1 Theme Configuration
```typescript
// src/theme/index.ts
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',      // Computer shop blue
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#ff9800',      // Orange accent
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    h2: { fontSize: '2rem', fontWeight: 500 },
    // ... responsive typography
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});
```

#### 3.3.2 Component Styling Strategy
- **Primary**: `sx` prop cho styling đơn giản và responsive
- **Secondary**: `styled()` API cho component phức tạp
- **Avoid**: Inline styles và CSS classes trực tiếp

#### 3.3.3 Responsive Design Approach
```typescript
// Sử dụng MUI breakpoints
<Box
  sx={{
    width: { xs: '100%', sm: '50%', md: '33%' },
    padding: { xs: 1, sm: 2, md: 3 },
    display: { xs: 'block', md: 'flex' }
  }}
>
```

### 3.4 State Management Architecture

#### 3.4.1 Redux Toolkit Store Structure
```typescript
interface RootState {
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
  };
  cart: {
    items: CartItem[];
    guestItems: CartItem[];  // SessionStorage backup
    totalAmount: number;
    loading: boolean;
  };
  products: {
    items: Product[];
    categories: Category[];
    filters: ProductFilters;
    pagination: PaginationState;
    loading: boolean;
  };
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };
}
```

#### 3.4.2 Guest Cart Strategy (Advanced)
```typescript
// Hybrid cart management
interface CartState {
  // Authenticated user cart (synced với backend)
  serverCart: CartItem[];
  
  // Guest cart (SessionStorage only)
  guestCart: CartItem[];
  
  // Merged cart display (union of both)
  displayCart: CartItem[];
  
  // Cart operations
  isGuest: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
}

// Merge logic khi login
const mergeCartLogic = {
  // Cùng productId: Cộng quantities
  sameProduct: (serverItem, guestItem) => ({
    ...serverItem,
    quantity: serverItem.quantity + guestItem.quantity
  }),
  
  // Khác productId: Thêm mới vào server cart
  newProduct: (guestItem) => guestItem,
  
  // Conflict resolution: Server cart ưu tiên
  conflictResolution: 'server-priority'
};
```

#### 3.4.3 Build PC State Management
```typescript
// Local state only - không sync backend
interface BuildPCState {
  selectedComponents: {
    cpu?: Product;
    motherboard?: Product;
    ram?: Product[];
    gpu?: Product;
    storage?: Product[];
    psu?: Product;
    case?: Product;
    cooling?: Product;
  };
  
  compatibility: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };
  
  pricing: {
    subtotal: number;
    tax: number;
    total: number;
    savings: number;
  };
  
  // Export options
  exportOptions: {
    includePricing: boolean;
    includeSpecs: boolean;
    includeImages: boolean;
  };
}
```

### 3.5 API Integration Layer

#### 3.5.1 Axios Configuration
```typescript
// src/services/api.ts
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor với error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(authSlice.actions.logout());
    }
    return Promise.reject(error);
  }
);
```

#### 3.5.2 Service Layer Pattern
```typescript
// src/services/product.service.ts
export class ProductService {
  static async getProducts(params: ProductQueryParams): Promise<ProductResponse> {
    const response = await apiClient.get('/products', { params });
    return response.data;
  }
  
  static async getProductById(id: number): Promise<Product> {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data;
  }
  
  static async searchProducts(query: string, filters: ProductFilters): Promise<ProductResponse> {
    const response = await apiClient.get('/products/search', {
      params: { query, ...filters }
    });
    return response.data;
  }
}
```

### 3.6 TypeScript Integration

#### 3.6.1 Comprehensive Type Definitions
```typescript
// src/types/api.types.ts
interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T;
  errors?: ValidationError[];
}

interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  is_first: boolean;
  is_last: boolean;
}

// src/types/product.types.ts
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  low_stock_threshold: number;
  image_url: string;
  category: Category;
  specifications: ProductSpecifications;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductSpecifications {
  [key: string]: string | number | boolean;
  // CPU specs
  socket?: string;
  cores?: number;
  threads?: number;
  base_clock?: string;
  boost_clock?: string;
  
  // RAM specs
  memory_type?: string;
  speed?: string;
  capacity?: string;
  
  // GPU specs
  memory_size?: string;
  memory_type?: string;
  core_clock?: string;
}
```

#### 3.6.2 Custom Hooks với TypeScript
```typescript
// src/hooks/useAuth.ts
interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();
  const { user, token, loading } = useAppSelector(state => state.auth);
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    await dispatch(authThunks.login(credentials)).unwrap();
  }, [dispatch]);
  
  return {
    user,
    isAuthenticated: !!token,
    isLoading: loading,
    login,
    logout: () => dispatch(authSlice.actions.logout()),
    register: (userData) => dispatch(authThunks.register(userData)),
  };
};
```

### 3.7 Performance Optimization

#### 3.7.1 Code Splitting Strategy
```typescript
// Lazy loading cho routes
const ProductPage = lazy(() => import('../pages/Products/ProductPage'));
const AdminPanel = lazy(() => import('../pages/Admin/AdminPanel'));
const BuildPCPage = lazy(() => import('../pages/BuildPC/BuildPCPage'));

// Component-level code splitting
const ProductModal = lazy(() => import('../components/product/ProductModal'));
```

#### 3.7.2 Memoization và Optimization
```typescript
// React.memo cho expensive components
export const ProductCard = React.memo<ProductCardProps>(({ product, onAddToCart }) => {
  const handleAddToCart = useCallback(() => {
    onAddToCart(product.id);
  }, [product.id, onAddToCart]);
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Component content */}
    </Card>
  );
});

// useMemo cho expensive calculations
const filteredProducts = useMemo(() => {
  return products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    product.category.id === selectedCategoryId
  );
}, [products, searchTerm, selectedCategoryId]);
```

### 3.8 Error Handling & User Experience

#### 3.8.1 Global Error Boundary
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Đã xảy ra lỗi không mong muốn
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
        </Container>
      );
    }
    
    return this.props.children;
  }
}
```

#### 3.8.2 Loading States với MUI
```typescript
// Skeleton loading cho product cards
const ProductCardSkeleton = () => (
  <Card sx={{ height: 300 }}>
    <Skeleton variant="rectangular" height={200} />
    <CardContent>
      <Skeleton variant="text" height={32} />
      <Skeleton variant="text" height={24} width="60%" />
      <Skeleton variant="rectangular" height={36} sx={{ mt: 2 }} />
    </CardContent>
  </Card>
);

// Global loading với backdrop
const GlobalLoader = () => (
  <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open>
    <CircularProgress color="inherit" />
  </Backdrop>
);
```

## 4. Database Schema

### 4.1 Các bảng chính
1. **roles** - Danh sách vai trò hệ thống (ADMIN, STAFF, CUSTOMER)
2. **users** - Thông tin người dùng (liên kết với roles)
3. **tokens** - Quản lý authentication tokens
4. **categories** - Danh mục sản phẩm
5. **products** - Sản phẩm (có ngưỡng cảnh báo hết hàng)
6. **comments** - Bình luận sản phẩm (2 cấp: comment gốc + reply, yêu cầu login)
7. **inventory_logs** - Lịch sử nhập xuất kho
8. **carts** - Giỏ hàng (1 user = 1 cart, guest cart lưu SessionStorage)
9. **cart_items** - Chi tiết giỏ hàng
10. **orders** - Đơn hàng (COD only, có order_code và snapshot thông tin khách hàng)
11. **order_items** - Chi tiết đơn hàng
12. **promotions** - Khuyến mãi

**Đã loại bỏ**: build_pcs và build_pc_items (chức năng Build PC chỉ frontend)

## 5. API Endpoints

*Danh sách APIs được cập nhật dựa trên phân tích implementation thực tế và best practices từ các trang ecommerce hàng đầu như Newegg, Amazon, Best Buy.*

### 5.1 User Management & Authentication

#### 🔐 Authentication APIs
- POST `/api/v1/users/register` - Đăng ký tài khoản mới
- POST `/api/v1/users/login` - Đăng nhập (trả về JWT token)
- POST `/api/v1/users/logout` - Đăng xuất và revoke token
- POST `/api/v1/users/refresh-token` - Làm mới JWT token

#### 👤 Profile Management APIs  
- GET `/api/v1/users/profile` - Lấy thông tin user hiện tại (Customer)
- PUT `/api/v1/users/profile` - Cập nhật thông tin user hiện tại (Customer)

#### 👥 User Administration APIs (Admin Only)
- GET `/api/v1/users` - Lấy danh sách users với phân trang và filter
- GET `/api/v1/users/{id}` - Lấy thông tin user theo ID
- POST `/api/v1/users/create` - Tạo user mới (bởi Admin)
- PUT `/api/v1/users/{id}` - Cập nhật user theo ID
- DELETE `/api/v1/users/{id}` - Xóa user (soft delete)

#### 🔍 User Utilities APIs
- GET `/api/v1/users/username/{username}` - Lookup user bằng username
- GET `/api/v1/users/role/{role}` - Lấy users theo role (ADMIN)
- GET `/api/v1/users/check/username/{username}` - Kiểm tra username đã tồn tại
- GET `/api/v1/users/check/email/{email}` - Kiểm tra email đã tồn tại

### 5.2 Role Management (Admin Only)

#### 🔐 Role CRUD APIs
- GET `/api/v1/roles` - Lấy danh sách tất cả roles
- GET `/api/v1/roles/list` - Lấy danh sách roles (định dạng dropdown)
- GET `/api/v1/roles/{id}` - Lấy thông tin role theo ID
- POST `/api/v1/roles` - Tạo role mới
- PUT `/api/v1/roles/{id}` - Cập nhật role
- DELETE `/api/v1/roles/{id}` - Xóa role

#### 📊 Role Analytics APIs
- GET `/api/v1/roles/{id}/stats` - Thống kê users theo role
- GET `/api/v1/roles/check-name` - Kiểm tra tên role đã tồn tại

### 5.3 Product Management

#### 🛍️ Public Product APIs (All Users)
- GET `/api/v1/products` - Lấy danh sách sản phẩm (với pagination, sorting, filtering)
- GET `/api/v1/products/{id}` - Lấy chi tiết sản phẩm theo ID
- GET `/api/v1/products/search` - Tìm kiếm sản phẩm (text search, advanced filters)
- GET `/api/v1/products/category/{categoryId}` - Lấy sản phẩm theo danh mục

#### 🔧 Product Administration APIs (Admin/Staff)
- POST `/api/v1/products` - Tạo sản phẩm mới (Admin)
- PUT `/api/v1/products/{id}` - Cập nhật sản phẩm (Admin)
- DELETE `/api/v1/products/{id}` - Xóa sản phẩm (Admin)

### 5.4 Category Management

#### 📂 Public Category APIs (All Users)
- GET `/api/v1/categories` - Lấy danh sách danh mục (tree structure)
- GET `/api/v1/categories/{id}` - Lấy thông tin danh mục theo ID
- GET `/api/v1/categories/parent/{parentId}` - Lấy danh mục con theo parent

#### 🔧 Category Administration APIs (Admin Only)
- POST `/api/v1/categories` - Tạo danh mục mới
- PUT `/api/v1/categories/{id}` - Cập nhật danh mục
- DELETE `/api/v1/categories/{id}` - Xóa danh mục

### 5.5 Shopping Cart Management

#### 🛒 User Cart APIs (Authenticated Users)
- GET `/api/v1/cart/user/{userId}` - Lấy giỏ hàng theo user ID
- POST `/api/v1/cart/user/{userId}/items` - Thêm sản phẩm vào giỏ hàng
- PUT `/api/v1/cart/user/{userId}/items/{itemId}` - Cập nhật số lượng sản phẩm
- DELETE `/api/v1/cart/user/{userId}/items/{cartItemId}` - Xóa sản phẩm khỏi giỏ
- DELETE `/api/v1/cart/user/{userId}` - Xóa toàn bộ giỏ hàng
- POST `/api/v1/cart/merge` - Merge guest cart với user cart khi login

**Guest Cart Strategy**: Guest cart được lưu trong SessionStorage, khi login sẽ merge với database cart

### 5.6 Order Management

#### 📋 Customer Order APIs (Authenticated Users)
- GET `/api/v1/orders/user/{userId}` - Lấy lịch sử đơn hàng của user
- POST `/api/v1/orders/user/{userId}/from-cart` - Tạo đơn hàng từ giỏ hàng
- GET `/api/v1/orders/{id}` - Lấy chi tiết đơn hàng theo ID
- GET `/api/v1/orders/code/{orderCode}` - Tra cứu đơn hàng theo mã (public, không cần auth)
- PATCH `/api/v1/orders/{id}/cancel` - Hủy đơn hàng (Customer)

#### 🔧 Order Administration APIs (Staff/Admin)
- GET `/api/v1/orders` - Lấy tất cả đơn hàng (với filter theo status, date, user)
- GET `/api/v1/orders/status/{status}` - Lấy đơn hàng theo trạng thái
- PATCH `/api/v1/orders/{id}/status` - Cập nhật trạng thái đơn hàng (Staff/Admin)

### 5.7 Comments & Reviews Management

#### 💬 Public Comment APIs (All Users can read)
- GET `/api/v1/comments/product/{productId}` - Lấy bình luận theo sản phẩm
- GET `/api/v1/comments/{id}` - Lấy thông tin bình luận theo ID

#### ✍️ Comment Creation APIs (Authenticated Users)
- POST `/api/v1/comments/product/{productId}/user/{userId}` - Thêm bình luận sản phẩm
- POST `/api/v1/comments/{commentId}/reply/user/{userId}` - Reply bình luận
- PUT `/api/v1/comments/{id}` - Sửa bình luận của chính mình
- DELETE `/api/v1/comments/{id}` - Xóa bình luận (Owner/Staff/Admin)

### 5.8 Inventory Management (Staff/Admin Only)

#### 📊 Inventory Monitoring APIs
- GET `/api/v1/inventory/products` - Lấy danh sách tồn kho tất cả sản phẩm
- GET `/api/v1/inventory/products/{productId}` - Lấy thông tin tồn kho sản phẩm cụ thể
- GET `/api/v1/inventory/low-stock` - Sản phẩm sắp hết hàng (dưới threshold)
- GET `/api/v1/inventory/out-of-stock` - Sản phẩm hết hàng (quantity = 0)
- GET `/api/v1/inventory/need-restock` - Sản phẩm cần nhập hàng

#### 🔧 Inventory Control APIs  
- POST `/api/v1/inventory/products/{productId}/adjust` - Điều chỉnh tồn kho
- PUT `/api/v1/inventory/products/{productId}/threshold` - Cập nhật ngưỡng cảnh báo
- POST `/api/v1/inventory/products/{productId}/reserve` - Đặt trước số lượng (cho order)
- POST `/api/v1/inventory/products/{productId}/release` - Giải phóng số lượng đã đặt trước

#### 📈 Inventory Analytics APIs
- GET `/api/v1/inventory/logs` - Lịch sử nhập xuất kho (tất cả sản phẩm)
- GET `/api/v1/inventory/products/{productId}/logs` - Lịch sử của sản phẩm cụ thể
- GET `/api/v1/inventory/products/{productId}/availability` - Kiểm tra tình trạng có sẵn

### 5.9 Promotions & Discounts Management

#### 🎯 Public Promotion APIs (All Users)
- GET `/api/v1/promotions/active` - Lấy khuyến mãi đang hoạt động
- GET `/api/v1/promotions/applicable` - Lấy khuyến mãi áp dụng được (theo cart value)
- GET `/api/v1/promotions/best` - Lấy khuyến mãi tốt nhất cho giỏ hàng hiện tại
- GET `/api/v1/promotions/{id}/calculate-discount` - Tính toán mức giảm giá cụ thể
- GET `/api/v1/promotions/{id}/is-active` - Kiểm tra promotion có đang hoạt động
- GET `/api/v1/promotions/{id}/is-applicable` - Kiểm tra promotion có áp dụng được
- POST `/api/v1/promotions/validate` - Validate promotion code

#### 🔧 Promotion Administration APIs (Admin Only)
- GET `/api/v1/promotions` - Lấy tất cả promotions (Admin view)
- GET `/api/v1/promotions/{id}` - Lấy thông tin promotion theo ID
- GET `/api/v1/promotions/type/{discountType}` - Lấy promotions theo loại (PERCENTAGE/FIXED_AMOUNT)
- POST `/api/v1/promotions` - Tạo promotion mới
- PUT `/api/v1/promotions/{id}` - Cập nhật promotion
- DELETE `/api/v1/promotions/{id}` - Xóa promotion
- PUT `/api/v1/promotions/{id}/activate` - Kích hoạt promotion
- PUT `/api/v1/promotions/{id}/deactivate` - Vô hiệu hóa promotion

### 5.10 Build PC Feature (Frontend-Only)

**Build PC Feature**: Được implement hoàn toàn ở frontend, không có API endpoints riêng.
- Frontend sẽ sử dụng `GET /api/v1/products/category/{categoryId}` để lấy sản phẩm theo từng danh mục
- Tính toán tương thích, tổng tiền và xuất PDF hoàn toàn ở client-side
- Không lưu build configuration vào database (theo yêu cầu thiết kế)

---

### 📊 API Statistics Summary:
- **Tổng số API endpoints**: 73 APIs
- **Public APIs** (không cần auth): 18 APIs 
- **Customer APIs** (cần login): 25 APIs
- **Staff APIs** (Staff/Admin): 15 APIs  
- **Admin-only APIs**: 15 APIs
- **Đã tối ưu hóa từ thiết kế ban đầu**: +83% APIs để đáp ứng user experience tốt nhất

## 6. Bảo mật

### 6.1 Authentication & Authorization
- JWT (JSON Web Token) based authentication (lưu trong database, bảng tokens để revoke)
- Role-based access control với bảng roles riêng (ADMIN, STAFF, CUSTOMER)
- Password hashing với BCrypt
- JWT expiration (30 ngày) và revocation support
- Hỗ trợ multi-device (nhiều JWT tokens cho 1 user)
- UserController đảm nhận việc authentication (login, register, JWT token management)
- Phân quyền:
  - CUSTOMER: Mua hàng, bình luận, build PC
  - STAFF: Xem kho, reply bình luận, xem đơn hàng
  - ADMIN: Toàn quyền quản lý

**Lưu ý:** Sử dụng Spring Security với JWT cho authentication và authorization.

### 6.2 Validation
- Input validation trên cả frontend và backend
- CORS configuration
- Rate limiting cho API

## 7. Performance & Scalability

### 7.1 Database
- Indexing cho các trường tìm kiếm thường xuyên
- Connection pooling
- Query optimization

### 7.2 Caching
- Redis cho session management
- Browser caching cho static assets

## 8. Deployment

### 8.1 Development Environment
- Backend: Spring Boot với embedded Tomcat
- Frontend: Vite dev server
- Database: PostgreSQL local instance

### 8.2 Production Considerations
- Docker containerization
- Nginx reverse proxy
- SSL/TLS certificates