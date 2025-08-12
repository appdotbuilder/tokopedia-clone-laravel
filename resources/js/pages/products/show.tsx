import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';

interface Product {
    id: number;
    name: string;
    code: string;
    description: string;
    price: number;
    stock: number;
    weight: number;
    images: string[] | null;
    category: {
        id: number;
        name: string;
    };
}

interface Props extends SharedData {
    product: Product;
    relatedProducts: Product[];
    [key: string]: unknown;
}

export default function ProductShow({ product, relatedProducts }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    const handleAddToCart = () => {
        if (!auth.user) {
            router.visit(route('login'));
            return;
        }

        router.post(route('cart.store'), {
            product_id: product.id,
            quantity: quantity
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Show success message or redirect
            }
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(price);
    };

    const images = product.images && product.images.length > 0 ? product.images : ['/images/placeholder.jpg'];

    return (
        <>
            <Head title={`${product.name} - TokoMart`} />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <Link href={route('home')} className="flex items-center space-x-4">
                                <h1 className="text-2xl font-bold text-green-600">🛒 TokoMart</h1>
                            </Link>
                            
                            <nav className="flex items-center space-x-4">
                                {auth.user ? (
                                    <div className="flex items-center space-x-4">
                                        <Link
                                            href={route('cart.index')}
                                            className="text-gray-600 hover:text-green-600 font-medium"
                                        >
                                            🛒 Cart
                                        </Link>
                                        <Link
                                            href={route('dashboard')}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Dashboard
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-4">
                                        <Link
                                            href={route('login')}
                                            className="text-gray-600 hover:text-green-600 font-medium"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
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
                            <span>{product.category.name}</span>
                            <span>/</span>
                            <span className="text-gray-900">{product.name}</span>
                        </div>
                    </div>
                </nav>

                {/* Product Details */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Product Images */}
                        <div>
                            <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                                <img
                                    src={images[selectedImage]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {images.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`aspect-square rounded-lg overflow-hidden border-2 ${
                                                selectedImage === index ? 'border-green-600' : 'border-gray-200'
                                            }`}
                                        >
                                            <img
                                                src={image}
                                                alt={`${product.name} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div>
                            <div className="mb-2">
                                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    {product.category.name}
                                </span>
                            </div>
                            
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {product.name}
                            </h1>
                            
                            <div className="text-sm text-gray-600 mb-4">
                                SKU: {product.code}
                            </div>
                            
                            <div className="text-3xl font-bold text-green-600 mb-6">
                                {formatPrice(product.price)}
                            </div>

                            {product.description && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                    <p className="text-gray-700 whitespace-pre-line">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-700">Stock Available:</span>
                                    <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {product.stock} items
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-700">Weight:</span>
                                    <span className="font-semibold">{product.weight}g</span>
                                </div>
                            </div>

                            {product.stock > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quantity
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                        >
                                            -
                                        </button>
                                        <span className="w-16 text-center font-semibold">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex space-x-4">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                                >
                                    {product.stock > 0 ? (
                                        <>🛒 Add to Cart</>
                                    ) : (
                                        <>😞 Out of Stock</>
                                    )}
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    className="px-6 py-3"
                                >
                                    ❤️
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section className="bg-white py-12">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedProducts.map((relatedProduct) => (
                                    <div key={relatedProduct.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                        <Link href={route('products.show', relatedProduct.id)}>
                                            <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center">
                                                {relatedProduct.images && relatedProduct.images.length > 0 ? (
                                                    <img 
                                                        src={relatedProduct.images[0]} 
                                                        alt={relatedProduct.name}
                                                        className="w-full h-full object-cover rounded-t-lg"
                                                    />
                                                ) : (
                                                    <div className="text-6xl">📦</div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <div className="text-xs text-green-600 font-medium mb-1">
                                                    {relatedProduct.category.name}
                                                </div>
                                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                                    {relatedProduct.name}
                                                </h3>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-bold text-green-600">
                                                        {formatPrice(relatedProduct.price)}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        Stock: {relatedProduct.stock}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}