import React from 'react';
import { type SharedData } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    images: string[] | null;
    category: {
        id: number;
        name: string;
    };
}

interface Category {
    id: number;
    name: string;
}

interface Props extends SharedData {
    products: {
        data: Product[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    categories: Category[];
    filters: {
        category?: string;
        search?: string;
        min_price?: string;
        max_price?: string;
        sort?: string;
    };
    stats: {
        total_products: number;
        total_categories: number;
    };
    [key: string]: unknown;
}

export default function Welcome({ products, categories, filters, stats }: Props) {
    const { auth } = usePage<SharedData>().props;

    const handleAddToCart = (productId: number) => {
        if (!auth.user) {
            router.visit(route('login'));
            return;
        }

        router.post(route('cart.store'), {
            product_id: productId,
            quantity: 1
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        router.get(route('home'), newFilters, {
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

    return (
        <>
            <Head title="Welcome to TokoMart - Your Online Shopping Destination" />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-2xl font-bold text-green-600">🛒 TokoMart</h1>
                                <span className="text-sm text-gray-500">Your Online Shopping Destination</span>
                            </div>
                            
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

                {/* Hero Section */}
                <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            🎉 Welcome to TokoMart
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                            Discover amazing products at unbeatable prices! Shop from {stats.total_products} products 
                            across {stats.total_categories} categories.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                                <div className="text-3xl mb-2">🚚</div>
                                <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
                                <p className="text-sm opacity-90">Same-day delivery available in major cities</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                                <div className="text-3xl mb-2">💳</div>
                                <h3 className="font-semibold text-lg mb-2">Secure Payment</h3>
                                <p className="text-sm opacity-90">Multiple payment options with Midtrans integration</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                                <div className="text-3xl mb-2">⭐</div>
                                <h3 className="font-semibold text-lg mb-2">Quality Products</h3>
                                <p className="text-sm opacity-90">Curated selection of top-rated items</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Filters and Search */}
                <section className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Search */}
                            <div className="flex-1 min-w-64">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={filters.search || ''}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            
                            {/* Category Filter */}
                            <select
                                value={filters.category || ''}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id.toString()}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>

                            {/* Sort */}
                            <select
                                value={filters.sort || 'newest'}
                                onChange={(e) => handleFilterChange('sort', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                                <option value="newest">Newest</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                                <option value="name">Name</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Products Grid */}
                <section className="py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {products.data.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.data.map((product) => (
                                        <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                            <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center">
                                                {product.images && product.images.length > 0 ? (
                                                    <img 
                                                        src={product.images[0]} 
                                                        alt={product.name}
                                                        className="w-full h-full object-cover rounded-t-lg"
                                                    />
                                                ) : (
                                                    <div className="text-6xl">📦</div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <div className="text-xs text-green-600 font-medium mb-1">
                                                    {product.category.name}
                                                </div>
                                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                                    {product.name}
                                                </h3>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-lg font-bold text-green-600">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        Stock: {product.stock}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={route('products.show', product.id)}
                                                        className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                                                    >
                                                        View Details
                                                    </Link>
                                                    <Button
                                                        onClick={() => handleAddToCart(product.id)}
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                                                        disabled={product.stock === 0}
                                                    >
                                                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {products.links && products.links.length > 3 && (
                                    <div className="mt-12 flex justify-center space-x-2">
                                        {products.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.visit(link.url)}
                                                disabled={!link.url}
                                                className={`px-3 py-2 rounded-lg text-sm ${
                                                    link.active
                                                        ? 'bg-green-600 text-white'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
                                <p className="text-gray-600 mb-6">
                                    Try adjusting your search or filter criteria
                                </p>
                                <Button
                                    onClick={() => router.visit(route('home'))}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <h3 className="text-xl font-bold mb-4">🛒 TokoMart</h3>
                                <p className="text-gray-400">
                                    Your trusted online shopping destination with quality products and exceptional service.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Quick Links</h4>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="#" className="hover:text-white">About Us</a></li>
                                    <li><a href="#" className="hover:text-white">Contact</a></li>
                                    <li><a href="#" className="hover:text-white">Help Center</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Categories</h4>
                                <ul className="space-y-2 text-gray-400">
                                    {categories.slice(0, 4).map((category) => (
                                        <li key={category.id}>
                                            <button
                                                onClick={() => handleFilterChange('category', category.id.toString())}
                                                className="hover:text-white"
                                            >
                                                {category.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Contact Info</h4>
                                <div className="space-y-2 text-gray-400">
                                    <p>📞 +62 123 456 7890</p>
                                    <p>📧 support@tokomart.com</p>
                                    <p>📍 Jakarta, Indonesia</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                            <p>&copy; 2024 TokoMart. All rights reserved. Built with ❤️ using Laravel & React.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}