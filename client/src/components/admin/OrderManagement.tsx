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
import type { Order, OrderStatus, UpdateOrderInput } from '../../../../server/src/schema';

interface OrderWithCustomer extends Order {
  customer_name: string;
  customer_email: string;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [editingOrder, setEditingOrder] = useState<OrderWithCustomer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<{
    status?: OrderStatus;
    payment_status?: string;
    tracking_number?: string;
  }>({});

  const loadOrders = useCallback(async () => {
    try {
      // STUB: Using mock data since server handlers are placeholders
      const mockOrders: OrderWithCustomer[] = [
        {
          id: 1,
          user_id: 2,
          customer_name: 'John Doe',
          customer_email: 'john.doe@example.com',
          total_amount: 1349.98,
          status: 'pending',
          shipping_address: '456 Customer Ave, Customer City, 12345',
          shipping_method: 'Express Shipping',
          shipping_cost: 15.00,
          payment_method: 'Credit Card',
          payment_status: 'pending',
          created_at: new Date('2024-02-15T10:30:00'),
          updated_at: new Date('2024-02-15T10:30:00')
        },
        {
          id: 2,
          user_id: 3,
          customer_name: 'Jane Smith',
          customer_email: 'jane.smith@example.com',
          total_amount: 89.97,
          status: 'paid',
          shipping_address: '789 Another St, Another City, 54321',
          shipping_method: 'Standard Shipping',
          shipping_cost: 8.50,
          payment_method: 'PayPal',
          payment_status: 'completed',
          created_at: new Date('2024-02-14T14:20:00'),
          updated_at: new Date('2024-02-14T16:45:00')
        },
        {
          id: 3,
          user_id: 2,
          customer_name: 'John Doe',
          customer_email: 'john.doe@example.com',
          total_amount: 249.99,
          status: 'shipped',
          shipping_address: '456 Customer Ave, Customer City, 12345',
          shipping_method: 'Express Shipping',
          shipping_cost: 12.00,
          payment_method: 'Credit Card',
          payment_status: 'completed',
          created_at: new Date('2024-02-12T09:15:00'),
          updated_at: new Date('2024-02-13T11:20:00')
        },
        {
          id: 4,
          user_id: 4,
          customer_name: 'Mike Johnson',
          customer_email: 'mike.j@example.com',
          total_amount: 1299.99,
          status: 'completed',
          shipping_address: '321 Final St, Final City, 98765',
          shipping_method: 'Standard Shipping',
          shipping_cost: 10.00,
          payment_method: 'Bank Transfer',
          payment_status: 'completed',
          created_at: new Date('2024-02-10T13:45:00'),
          updated_at: new Date('2024-02-12T16:30:00')
        },
        {
          id: 5,
          user_id: 3,
          customer_name: 'Jane Smith',
          customer_email: 'jane.smith@example.com',
          total_amount: 39.99,
          status: 'cancelled',
          shipping_address: '789 Another St, Another City, 54321',
          shipping_method: 'Standard Shipping',
          shipping_cost: 5.00,
          payment_method: 'Credit Card',
          payment_status: 'refunded',
          created_at: new Date('2024-02-08T11:30:00'),
          updated_at: new Date('2024-02-09T09:15:00')
        }
      ];
      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // STUB: Using mock update since server handlers are placeholders
      const updatedOrder: OrderWithCustomer = {
        ...editingOrder,
        ...editForm,
        updated_at: new Date()
      };

      setOrders((prev: OrderWithCustomer[]) => 
        prev.map((order: OrderWithCustomer) => 
          order.id === editingOrder.id ? updatedOrder : order
        )
      );
      setEditingOrder(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to update order:', error);
      setError('Failed to update order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter((order: OrderWithCustomer) => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total_amount, 0)
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading orders...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
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
            <div className="text-2xl font-bold text-blue-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
            <p className="text-xs text-muted-foreground">Shipped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📋 Order Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track and manage customer orders
          </p>
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
                  placeholder="Search orders by customer or order ID..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select
                  value={statusFilter}
                  onValueChange={(value: OrderStatus | 'all') => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline">
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order: OrderWithCustomer) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">#{order.id.toString().padStart(4, '0')}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${order.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{order.payment_method}</div>
                            <div className="text-xs text-muted-foreground">
                              {order.payment_status || 'pending'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{order.created_at.toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {order.created_at.toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Order Details - #{order.id.toString().padStart(4, '0')}</DialogTitle>
                                <DialogDescription>
                                  Complete order information and management
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Customer Information */}
                                <div>
                                  <h4 className="font-medium mb-2">Customer Information</h4>
                                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <div><strong>Name:</strong> {order.customer_name}</div>
                                    <div><strong>Email:</strong> {order.customer_email}</div>
                                    <div><strong>Shipping Address:</strong> {order.shipping_address}</div>
                                    <div><strong>Shipping Method:</strong> {order.shipping_method}</div>
                                  </div>
                                </div>

                                {/* Order Summary */}
                                <div>
                                  <h4 className="font-medium mb-2">Order Summary</h4>
                                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                      <span>Subtotal:</span>
                                      <span>${(order.total_amount - order.shipping_cost).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Shipping Cost:</span>
                                      <span>${order.shipping_cost.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-semibold">
                                      <span>Total:</span>
                                      <span>${order.total_amount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Update Order Status */}
                                <div>
                                  <h4 className="font-medium mb-2">Update Order</h4>
                                  <form onSubmit={handleUpdateOrder} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="status">Order Status</Label>
                                        <Select
                                          value={editForm.status || order.status}
                                          onValueChange={(value: OrderStatus) => {
                                            setEditingOrder(order);
                                            setEditForm(prev => ({ ...prev, status: value }));
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="shipped">Shipped</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label htmlFor="payment_status">Payment Status</Label>
                                        <Input
                                          id="payment_status"
                                          value={editForm.payment_status || order.payment_status || ''}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setEditingOrder(order);
                                            setEditForm(prev => ({ ...prev, payment_status: e.target.value }));
                                          }}
                                          placeholder="e.g., completed, refunded"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor="tracking_number">Tracking Number</Label>
                                      <Input
                                        id="tracking_number"
                                        value={editForm.tracking_number || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          setEditingOrder(order);
                                          setEditForm(prev => ({ ...prev, tracking_number: e.target.value }));
                                        }}
                                        placeholder="Enter tracking number"
                                      />
                                    </div>
                                    <Button 
                                      type="submit" 
                                      disabled={isSubmitting || !editingOrder}
                                      className="w-full"
                                    >
                                      {isSubmitting ? 'Updating...' : 'Update Order'}
                                    </Button>
                                  </form>
                                </div>
                              </div>
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