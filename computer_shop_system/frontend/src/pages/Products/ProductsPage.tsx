/**
 * 🛍️ PRODUCTS PAGE - Computer Shop E-commerce
 * 
 * Trang chính hiển thị danh sách sản phẩm với filtering, search, pagination
 * Tuân thủ SYSTEM_DESIGN.md và backend Product DTOs
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';

// Types - sử dụng backend Product types
import type { Product, ProductFilter } from '../../types/product.types';

// Services
import { productService } from '../../services/product.service';
import { categoryService } from '../../services/category.service';
// Components
import { ProductGrid } from '../../components/product/ProductGrid';
import { ProductFilters } from '../../components/product/ProductFilters';
import { ProductSearch } from '../../components/product/ProductSearch';

// categories are handled server-side; no local fetch required for sidebar

// Hooks
import { useDebounce } from '../../hooks/useDebounce';
import { useCart } from '../../hooks/useCart';
import { useSnackbar } from '../../hooks/useSnackbar';

// ===== MAIN COMPONENT =====
export const ProductsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();
  const { addItem } = useCart();
  const { showSuccess, showError } = useSnackbar();

  // ===== STATE =====
  const [products, setProducts] = useState<Product[]>([]);
  // pagination state (UI uses 1-based page)
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(24); // fixed by requirement
  const [totalPages, setTotalPages] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<ProductFilter>({
    category_ids: [],
    brands: [],
    min_price: 0,
    max_price: 50000000,
    search: '',
    in_stock: false
  });
  const [resolvedCategoryId, setResolvedCategoryId] = useState<number | null>(null);

  // Keep searchQuery in sync with URL `search` param so header search (which navigates)
  // and in-page search stay consistent and shareable.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('search') || '';
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
    // reset to first page when URL search changes
    setPage(1);
  }, [location.search]);

  // Resolve category ID from pretty slug path `/products/:slug` (footer links)
  useEffect(() => {
    let mounted = true;
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const SLUG_SYNONYMS: Record<string, string[]> = {
      cpu: ['processor', 'bo vi xu ly'],
      vga: ['gpu', 'card do hoa', 'card man hinh', 'do hoa'],
      ram: ['memory', 'bo nho'],
      mainboard: ['motherboard', 'bo mach chu', 'mb'],
      psu: ['nguon', 'power supply', 'nguon may tinh'],
      storage: ['ssd', 'hdd', 'o cung', 'o dia'],
    };
    (async () => {
      if (!slug) {
        if (mounted) setResolvedCategoryId(null);
        return;
      }
      try {
        const want = normalize(slug);
        const synonyms = SLUG_SYNONYMS[want] || [];
        const targets = [want, ...synonyms.map(normalize)];
        const cats = await categoryService.getCategories();
        const bySlug = cats.find((c) => c.slug && normalize(c.slug) === want);
        let id = bySlug?.id ?? null;
        if (!id) {
          const byName = cats.find((c) => targets.some((t) => normalize(c.name).includes(t)));
          id = byName?.id ?? null;
        }
        if (mounted) setResolvedCategoryId(id);
      } catch {
        if (mounted) setResolvedCategoryId(null);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  // ===== DEBOUNCED SEARCH =====
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Note: product fetching is handled by the main effect below which includes
  // sortBy and inStockOnly so sorting/filtering always take effect.

  // ===== FILTERED PRODUCTS (apply only client-side filters like category/price/brand) =====
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by categories
    // If the page was loaded with a `category` query param, the server already
    // returned products for that category and its child categories. In that
    // case, avoid applying the client-side category_ids filter which would
    // incorrectly remove products whose `product.category.id` is a child id.
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (!(categoryParam && categoryParam.trim() !== '')) {
      if (filterState.category_ids && filterState.category_ids.length > 0) {
        result = result.filter(product => filterState.category_ids!.includes(product.category.id));
      }
    }

    // Filter by brands
    if (filterState.brands && filterState.brands.length > 0) {
      result = result.filter(product => filterState.brands!.includes(String(product.specifications.brand || '')));
    }

    // Filter by price range
    const minPrice = filterState.min_price || 0;
    const maxPrice = filterState.max_price || 50000000;
    result = result.filter(product => product.price >= minPrice && product.price <= maxPrice);

    // Filter by stock
    if (filterState.in_stock) {
      result = result.filter(product => product.quantity > 0);
    }

    return result;
  }, [products, filterState]);

  // ===== HANDLERS =====
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value);
  };

  const handleInStockToggle = (_event: any, value: string | null) => {
    const v = Boolean(value);
    setInStockOnly(v);
    // reflect to filterState for UI consistency
    setFilterState((prev) => ({ ...prev, in_stock: v }));
  };

  const handleFiltersChange = (newFilters: ProductFilter) => {
    setFilterState(newFilters);
  };

  // Submit search: update URL so header/home searches and page are shareable
  const handleSearchSubmit = (query: string) => {
    const q = query?.trim() || '';
    setSearchQuery(q);
    setPage(1);
    if (q) navigate(`/products?search=${encodeURIComponent(q)}`);
    else navigate('/products');
  };

  // ===== Product Actions =====
  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = async (product: Product, quantity: number) => {
    try {
      await addItem(product, quantity);
      showSuccess(`Đã thêm ${product.name} vào giỏ hàng`);
    } catch (err) {
      showError('Không thể thêm sản phẩm vào giỏ hàng');
    }
  };

  // ===== FETCH CATEGORIES ON MOUNT =====
  useEffect(() => {
    let mounted = true;

    const runFetch = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');

        // Build params object with sort and in_stock if applicable
        // NOTE:
        // - /api/v1/products expects sortBy & sortDirection (custom params)
        // - /api/v1/products/search and /api/v1/products/category/{id} use Spring Pageable 'sort=field,dir'
        // To support all endpoints consistently, we send BOTH when applicable.
        const sortMapping: Record<string, { sort: string; sortBy: string; sortDirection: 'asc' | 'desc' } | undefined> = {
          relevance: undefined,
          price_asc: { sort: 'price,asc', sortBy: 'price', sortDirection: 'asc' },
          price_desc: { sort: 'price,desc', sortBy: 'price', sortDirection: 'desc' },
          // Backend sorting uses entity property names (camelCase)
          newest: { sort: 'createdAt,desc', sortBy: 'createdAt', sortDirection: 'desc' },
        };
        const sortCfg = sortMapping[sortBy];

        const baseParams: any = { page: Math.max(0, page - 1), size: pageSize };
        if (sortCfg) {
          baseParams.sort = sortCfg.sort; // for Pageable-based endpoints (search/category)
          baseParams.sortBy = sortCfg.sortBy; // for /products endpoint
          baseParams.sortDirection = sortCfg.sortDirection; // for /products endpoint
        }
        if (inStockOnly) {
          baseParams.in_stock = true; // frontend filter naming (used elsewhere)
          baseParams.inStock = true;  // backend expects camelCase on /products
        }

        // Fetch total count for paging (public endpoint)
        let totalCount = 0;
        try {
          totalCount = await productService.getProductCount();
        } catch (err) {
          console.warn('Failed to fetch product count, falling back to server page meta');
        }

        // Determine active category: URL query `?category=ID` takes precedence, otherwise use resolvedCategoryId from slug path
        const effectiveCategoryId = categoryParam ? Number(categoryParam) : (resolvedCategoryId ?? undefined);

        if (effectiveCategoryId) {
          const catId = effectiveCategoryId;
          // Use the category-specific endpoint to avoid sending a List parameter that
          // some local backend builds may not bind correctly. This calls GET /products/category/{id}
          const resp = await productService.getProductsByCategory(catId, {
            ...baseParams,
          });
          if (!mounted) return;
          setProducts(resp.content || []);
          if (resp.totalPages) {
            setTotalPages(resp.totalPages || 1);
          } else if (totalCount > 0) {
            setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
          } else {
            setTotalPages(1);
          }
          setFilterState((prev) => ({ ...prev, category_ids: [catId] }));
        } else {
          // prefer URL `search` param when present so header searches navigate correctly
          const urlSearch = params.get('search') || '';
          const activeSearch = urlSearch && urlSearch.trim() !== '' ? urlSearch.trim() : (debouncedSearchQuery && debouncedSearchQuery.trim() !== '' ? debouncedSearchQuery.trim() : '');

          if (activeSearch) {
            // Use general /products endpoint with search + sorting to ensure sort applies consistently
            const resp = await productService.getAllProducts({
              ...baseParams,
              search: activeSearch,
            } as any);
            if (!mounted) return;
            setProducts(resp.content || []);
            if (resp.totalPages) {
              setTotalPages(resp.totalPages || 1);
            } else if (totalCount > 0) {
              setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
            } else {
              setTotalPages(1);
            }
            setFilterState((prev) => ({ ...prev, search: activeSearch }));
          } else {
            const resp = await productService.getAllProducts(baseParams);
            if (!mounted) return;
            setProducts(resp.content || []);
            if (resp.totalPages) {
              setTotalPages(resp.totalPages || 1);
            } else if (totalCount > 0) {
              setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
            } else {
              setTotalPages(1);
            }
            setFilterState((prev) => ({ ...prev, category_ids: [] }));
          }
        }
      } catch (err) {
        console.error('Products fetch error:', err);
        if (!mounted) return;
        setError('Không thể tải sản phẩm. Vui lòng thử lại.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    runFetch();

    return () => { mounted = false; };
  }, [debouncedSearchQuery, location.search, sortBy, inStockOnly, page, pageSize, resolvedCategoryId]);



  // ===== RENDER =====
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            textAlign: 'center'
          }}
        >
          Sản Phẩm
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto' }}
        >
          Khám phá bộ sưu tập linh kiện máy tính chất lượng cao với giá cả cạnh tranh
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <ProductSearch
          value={searchQuery}
          onChange={handleSearchChange}
          onSearch={handleSearchSubmit}
          placeholder="Tìm kiếm sản phẩm..."
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Filters Sidebar */}
        <Box sx={{ width: 280, flexShrink: 0 }}>
          <ProductFilters
            filters={filterState}
            maxPrice={150000000}
            onFiltersChange={handleFiltersChange}
            onReset={() => setFilterState({
              category_ids: [],
              brands: [],
              min_price: 0,
              max_price: 150000000,
              search: '',
              in_stock: false
            })}
          />
        </Box>

        {/* Products Grid */}
        <Box sx={{ flex: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              {/* disableShrink avoids stroke-dasharray/dashoffset animations that block compositor */}
              <CircularProgress size={48} disableShrink />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="error" variant="h6" gutterBottom>
                {error}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{ mt: 2 }}
              >
                Thử lại
              </Button>
            </Box>
          ) : (
            <>
              {/* Controls row */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Hiển thị {filteredProducts.length} trên trang {page}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl size="small">
                    <InputLabel id="sort-label">Sắp xếp</InputLabel>
                    <Select labelId="sort-label" value={sortBy} label="Sắp xếp" onChange={handleSortChange}>
                      <MenuItem value="relevance">Phù hợp nhất</MenuItem>
                      <MenuItem value="price_asc">Giá: thấp → cao</MenuItem>
                      <MenuItem value="price_desc">Giá: cao → thấp</MenuItem>
                      <MenuItem value="newest">Hàng mới</MenuItem>
                    </Select>
                  </FormControl>
                  <ToggleButtonGroup
                    value={inStockOnly ? 'in_stock' : null}
                    exclusive
                    onChange={handleInStockToggle}
                    size="small"
                  >
                    <ToggleButton value="in_stock">Sẵn hàng</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>

              {/* Products Grid */}
              <ProductGrid
                products={filteredProducts}
                loading={loading}
                error={error || undefined}
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
              />
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ProductsPage;
