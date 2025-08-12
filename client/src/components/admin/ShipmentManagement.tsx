import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { Shipment, ShipmentStatus, CreateShipmentInput, UpdateShipmentInput } from '../../../../server/src/schema';

interface ShipmentWithOrder extends Shipment {
  order_number: string;
  customer_name: string;
}

export default function ShipmentManagement() {
  const [shipments, setShipments] = useState<ShipmentWithOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<ShipmentWithOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateShipmentInput>({
    order_id: 1,
    courier: '',
    cost: 0,
    estimated_delivery: null
  });

  const [editForm, setEditForm] = useState<Partial<UpdateShipmentInput>>({});

  const loadShipments = useCallback(async () => {
    try {
      // STUB: Using mock data since server handlers are placeholders
      const mockShipments: ShipmentWithOrder[] = [
        {
          id: 1,
          order_id: 3,
          order_number: '#0003',
          customer_name: 'John Doe',
          courier: 'Express Courier',
          tracking_number: 'EXP123456789',
          cost: 12.00,
          status: 'in_transit',
          estimated_delivery: new Date('2024-02-20'),
          delivered_at: null,
          created_at: new Date('2024-02-13T11:20:00'),
          updated_at: new Date('2024-02-14T09:30:00')
        },
        {
          id: 2,
          order_id: 4,
          order_number: '#0004',
          customer_name: 'Mike Johnson',
          courier: 'Standard Shipping',
          tracking_number: 'STD987654321',
          cost: 10.00,
          status: 'delivered',
          estimated_delivery: new Date('2024-02-15'),
          delivered_at: new Date('2024-02-12T16:30:00'),
          created_at: new Date('2024-02-11T14:00:00'),
          updated_at: new Date('2024-02-12T16:30:00')
        },
        {
          id: 3,
          order_id: 2,
          order_number: '#0002',
          customer_name: 'Jane Smith',
          courier: 'Fast Delivery',
          tracking_number: null,
          cost: 8.50,
          status: 'pending',
          estimated_delivery: new Date('2024-02-22'),
          delivered_at: null,
          created_at: new Date('2024-02-16T10:15:00'),
          updated_at: new Date('2024-02-16T10:15:00')
        }
      ];
      setShipments(mockShipments);
    } catch (error) {
      console.error('Failed to load shipments:', error);
      setError('Failed to load shipments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // STUB: Using mock creation since server handlers are placeholders
      const newShipment: ShipmentWithOrder = {
        id: Math.max(...shipments.map(s => s.id)) + 1,
        order_id: createForm.order_id,
        courier: createForm.courier,
        cost: createForm.cost,
        estimated_delivery: createForm.estimated_delivery ?? null,
        order_number: `#${createForm.order_id.toString().padStart(4, '0')}`,
        customer_name: 'New Customer',
        tracking_number: null,
        status: 'pending',
        delivered_at: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setShipments((prev: ShipmentWithOrder[]) => [...prev, newShipment]);
      setCreateForm({
        order_id: 1,
        courier: '',
        cost: 0,
        estimated_delivery: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create shipment:', error);
      setError('Failed to create shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // STUB: Using mock update since server handlers are placeholders
      const updatedShipment: ShipmentWithOrder = {
        ...editingShipment,
        tracking_number: editForm.tracking_number ?? editingShipment.tracking_number,
        status: editForm.status ?? editingShipment.status,
        delivered_at: editForm.status === 'delivered' ? new Date() : 
                      editForm.delivered_at ?? editingShipment.delivered_at,
        updated_at: new Date()
      };

      setShipments((prev: ShipmentWithOrder[]) => 
        prev.map((shipment: ShipmentWithOrder) => 
          shipment.id === editingShipment.id ? updatedShipment : shipment
        )
      );
      setEditingShipment(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to update shipment:', error);
      setError('Failed to update shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: ShipmentStatus): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredShipments = shipments.filter((shipment: ShipmentWithOrder) => {
    const matchesSearch = shipment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (shipment.tracking_number && shipment.tracking_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         shipment.courier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: shipments.length,
    pending: shipments.filter(s => s.status === 'pending').length,
    in_transit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    returned: shipments.filter(s => s.status === 'returned').length
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading shipments...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shipment Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Shipments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.in_transit}</div>
            <p className="text-xs text-muted-foreground">In Transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.returned}</div>
            <p className="text-xs text-muted-foreground">Returned</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>🚚 Shipment Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track and manage order shipments
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Shipment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Shipment</DialogTitle>
                  <DialogDescription>
                    Create a shipment for an order
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateShipment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="order_id">Order ID</Label>
                    <Input
                      id="order_id"
                      type="number"
                      min="1"
                      value={createForm.order_id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreateShipmentInput) => ({ ...prev, order_id: parseInt(e.target.value) || 1 }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="courier">Courier/Shipping Company</Label>
                    <Input
                      id="courier"
                      value={createForm.courier}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreateShipmentInput) => ({ ...prev, courier: e.target.value }))
                      }
                      placeholder="e.g., Express Courier, Standard Shipping"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Shipping Cost ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={createForm.cost}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreateShipmentInput) => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated_delivery">Estimated Delivery Date (Optional)</Label>
                    <Input
                      id="estimated_delivery"
                      type="date"
                      value={createForm.estimated_delivery?.toISOString().split('T')[0] || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm((prev: CreateShipmentInput) => ({ 
                          ...prev, 
                          estimated_delivery: e.target.value ? new Date(e.target.value) : null 
                        }))
                      }
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Shipment'}
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
                  placeholder="Search by customer, order, tracking number..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select
                  value={statusFilter}
                  onValueChange={(value: ShipmentStatus | 'all') => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline">
                {filteredShipments.length} shipment{filteredShipments.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No shipments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredShipments.map((shipment: ShipmentWithOrder) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-mono">{shipment.order_number}</TableCell>
                        <TableCell className="font-medium">{shipment.customer_name}</TableCell>
                        <TableCell>{shipment.courier}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {shipment.tracking_number || (
                            <span className="text-muted-foreground italic">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(shipment.status)}>
                            {shipment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>${shipment.cost.toFixed(2)}</TableCell>
                        <TableCell>
                          {shipment.estimated_delivery ? 
                            shipment.estimated_delivery.toLocaleDateString() :
                            <span className="text-muted-foreground italic">Not set</span>
                          }
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingShipment(shipment);
                                  setEditForm({
                                    id: shipment.id,
                                    tracking_number: shipment.tracking_number,
                                    status: shipment.status,
                                    delivered_at: shipment.delivered_at
                                  });
                                }}
                              >
                                Update
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Shipment</DialogTitle>
                                <DialogDescription>
                                  Update shipment tracking and status
                                </DialogDescription>
                              </DialogHeader>
                              {editingShipment && (
                                <div className="space-y-4">
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">Shipment Details</h4>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>Order:</strong> {editingShipment.order_number}</div>
                                      <div><strong>Customer:</strong> {editingShipment.customer_name}</div>
                                      <div><strong>Courier:</strong> {editingShipment.courier}</div>
                                      <div><strong>Cost:</strong> ${editingShipment.cost.toFixed(2)}</div>
                                    </div>
                                  </div>
                                  
                                  <form onSubmit={handleUpdateShipment} className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-tracking">Tracking Number</Label>
                                      <Input
                                        id="edit-tracking"
                                        value={editForm.tracking_number || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          setEditForm((prev: Partial<UpdateShipmentInput>) => ({ ...prev, tracking_number: e.target.value || null }))
                                        }
                                        placeholder="Enter tracking number"
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-status">Status</Label>
                                      <Select
                                        value={editForm.status || editingShipment.status}
                                        onValueChange={(value: ShipmentStatus) =>
                                          setEditForm((prev: Partial<UpdateShipmentInput>) => ({ ...prev, status: value }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="in_transit">In Transit</SelectItem>
                                          <SelectItem value="delivered">Delivered</SelectItem>
                                          <SelectItem value="returned">Returned</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="flex space-x-2 pt-4">
                                      <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Updating...' : 'Update Shipment'}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingShipment(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </form>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
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