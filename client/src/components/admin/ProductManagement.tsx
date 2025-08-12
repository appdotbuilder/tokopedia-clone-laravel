import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Product, CreateProductInput, UpdateProductInput, Category } from '../../../../server/src/schema';

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateProductInput>({
    name: '',
    code: '',
    description: null,
    price: 0,
    stock: 0,
    category_id: 1,
    image: null
  });

  const [editForm, setEditForm] = useState<Partial<UpdateProductInput>>({});

  const loadData = useCallback(async () => {
    try {
      // STUB: Using mock data since server handlers are placeholders
      const mockCategories: Category[] = [
        { id: 1, name: 'Electronics', description: 'Electronic devices', created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'Clothing', description: 'Fashion items', created_at: new Date(), updated_at: new Date() },
        { id: 3, name: 'Home & Garden', description: 'Home items', created_at: new Date(), updated_at: new Date() }
      ];

      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Gaming Laptop',
          code: 'LAPTOP001',
          description: 'High-performance gaming laptop with RTX graphics',
          price: 1299.99,
          stock: 15,
          category_id: 1,
          image: null,
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: 2,
          name: 'Wireless Mouse',
          code: 'MOUSE001',
          description: 'Ergonomic wireless mouse with RGB lighting',
          price: 49.99,
          stock: 50,
          category_id: 1,
          image: null,
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-01-20')
        },
        {
          id: 3,
          name: 'Cotton T-Shirt',
          code: 'TSHIRT001',
          description: null,
          price: 19.99,
          stock: 100,
          category_id: 2,
          image: null,
          created_at: new Date('2024-02-01'),
          updated_at: new Date('2024-02-01')
        },
        {
          id: 4,
          name: 'Smart Watch',
          code: 'WATCH001',
          description: 'Fitness tracking smartwatch with heart rate monitor',
          price: 199.99,
          stock: 3, // Low stock example
          category_id: 1,
          image: null,
          created_at: new Date('2024-02-05'),
          updated_at: new Date('2024-02-05')
        }
      ];

      setCategories(mockCategories);
      setProducts(mockProducts);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // STUB: Using mock creation since server handlers are placeholders
      const newProduct: Product = {
        id: Math.max(...products.map(p => p.id)) + 1,
        name: createForm.name,
        code: createForm.code,
        description: createForm.description ?? null,
        price: createForm.price,
        stock: createForm.stock,
        category_id: createForm.category_id,
        image: createForm.image ?? null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setProducts((prev: Product[]) => [...prev, newProduct]);
      setCreateForm({
        name: '',
        code: '',
        description: null,
        price: 0,
        stock: 0,
        category_id: 1,
        image: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create product:', error);
      setError('Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // STUB: Using mock update since server handlers are placeholders
      const updatedProduct: Product = {
        ...editingProduct,
        name: editForm.name ?? editingProduct.name,
        code: editForm.code ?? editingProduct.code,
        description: editForm.description ?? editingProduct.description,
        price: editForm.price ?? editingProduct.price,
        stock: editForm.stock ?? editingProduct.stock,
        category_id: editForm.category_id ?? editingProduct.category_id,
        image: editForm.image ?? editingProduct.image,
        updated_at: new Date()
      };

      setProducts((prev: Product[]) => 
        prev.map((product: Product) => 
          product.id === editingProduct.id ? updatedProduct : product
        )
      );
      setEditingProduct(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to update product:', error);
      setError('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      // STUB: Using mock deletion since server handlers are placeholders
      setProducts((prev: Product[]) => prev.filter((product: Product) => product.id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
      setError('Failed to delete product');
    }
  };

  const getCategoryName = (categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === null || product.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading products...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>📦 Product Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your product inventory
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add New Product</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Product</DialogTitle>
                  <DialogDescription>
                    Add a new product to your inventory
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={createForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateForm((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="code">Product Code</Label>
                      <Input
                        id="code"
                        value={createForm.code}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateForm((prev: CreateProductInput) => ({ ...prev, code: e.target.value }))
                        }
                        placeholder="Enter unique product code"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={createForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateForm((prev: CreateProductInput) => ({ ...prev, description: e.target.value || null }))
                      }
                      placeholder="Describe the product..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={createForm.price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateForm((prev: CreateProductInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={createForm.stock}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateForm((prev: CreateProductInput) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={createForm.category_id.toString()}
                        onValueChange={(value: string) =>
                          setCreateForm((prev: CreateProductInput) => ({ ...prev, category_id: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL (Optional)</Label>
                    <Input
                      id="image"
                      value={createForm.image || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreateProductInput) => ({ ...prev, image: e.target.value || null }))
                      }
                      placeholder="Enter image URL"
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Product'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select
                  value={selectedCategory?.toString() || 'all'}
                  onValueChange={(value: string) => setSelectedCategory(value === 'all' ? null : parseInt(value))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product: Product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="font-mono text-sm">{product.code}</TableCell>
                        <TableCell>{getCategoryName(product.category_id)}</TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={product.stock <= 5 ? 'destructive' : product.stock <= 20 ? 'default' : 'secondary'}
                          >
                            {product.stock === 0 ? 'Out of Stock' : 
                             product.stock <= 5 ? 'Low Stock' : 
                             product.stock <= 20 ? 'Medium Stock' : 'In Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingProduct(product);
                                  setEditForm({
                                    id: product.id,
                                    name: product.name,
                                    code: product.code,
                                    description: product.description,
                                    price: product.price,
                                    stock: product.stock,
                                    category_id: product.category_id,
                                    image: product.image
                                  });
                                }}
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                                <DialogDescription>
                                  Update product information
                                </DialogDescription>
                              </DialogHeader>
                              {editingProduct && (
                                <form onSubmit={handleUpdateProduct} className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-name">Product Name</Label>
                                      <Input
                                        id="edit-name"
                                        value={editForm.name || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          setEditForm((prev: Partial<UpdateProductInput>) => ({ ...prev, name: e.target.value }))
                                        }
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-code">Product Code</Label>
                                      <Input
                                        id="edit-code"
                                        value={editForm.code || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          setEditForm((prev: Partial<UpdateProductInput>) => ({ ...prev, code: e.target.value }))
                                        }
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-price">Price ($)</Label>
                                      <Input
                                        id="edit-price"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={editForm.price || 0}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          setEditForm((prev: Partial<UpdateProductInput>) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                                        }
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="edit-stock">Stock</Label>
                                      <Input
                                        id="edit-stock"
                                        type="number"
                                        min="0"
                                        value={editForm.stock || 0}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          setEditForm((prev: Partial<UpdateProductInput>) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))
                                        }
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="edit-category">Category</Label>
                                      <Select
                                        value={editForm.category_id?.toString() || '1'}
                                        onValueChange={(value: string) =>
                                          setEditForm((prev: Partial<UpdateProductInput>) => ({ ...prev, category_id: parseInt(value) }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {categories.map((category: Category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                              {category.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="flex space-x-2 pt-4">
                                    <Button type="submit" disabled={isSubmitting}>
                                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setEditingProduct(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </form>
                              )}
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the product "{product.name}" from your inventory.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}