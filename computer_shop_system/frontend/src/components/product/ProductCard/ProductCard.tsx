/**
 * 🛍️ PRODUCT CARD COMPONENT - Computer Shop E-commerce
 * 
 * Simplified ProductCard sử dụng chỉ backend ProductResponse data
 * Tuân thủ SYSTEM_DESIGN.md và backend DTOs
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Stack,
} from '@mui/material';
// Import icons from their individual entry points to avoid pulling the entire icon bundle
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Types - chỉ sử dụng backend Product
import type { Product } from '../../../types/product.types';
import { buildImageUrl } from '../../../utils/urlHelpers';

// ===== INTERFACES =====
export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
  onQuickView?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  className?: string;
  sx?: any;
}

// ===== HELPER FUNCTIONS =====
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const getImageUrl = (product: Product): string => {
  // Prefer primary image from product.images if available
  const primary = product.images?.find((i) => i.is_primary);
  const path = primary?.file_path || product.image_url;
  return buildImageUrl(path);
};

// Optional image resize helper: for image hosts that accept width query param (e.g., ?w=300)
const buildResizedImage = (url: string, width: number) => {
  try {
    const u = new URL(url, window.location.origin);
    // Only append for same-origin or common CDN patterns; conservative check: hostname contains 'cdn' or same host
    if (u.hostname === window.location.hostname || u.hostname.includes('cdn') || u.hostname.includes('images')) {
      u.searchParams.set('w', String(Math.round(width)));
      return u.toString();
    }
  } catch (e) {
    // ignore
  }
  return url;
};

const getStockStatus = (product: Product) => {
  if (product.quantity === 0) {
    return { status: 'out_of_stock', color: 'error', text: 'Hết hàng' };
  }
  if (product.quantity <= product.low_stock_threshold) {
    return { status: 'low_stock', color: 'warning', text: `Còn ${product.quantity}` };
  }
  return { status: 'in_stock', color: 'success', text: 'Còn hàng' };
};

// ===== MAIN COMPONENT =====
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView,
  onProductClick,
  className,
  sx,
}) => {
  // quantity state moved to cart page; grid adds 1 on Add to Cart
  const [isAdding, setIsAdding] = useState(false);
  
  const stockInfo = getStockStatus(product);
  // maxQuantity not needed in grid
  
  // ===== HANDLERS =====
  // handleAddToCart removed - grid uses inline handler that always adds 1 unit
  
  const handleProductClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };
  
  const handleQuickView = (event: React.MouseEvent) => {
    event.stopPropagation(); // Ngăn event bubbling
    if (onQuickView) {
      onQuickView(product);
    }
  };
  
  // Quantity controls removed from grid cards; quantity adjusted in Cart page
  
  // ===== RENDER =====
  return (
  <Card
      className={className}
      onClick={handleProductClick}
      sx={{
    height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        cursor: onProductClick ? 'pointer' : 'default',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        opacity: product.is_active ? 1 : 0.6,
        ...sx,
      }}
    >
      {/* Product Image - enforce 3:2 height-to-width via padding-top trick (150%) */}
      <Box sx={{ position: 'relative', width: '100%', pt: '100%', overflow: 'hidden', bgcolor: 'grey.100' }}>
        {/* Memoize image URL to avoid recomputing on every render */}
        {/* Use native lazy loading and async decoding to reduce main-thread work */}
        {/* buildResizedImage is pure and cheap, but we still memoize based on product image fields */}
        {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
        {(() => {
          const imageUrl = buildResizedImage(getImageUrl(product), 260);
          return (
            <Box
              component="img"
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          );
        })()}
        
        {/* Stock Status Badge */}
        <Chip
          label={stockInfo.text}
          color={stockInfo.color as any}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: '0.75rem',
          }}
        />
        
  {/* Quick View Button */}
        {onQuickView && (
            <IconButton
            onClick={handleQuickView}
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                backgroundColor: 'white',
              },
            }}
            size="small"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Product Content */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Category */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, textTransform: 'uppercase' }}
        >
          {product.category.name}
        </Typography>

        {/* Product Name */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            mb: 1,
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </Typography>

        {/* Key Specifications */}
        {product.specifications?.brand && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Thương hiệu: {product.specifications.brand}
          </Typography>
        )}

        {/* Price */}
        <Typography
          variant="h6"
          color="primary"
          sx={{
            fontWeight: 700,
            fontSize: '1.25rem',
            mt: 'auto',
            mb: 2,
          }}
        >
          {formatPrice(product.price)}
        </Typography>

        {/* Actions - simplified: no quantity selector in grid, only Add to Cart (quantity managed in cart) */}
        <Stack spacing={1} sx={{ mt: 'auto' }}>
            <Button
            variant="contained"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              // Always add 1 unit from the grid view
              if (onAddToCart && product.quantity > 0) {
                setIsAdding(true);
                onAddToCart(product, 1);
                setTimeout(() => setIsAdding(false), 500);
              }
            }}
            disabled={product.quantity === 0 || !product.is_active || isAdding}
            startIcon={<ShoppingCartIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              transition: 'all 0.3s ease-in-out',
              transform: isAdding ? 'scale(0.95)' : 'scale(1)',
              backgroundColor: isAdding ? 'success.main' : 'primary.main',
              '&:hover': {
                backgroundColor: isAdding ? 'success.dark' : 'primary.dark',
                transform: isAdding ? 'scale(0.95)' : 'scale(1.02)',
              },
              '&:disabled': {
                transform: 'scale(1)',
              }
            }}
          >
            {isAdding ? '✓ Đã thêm!' : (product.quantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default React.memo(ProductCard);
