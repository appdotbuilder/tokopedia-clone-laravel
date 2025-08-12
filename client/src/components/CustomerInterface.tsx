import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { User } from '../../../server/src/schema';

// Import customer components
import ProductCatalog from '@/components/customer/ProductCatalog';
import ShoppingCart from '@/components/customer/ShoppingCart';
import OrderHistory from '@/components/customer/OrderHistory';
import CustomerProfile from '@/components/customer/CustomerProfile';

interface CustomerInterfaceProps {
  user: User;
}

export default function CustomerInterface({ user }: CustomerInterfaceProps) {
  const [activeTab, setActiveTab] = useState('catalog');
  const [cartItemCount, setCartItemCount] = useState(0);

  // STUB: Mock cart count since server handlers are placeholders
  useEffect(() => {
    setCartItemCount(3); // Mock cart count
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">🛍️ Welcome to Our Store!</h1>
        <p className="text-green-100">
          Hello {user.name}! Discover amazing products and enjoy seamless shopping.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="catalog">🏪 Products</TabsTrigger>
          <TabsTrigger value="cart" className="relative">
            🛒 Cart
            {cartItemCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 px-2 py-1 text-xs min-w-[1.25rem] h-5"
              >
                {cartItemCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders">📋 Orders</TabsTrigger>
          <TabsTrigger value="profile">👤 Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <ProductCatalog user={user} onCartUpdate={setCartItemCount} />
        </TabsContent>

        <TabsContent value="cart">
          <ShoppingCart user={user} onCartUpdate={setCartItemCount} />
        </TabsContent>

        <TabsContent value="orders">
          <OrderHistory user={user} />
        </TabsContent>

        <TabsContent value="profile">
          <CustomerProfile user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}