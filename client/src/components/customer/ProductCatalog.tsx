import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { User, Product, Category, AddToCartInput } from '../../../../server/src/schema';

interface ProductCatalogProps {
  user: User;
  onCartUpdate: (count: number) => void;
}

export default function ProductCatalog({ user, onCartUpdate }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 2000 });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      // STUB: Using mock data since server handlers are placeholders
      const mockCategories: Category[] = [
        { id: 1, name: 'Electronics', description: 'Electronic devices', created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'Clothing', description: 'Fashion items', created_at: new Date(), updated_at: new Date() },
        { id: 3, name: 'Home & Garden', description: 'Home items', created_at: new Date(), updated_at: new Date() },
        { id: 4, name: 'Sports', description: 'Sports equipment', created_at: new Date(), updated_at: new Date() }
      ];

      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Gaming Laptop',
          code: 'LAPTOP001',
          description: 'High-performance gaming laptop with RTX 4060 graphics card, 16GB RAM, and 1TB SSD. Perfect for gaming, content creation, and professional work.',
          price: 1299.99,
          stock: 15,
          category_id: 1,
          image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: 2,
          name: 'Wireless Gaming Mouse',
          code: 'MOUSE001',
          description: 'Ergonomic wireless gaming mouse with RGB lighting, programmable buttons, and precision sensor for competitive gaming.',
          price: 49.99,
          stock: 50,
          category_id: 1,
          image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-01-20')
        },
        {
          id: 3,
          name: 'Cotton T-Shirt',
          code: 'TSHIRT001',
          description: 'Premium 100% organic cotton t-shirt available in multiple colors. Comfortable fit and durable construction.',
          price: 19.99,
          stock: 100,
          category_id: 2,
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
          created_at: new Date('2024-02-01'),
          updated_at: new Date('2024-02-01')
        },
        {
          id: 4,
          name: 'Smart Watch',
          code: 'WATCH001',
          description: 'Advanced fitness tracking smartwatch with heart rate monitor, GPS, water resistance, and 7-day battery life.',
          price: 199.99,
          stock: 25,
          category_id: 1,
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          created_at: new Date('2024-02-05'),
          updated_at: new Date('2024-02-05')
        },
        {
          id: 5,
          name: 'Yoga Mat',
          code: 'YOGA001',
          description: 'Non-slip eco-friendly yoga mat made from natural rubber. 6mm thick for extra comfort and joint protection.',
          price: 39.99,
          stock: 30,
          category_id: 4,
          image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
          created_at: new Date('2024-02-08'),
          updated_at: new Date('2024-02-08')
        },
        {
          id: 6,
          name: 'Coffee Maker',
          code: 'COFFEE001',
          description: 'Programmable drip coffee maker with thermal carafe, 12-cup capacity, and auto-brew timer.',
          price: 79.99,
          stock: 20,
          category_id: 3,
          image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
          created_at: new Date('2024-02-10'),
          updated_at: new Date('2024-02-10')
        }
      ];

      setCategories(mockCategories);
      setProducts(mockProducts);
      setCartCount(3); // Mock cart count
      onCartUpdate(3);
    } catch (error) {
      console.error('Failed to load products:', error);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [onCartUpdate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    try {
      // STUB: Using mock cart addition since server handlers are placeholders
      const addToCartData: AddToCartInput = {
        user_id: user.id,
        product_id: product.id,
        quantity: quantity
      };

      // Mock successful addition
      const newCartCount = cartCount + quantity;
      setCartCount(newCartCount);
      onCartUpdate(newCartCount);
      
      // Show success feedback (you could add a toast notification here)
      console.log(`Added ${quantity} ${product.name} to cart`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setError('Failed to add item to cart');
    }
  };

  const getCategoryName = (categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === null || product.category_id === selectedCategory;
    const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2">Loading products...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={selectedCategory?.toString() || 'all'}
                onValueChange={(value: string) => setSelectedCategory(value === 'all' ? null : parseInt(value))}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Price Range:</span>
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPriceRange((prev: { min: number; max: number }) => ({ ...prev, min: parseInt(e.target.value) || 0 }))
                  }
                  className="w-20"
                />
                <span>-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPriceRange((prev: { min: number; max: number }) => ({ ...prev, max: parseInt(e.target.value) || 2000 }))
                  }
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Display */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center p-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredProducts.map((product: Product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(product.category_id)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            ${product.price.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedProduct(product)}>
                                Details
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex p-4 gap-4">
                    <div className="w-24 h-24 overflow-hidden rounded-lg flex-shrink-0">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(product.category_id)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xl font-bold text-green-600">
                            ${product.price.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedProduct(product)}>
                                Details
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
              <DialogDescription>
                {getCategoryName(selectedProduct.category_id)} • Code: {selectedProduct.code}
              </DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-square overflow-hidden rounded-lg">
                <img
                  src={selectedProduct.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600'}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct.description || 'No description available.'}
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Price:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${selectedProduct.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Availability:</span>
                    <span className={selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                      {selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Category:</span>
                    <Badge variant="outline">
                      {getCategoryName(selectedProduct.category_id)}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.stock === 0}
                  >
                    {selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}