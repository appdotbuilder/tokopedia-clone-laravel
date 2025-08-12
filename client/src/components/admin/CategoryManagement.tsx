import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../../../server/src/schema';

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateCategoryInput>({
    name: '',
    description: null
  });

  const [editForm, setEditForm] = useState<Partial<UpdateCategoryInput>>({});

  const loadCategories = useCallback(async () => {
    try {
      // STUB: Using mock data since server handlers are placeholders
      const mockCategories: Category[] = [
        {
          id: 1,
          name: 'Electronics',
          description: 'Electronic devices and gadgets',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        {
          id: 2,
          name: 'Clothing',
          description: 'Fashion and apparel for all ages',
          created_at: new Date('2024-01-05'),
          updated_at: new Date('2024-01-05')
        },
        {
          id: 3,
          name: 'Home & Garden',
          description: 'Items for home decoration and gardening',
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        },
        {
          id: 4,
          name: 'Sports',
          description: null,
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        }
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // STUB: Using mock creation since server handlers are placeholders
      const newCategory: Category = {
        id: Math.max(...categories.map(c => c.id)) + 1,
        name: createForm.name,
        description: createForm.description ?? null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setCategories((prev: Category[]) => [...prev, newCategory]);
      setCreateForm({
        name: '',
        description: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      setError('Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // STUB: Using mock update since server handlers are placeholders
      const updatedCategory: Category = {
        ...editingCategory,
        name: editForm.name ?? editingCategory.name,
        description: editForm.description ?? editingCategory.description,
        updated_at: new Date()
      };

      setCategories((prev: Category[]) => 
        prev.map((category: Category) => 
          category.id === editingCategory.id ? updatedCategory : category
        )
      );
      setEditingCategory(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to update category:', error);
      setError('Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      // STUB: Using mock deletion since server handlers are placeholders
      setCategories((prev: Category[]) => prev.filter((category: Category) => category.id !== categoryId));
    } catch (error) {
      console.error('Failed to delete category:', error);
      setError('Failed to delete category');
    }
  };

  const filteredCategories = categories.filter((category: Category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading categories...</span>
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
              <CardTitle>🏷️ Category Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Organize products into categories
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add New Category</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Add a new product category to organize your inventory
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter category name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={createForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateForm((prev: CreateCategoryInput) => ({ ...prev, description: e.target.value || null }))
                      }
                      placeholder="Describe this category..."
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Category'}
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
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Badge variant="outline">
                {filteredCategories.length} categor{filteredCategories.length !== 1 ? 'ies' : 'y'}
              </Badge>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category: Category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="max-w-md">
                          {category.description ? (
                            <span className="text-sm text-gray-600">{category.description}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">No description</span>
                          )}
                        </TableCell>
                        <TableCell>{category.created_at.toLocaleDateString()}</TableCell>
                        <TableCell>{category.updated_at.toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setEditForm({
                                    id: category.id,
                                    name: category.name,
                                    description: category.description
                                  });
                                }}
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Category</DialogTitle>
                                <DialogDescription>
                                  Update category information
                                </DialogDescription>
                              </DialogHeader>
                              {editingCategory && (
                                <form onSubmit={handleUpdateCategory} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-name">Category Name</Label>
                                    <Input
                                      id="edit-name"
                                      value={editForm.name || ''}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setEditForm((prev: Partial<UpdateCategoryInput>) => ({ ...prev, name: e.target.value }))
                                      }
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                      id="edit-description"
                                      value={editForm.description || ''}
                                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                        setEditForm((prev: Partial<UpdateCategoryInput>) => ({ ...prev, description: e.target.value || null }))
                                      }
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex space-x-2 pt-4">
                                    <Button type="submit" disabled={isSubmitting}>
                                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setEditingCategory(null)}
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
                                  This will permanently delete the category "{category.name}" and may affect associated products.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCategory(category.id)}
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