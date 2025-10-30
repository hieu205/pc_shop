/**
 * 🏠 HOME PAGE - Computer Shop E-commerce
 * 
 * Trang chủ hiển thị:
 * - Hero section với banner quảng cáo
 * - Categories nổi bật (CPU, VGA, RAM, etc.)
 * - Sản phẩm bán chạy
 * - Sản phẩm mới
 * - Khuyến mãi đặc biệt
 * 
 * Tuân thủ SYSTEM_DESIGN.md specification
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Skeleton,
  useTheme,
} from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';

// Components
import { ProductGrid } from '../../components/product/ProductGrid';
// productCard used earlier removed in favor of ProductGrid
import { ProductSearch } from '../../components/product/ProductSearch';

// Services
import { productService } from '../../services/product.service';

// Types
import type { Product } from '../../types/product.types';

// Hooks
import { useAppDispatch } from '../../store';
import { useCart } from '../../hooks/useCart';
import { useSnackbar } from '../../hooks/useSnackbar';

// ===== MOCK DATA (tạm thời để test UI) =====
const FEATURED_CATEGORIES = [
  {
    id: 1,
    name: 'CPU - Bộ vi xử lý',
    icon: ComputerIcon,
    description: 'Intel, AMD - Hiệu năng cao',
    productCount: 150,
    imageUrl: '/images/categories/cpu.jpg',
  },
  {
    id: 2,
    name: 'VGA - Card đồ họa',
    icon: ComputerIcon,
    description: 'NVIDIA RTX, AMD Radeon',
    productCount: 89,
    imageUrl: '/images/categories/vga.jpg',
  },
  {
    id: 3,
    name: 'RAM - Bộ nhớ',
    icon: MemoryIcon,
    description: 'DDR4, DDR5 - Gaming, Workstation',
    productCount: 200,
    imageUrl: '/images/categories/ram.jpg',
  },
  {
    id: 4,
    name: 'SSD - Ổ cứng',
    icon: StorageIcon,
    description: 'NVMe, SATA - Tốc độ cao',
    productCount: 120,
    imageUrl: '/images/categories/ssd.jpg',
  },
];

// ===== MAIN COMPONENT =====
export const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { showSuccess, showError } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== EFFECTS =====
  useEffect(() => {
  const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
    const response = await productService.getAllProducts({ size: 24 }); // Lấy 24 sản phẩm cho trang chủ
    setProducts(response.content || []);
      } catch (error) {
        console.error('Lỗi fetch featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, [dispatch]);

  // ===== EVENT HANDLERS =====
  const handleSearch = (query: string) => {
    const q = query?.trim() || '';
    setSearchQuery(q);
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/products');
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    // Navigate to products page. If categoryId > 0, add category query param.
    if (categoryId && Number(categoryId) > 0) {
      navigate(`/products?category=${categoryId}`);
    } else {
      navigate('/products');
    }
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = async (product: Product, quantity: number) => {
    try {
      await addItem(product, quantity);
      showSuccess(`Đã thêm ${product.name} vào giỏ hàng`);
    } catch (error) {
      showError('Không thể thêm sản phẩm vào giỏ hàng');
    }
  };

  // ===== RENDER METHODS =====
  const renderHeroSection = () => (
    <Box
      sx={{
        bgcolor: 'primary.main',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        py: 8,
        mb: 6,
        borderRadius: 2,
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 1fr',
            },
            gap: 4,
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Computer Shop
            </Typography>
            <Typography variant="h5" paragraph sx={{ opacity: 0.9 }}>
              Linh kiện máy tính chính hãng - Giá tốt nhất thị trường
            </Typography>
            <Typography variant="body1" paragraph sx={{ opacity: 0.8, mb: 4 }}>
              CPU, VGA, RAM, Mainboard, PSU và tất cả linh kiện cho PC Gaming, Workstation
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => handleCategoryClick(0)}
              >
                Xem sản phẩm
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Build PC
              </Button>
            </Stack>
          </Box>
          <Box>
            <Box
              sx={{
                width: '100%',
                height: 300,
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" sx={{ opacity: 0.7 }}>
                [Hero Image/Banner]
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );

  const renderSearchSection = () => (
    <Container maxWidth="md" sx={{ mb: 6 }}>
      <ProductSearch
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        placeholder="Tìm kiếm CPU, VGA, RAM, SSD..."
      />
    </Container>
  );

  const renderFeaturedCategories = () => (
    <Container maxWidth="lg" sx={{ mb: 6 }}>
      <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Danh mục nổi bật
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        {FEATURED_CATEGORIES.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card
              key={category.id}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => handleCategoryClick(category.id)}
            >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <IconComponent sx={{ fontSize: 30, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {category.description}
                  </Typography>
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                    {category.productCount} sản phẩm
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
    </Container>
  );

  const renderFeaturedProducts = () => (
    <Container maxWidth="lg" sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
          Sản phẩm nổi bật
        </Typography>
        <Button variant="outlined" onClick={() => handleCategoryClick(0)}>
          Xem tất cả
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 3 }}>
          {Array.from({ length: 24 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={360} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      ) : (
        <ProductGrid
          products={products}
          onProductClick={handleProductClick}
          onAddToCart={handleAddToCart}
          loading={loading}
        />
      )}
    </Container>
  );

  // ===== MAIN RENDER =====
  return (
    <Box>
      {renderHeroSection()}
      {renderSearchSection()}
      {renderFeaturedCategories()}
      {renderFeaturedProducts()}
    </Box>
  );
};

export default HomePage;
