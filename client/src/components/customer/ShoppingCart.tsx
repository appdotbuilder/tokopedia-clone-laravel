import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import type { User, CartItem, Product, CheckoutInput } from '../../../../server/src/schema';

interface CartItemWithProduct extends CartItem {
  product: Product;
}

interface ShoppingCartProps {
  user: User;
  onCartUpdate: (count: number) => void;
}

interface ShippingOption {
  id: string;
  name: string;
  cost: number;
  estimatedDays: string;
}

export default function ShoppingCart({ user, onCartUpdate }: ShoppingCartProps) {
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    shipping_address: user.address || '',
    shipping_method: '',
    payment_method: ''
  });

  // Mock shipping options
  const shippingOptions: ShippingOption[] = [
    { id: 'standard', name: 'Standard Shipping', cost: 5.99, estimatedDays: '5-7 business days' },
    { id: 'express', name: 'Express Shipping', cost: 12.99, estimatedDays: '2-3 business days' },
    { id: 'overnight', name: 'Overnight Shipping', cost: 24.99, estimatedDays: '1 business day' }
  ];

  const paymentMethods = [
    { id: 'credit', name: 'Credit Card' },
    { id: 'paypal', name: 'PayPal' },
    { id: 'bank', name: 'Bank Transfer' }
  ];

  const loadCart = useCallback(async () => {
    try {
      // STUB: Using mock data since server handlers are placeholders
      const mockCartItems: CartItemWithProduct[] = [
        {
          id: 1,
          user_id: user.id,
          product_id: 1,
          quantity: 1,
          created_at: new Date(),
          updated_at: new Date(),
          product: {
            id: 1,
            name: 'Gaming Laptop',
            code: 'LAPTOP001',
            description: 'High-performance gaming laptop',
            price: 1299.99,
            stock: 15,
            category_id: 1,
            image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
            created_at: new Date(),
            updated_at: new Date()
          }
        },
        {
          id: 2,
          user_id: user.id,
          product_id: 2,
          quantity: 2,
          created_at: new Date(),
          updated_at: new Date(),
          product: {
            id: 2,
            name: 'Wireless Gaming Mouse',
            code: 'MOUSE001',
            description: 'Ergonomic wireless gaming mouse',
            price: 49.99,
            stock: 50,
            category_id: 1,
            image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
            created_at: new Date(),
            updated_at: new Date()
          }
        },
        {
          id: 3,
          user_id: user.id,
          product_id: 4,
          quantity: 1,
          created_at: new Date(),
          updated_at: new Date(),
          product: {
            id: 4,
            name: 'Smart Watch',
            code: 'WATCH001',
            description: 'Advanced fitness tracking smartwatch',
            price: 199.99,
            stock: 25,
            category_id: 1,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
            created_at: new Date(),
            updated_at: new Date()
          }
        }
      ];
      
      setCartItems(mockCartItems);
      onCartUpdate(mockCartItems.length);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setError('Failed to load cart items');
    } finally {
      setIsLoading(false);
    }
  }, [user.id, onCartUpdate]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleUpdateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    try {
      // STUB: Using mock update since server handlers are placeholders
      setCartItems((prev: CartItemWithProduct[]) =>
        prev.map((item: CartItemWithProduct) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity, updated_at: new Date() } : item
        )
      );
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setError('Failed to update item quantity');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      // STUB: Using mock removal since server handlers are placeholders
      const updatedItems = cartItems.filter((item: CartItemWithProduct) => item.id !== cartItemId);
      setCartItems(updatedItems);
      onCartUpdate(updatedItems.length);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setError('Failed to remove item from cart');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingOut(true);
    setError(null);

    try {
      const selectedShipping = shippingOptions.find(option => option.id === checkoutForm.shipping_method);
      if (!selectedShipping) {
        throw new Error('Please select a shipping method');
      }

      const checkoutData: CheckoutInput = {
        user_id: user.id,
        shipping_address: checkoutForm.shipping_address,
        shipping_method: selectedShipping.name,
        payment_method: checkoutForm.payment_method
      };

      // STUB: Using mock checkout since server handlers are placeholders
      console.log('Checkout data:', checkoutData);
      
      // Mock successful checkout
      setTimeout(() => {
        setCartItems([]);
        onCartUpdate(0);
        setShowCheckout(false);
        setIsCheckingOut(false);
        alert('Order placed successfully! Check your order history for details.');
      }, 2000);
    } catch (error) {
      console.error('Checkout failed:', error);
      setError('Checkout failed. Please try again.');
      setIsCheckingOut(false);
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const selectedShippingOption = shippingOptions.find(option => option.id === checkoutForm.shipping_method);
  const shippingCost = selectedShippingOption ? selectedShippingOption.cost : 0;
  const total = subtotal + shippingCost;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2">Loading cart...</span>
        </CardContent>
      </Card>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-4">
            Add some products to get started with your shopping.
          </p>
          <Button onClick={() => window.location.reload()}>
            Continue Shopping
          </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>🛒 Shopping Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cartItems.map((item: CartItemWithProduct) => (
              <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                <div className="w-20 h-20 overflow-hidden rounded-md flex-shrink-0">
                  <img
                    src={item.product.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isUpdating}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                        }
                        className="w-16 text-center"
                        min="1"
                        max={item.product.stock}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock || isUpdating}
                      >
                        +
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${item.product.price.toFixed(2)} each
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveItem(item.id)}
                  className="self-start"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''}):</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {shippingCost > 0 && (
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-6">
            <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full">
                  Proceed to Checkout
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Checkout</DialogTitle>
                  <DialogDescription>
                    Complete your order by providing shipping and payment details
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCheckout} className="space-y-6">
                  {/* Shipping Address */}
                  <div className="space-y-2">
                    <Label htmlFor="shipping_address">Shipping Address</Label>
                    <Textarea
                      id="shipping_address"
                      value={checkoutForm.shipping_address}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCheckoutForm(prev => ({ ...prev, shipping_address: e.target.value }))
                      }
                      placeholder="Enter your complete shipping address"
                      required
                      rows={3}
                    />
                  </div>

                  {/* Shipping Method */}
                  <div className="space-y-2">
                    <Label htmlFor="shipping_method">Shipping Method</Label>
                    <Select
                      value={checkoutForm.shipping_method}
                      onValueChange={(value: string) =>
                        setCheckoutForm(prev => ({ ...prev, shipping_method: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shipping method" />
                      </SelectTrigger>
                      <SelectContent>
                        {shippingOptions.map((option: ShippingOption) => (
                          <SelectItem key={option.id} value={option.id}>
                            <div className="flex justify-between w-full">
                              <span>{option.name}</span>
                              <span className="ml-4">${option.cost.toFixed(2)} - {option.estimatedDays}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                      value={checkoutForm.payment_method}
                      onValueChange={(value: string) =>
                        setCheckoutForm(prev => ({ ...prev, payment_method: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.name}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Order Summary in Checkout */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      {cartItems.map((item: CartItemWithProduct) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.product.name} × {item.quantity}</span>
                          <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      {shippingCost > 0 && (
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span>${shippingCost.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-base pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isCheckingOut}
                      className="flex-1"
                    >
                      {isCheckingOut ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCheckout(false)}
                      disabled={isCheckingOut}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}