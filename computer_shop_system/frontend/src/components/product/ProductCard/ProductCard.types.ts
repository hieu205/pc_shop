/**
 * 🛍️ PRODUCT CARD TYPES - Computer Shop E-commerce
 * 
 * Simplified TypeScript definitions cho ProductCard component
 * Chỉ sử dụng backend ProductResponse data
 */

// Import backend types
import type { Product, Category } from '../../../types/product.types';

// ===== COMPONENT PROPS =====
export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
  onQuickView?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  className?: string;
  sx?: any;
}

// ===== RE-EXPORT BACKEND TYPES WITH ALIASES =====
export type ProductCardProduct = Product;
export type ProductCardCategory = Category;
