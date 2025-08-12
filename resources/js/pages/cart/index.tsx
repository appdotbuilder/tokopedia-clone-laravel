import React from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';

interface CartItem {
    id: number;
    quantity: number;
    price: number;
    subtotal: number;
    product: {
        id: number;
        name: string;
        code: string;
        stock: number;
        images: string[] | null;
        category: {
            name: string;
        };
    };
}

interface Props extends SharedData {
    cartItems: CartItem[];
    total: number;
    [key: string]: unknown;
}

export default function CartIndex({ cartItems, total }: Props) {
    const { auth } = usePage<SharedData>().props;

    const updateQuantity = (cartId: number, newQuantity: number) => {
        router.patch(route('cart.update', cartId), {
            quantity: newQuantity
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const removeItem = (cartId: number) => {
        router.delete(route('cart.destroy', cartId), {
            preserveState: true,
            preserveScroll: true
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(price);
    };

    if (!auth.user) {
        return (
            <>
                <Head title="Shopping Cart - TokoMart" />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🔒</div>
                        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
                        <p className="text-gray-600 mb-6">You need to sign in to view your shopping cart</p>
                        <Link
                            href={route('login')}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Shopping Cart - TokoMart" />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <Link href={route('home')} className="flex items-center space-x-4">
                                <h1 className="text-2xl font-bold text-green-600">🛒 TokoMart</h1>
                            </Link>
                            
                            <nav className="flex items-center space-x-4">
                                <Link
                                    href={route('dashboard')}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Breadcrumb */}
                <nav className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Link href={route('home')} className="hover:text-green-600">
                                Home
                            </Link>
                            <span>/</span>
                            <span className="text-gray-900">Shopping Cart</span>
                        </div>
                    </div>
                </nav>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">
                        🛒 Your Shopping Cart
                    </h1>

                    {cartItems.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow-sm border">
                                    {cartItems.map((item, index) => (
                                        <div key={item.id} className={`p-6 ${index !== cartItems.length - 1 ? 'border-b' : ''}`}>
                                            <div className="flex items-center space-x-4">
                                                {/* Product Image */}
                                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                                    {item.product.images && item.product.images.length > 0 ? (
                                                        <img 
                                                            src={item.product.images[0]} 
                                                            alt={item.product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-2xl">
                                                            📦
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <Link 
                                                                href={route('products.show', item.product.id)}
                                                                className="font-semibold text-gray-900 hover:text-green-600"
                                                            >
                                                                {item.product.name}
                                                            </Link>
                                                            <div className="text-sm text-gray-500">
                                                                {item.product.category.name} • SKU: {item.product.code}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-red-500 hover:text-red-700 font-medium text-sm"
                                                        >
                                                            🗑️ Remove
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="text-lg font-semibold text-green-600">
                                                            {formatPrice(item.price)}
                                                        </div>

                                                        {/* Quantity Controls */}
                                                        <div className="flex items-center space-x-3">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-12 text-center font-semibold">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, Math.min(item.product.stock, item.quantity + 1))}
                                                                disabled={item.quantity >= item.product.stock}
                                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        <div className="text-lg font-bold text-gray-900">
                                                            {formatPrice(item.subtotal)}
                                                        </div>
                                                    </div>

                                                    {item.quantity >= item.product.stock && (
                                                        <div className="mt-2 text-sm text-orange-600">
                                                            ⚠️ Maximum stock reached ({item.product.stock} available)
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div>
                                <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                                    
                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between">
                                            <span>Subtotal ({cartItems.length} items)</span>
                                            <span className="font-semibold">{formatPrice(total)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Shipping</span>
                                            <span>Calculated at checkout</span>
                                        </div>
                                        <hr />
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span className="text-green-600">{formatPrice(total)}</span>
                                        </div>
                                    </div>

                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg mb-4">
                                        🚀 Proceed to Checkout
                                    </Button>

                                    <Link
                                        href={route('home')}
                                        className="block text-center text-green-600 hover:text-green-700 font-medium"
                                    >
                                        ← Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-6">🛒</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                            <p className="text-gray-600 mb-8">
                                Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
                            </p>
                            <Link
                                href={route('home')}
                                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
                            >
                                🛍️ Start Shopping
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}