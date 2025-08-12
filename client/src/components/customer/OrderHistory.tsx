import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import type { User, Order, OrderStatus } from '../../../../server/src/schema';

interface OrderWithDetails extends Order {
  items: Array<{
    id: number;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  tracking_info?: {
    tracking_number: string;
    courier: string;
    status: string;
  };
}

interface OrderHistoryProps {
  user: User;
}

export default function OrderHistory({ user }: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      // STUB: Using mock data since server handlers are placeholders
      const mockOrders: OrderWithDetails[] = [
        {
          id: 1,
          user_id: user.id,
          total_amount: 1349.98,
          status: 'completed',
          shipping_address: '456 Customer Ave, Customer City, 12345',
          shipping_method: 'Express Shipping',
          shipping_cost: 15.00,
          payment_method: 'Credit Card',
          payment_status: 'completed',
          created_at: new Date('2024-02-10T10:30:00'),
          updated_at: new Date('2024-02-15T14:20:00'),
          items: [
            {
              id: 1,
              product_name: 'Gaming Laptop',
              quantity: 1,
              price: 1299.99
            },
            {
              id: 2,
              product_name: 'Wireless Gaming Mouse',
              quantity: 1,
              price: 49.99
            }
          ],
          tracking_info: {
            tracking_number: 'EXP123456789',
            courier: 'Express Courier',
            status: 'delivered'
          }
        },
        {
          id: 2,
          user_id: user.id,
          total_amount: 89.97,
          status: 'shipped',
          shipping_address: '456 Customer Ave, Customer City, 12345',
          shipping_method: 'Standard Shipping',
          shipping_cost: 8.50,
          payment_method: 'PayPal',
          payment_status: 'completed',
          created_at: new Date('2024-02-08T14:20:00'),
          updated_at: new Date('2024-02-12T16:45:00'),
          items: [
            {
              id: 3,
              product_name: 'Cotton T-Shirt',
              quantity: 2,
              price: 19.99
            },
            {
              id: 4,
              product_name: 'Yoga Mat',
              quantity: 1,
              price: 39.99
            }
          ],
          tracking_info: {
            tracking_number: 'STD987654321',
            courier: 'Standard Shipping',
            status: 'in_transit'
          }
        },
        {
          id: 3,
          user_id: user.id,
          total_amount: 219.99,
          status: 'pending',
          shipping_address: '456 Customer Ave, Customer City, 12345',
          shipping_method: 'Express Shipping',
          shipping_cost: 12.00,
          payment_method: 'Credit Card',
          payment_status: 'pending',
          created_at: new Date('2024-02-16T09:15:00'),
          updated_at: new Date('2024-02-16T09:15:00'),
          items: [
            {
              id: 5,
              product_name: 'Smart Watch',
              quantity: 1,
              price: 199.99
            }
          ]
        }
      ];
      
      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setError('Failed to load order history');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleTrackOrder = async (orderTrackingNumber: string) => {
    try {
      // STUB: Using mock tracking since server handlers are placeholders
      const mockTrackingInfo = {
        tracking_number: orderTrackingNumber,
        status: 'in_transit',
        last_update: new Date(),
        location: 'Distribution Center - City',
        estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        events: [
          {
            date: new Date('2024-02-12T10:00:00'),
            status: 'picked_up',
            location: 'Warehouse - Origin City',
            description: 'Package picked up from seller'
          },
          {
            date: new Date('2024-02-13T14:30:00'),
            status: 'in_transit',
            location: 'Sorting Facility - Hub City',
            description: 'Package arrived at sorting facility'
          },
          {
            date: new Date('2024-02-14T09:15:00'),
            status: 'in_transit',
            location: 'Distribution Center - Destination City',
            description: 'Package out for delivery'
          }
        ]
      };
      
      setTrackingResult(mockTrackingInfo);
    } catch (error) {
      console.error('Failed to track order:', error);
      setError('Failed to get tracking information');
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

  const getStatusDescription = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'Waiting for payment confirmation';
      case 'paid': return 'Payment received, preparing for shipment';
      case 'shipped': return 'Package is on its way to you';
      case 'completed': return 'Order delivered successfully';
      case 'cancelled': return 'Order has been cancelled';
      default: return 'Unknown status';
    }
  };

  const filteredOrders = orders.filter((order: OrderWithDetails) =>
    order.id.toString().includes(searchTerm) ||
    order.items.some(item => item.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2">Loading order history...</span>
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

      {/* Order Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Track Your Order</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter a tracking number to get the latest shipping updates
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter tracking number..."
              value={trackingNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackingNumber(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => handleTrackOrder(trackingNumber)}
              disabled={!trackingNumber}
            >
              Track Order
            </Button>
          </div>
          
          {trackingResult && (
            <div className="mt-4 p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Tracking Results</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Tracking Number:</strong> {trackingResult.tracking_number}</div>
                <div><strong>Status:</strong> <Badge>{trackingResult.status}</Badge></div>
                <div><strong>Current Location:</strong> {trackingResult.location}</div>
                <div><strong>Estimated Delivery:</strong> {trackingResult.estimated_delivery.toLocaleDateString()}</div>
              </div>
              <Separator className="my-3" />
              <h5 className="font-medium mb-2">Tracking History</h5>
              <div className="space-y-2">
                {trackingResult.events.map((event: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium">{event.description}</div>
                      <div className="text-muted-foreground">{event.location}</div>
                    </div>
                    <div className="text-muted-foreground">
                      {event.date.toLocaleDateString()} {event.date.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>📋 Order History</CardTitle>
              <p className="text-sm text-muted-foreground">
                View your past orders and their status
              </p>
            </div>
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center p-8">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No orders match your search.' : 'You haven\'t placed any orders yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: OrderWithDetails) => (
                <Card key={order.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">
                          Order #{order.id.toString().padStart(4, '0')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Placed on {order.created_at.toLocaleDateString()} at {order.created_at.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          ${order.total_amount.toFixed(2)}
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground mb-3">
                      {getStatusDescription(order.status)}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="font-medium text-sm mb-1">Items Ordered</h5>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              {item.product_name} × {item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-1">Shipping & Payment</h5>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Method: {order.shipping_method}</div>
                          <div>Payment: {order.payment_method} ({order.payment_status || 'pending'})</div>
                          {order.tracking_info && (
                            <div>Tracking: {order.tracking_info.tracking_number}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        Last updated: {order.updated_at.toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                Order Details - #{order.id.toString().padStart(4, '0')}
                              </DialogTitle>
                              <DialogDescription>
                                Complete order information and status
                              </DialogDescription>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Order Status */}
                                <div>
                                  <h4 className="font-medium mb-2">Order Status</h4>
                                  <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(selectedOrder.status)}>
                                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {getStatusDescription(selectedOrder.status)}
                                    </span>
                                  </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                  <h4 className="font-medium mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {selectedOrder.items.map((item, index) => (
                                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <div>
                                          <div className="font-medium">{item.product_name}</div>
                                          <div className="text-sm text-muted-foreground">
                                            Quantity: {item.quantity} × ${item.price.toFixed(2)}
                                          </div>
                                        </div>
                                        <div className="font-semibold">
                                          ${(item.price * item.quantity).toFixed(2)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Shipping Information */}
                                <div>
                                  <h4 className="font-medium mb-2">Shipping Information</h4>
                                  <div className="bg-gray-50 p-4 rounded space-y-2 text-sm">
                                    <div><strong>Address:</strong> {selectedOrder.shipping_address}</div>
                                    <div><strong>Method:</strong> {selectedOrder.shipping_method}</div>
                                    <div><strong>Cost:</strong> ${selectedOrder.shipping_cost.toFixed(2)}</div>
                                    {selectedOrder.tracking_info && (
                                      <>
                                        <div><strong>Courier:</strong> {selectedOrder.tracking_info.courier}</div>
                                        <div><strong>Tracking:</strong> {selectedOrder.tracking_info.tracking_number}</div>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Order Total */}
                                <div>
                                  <h4 className="font-medium mb-2">Order Total</h4>
                                  <div className="bg-green-50 p-4 rounded space-y-2">
                                    <div className="flex justify-between">
                                      <span>Subtotal:</span>
                                      <span>${(selectedOrder.total_amount - selectedOrder.shipping_cost).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Shipping:</span>
                                      <span>${selectedOrder.shipping_cost.toFixed(2)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-semibold text-lg">
                                      <span>Total:</span>
                                      <span className="text-green-600">${selectedOrder.total_amount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-end">
                                  <Button onClick={() => setSelectedOrder(null)}>
                                    Close
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {order.tracking_info && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTrackingNumber(order.tracking_info!.tracking_number);
                              handleTrackOrder(order.tracking_info!.tracking_number);
                            }}
                          >
                            Track Package
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}