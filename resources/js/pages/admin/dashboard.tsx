import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { type SharedData } from '@/types';

interface Order {
    id: number;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
    user: {
        name: string;
        email: string;
    };
}

interface Product {
    id: number;
    name: string;
    code: string;
    stock: number;
    price: number;
    category: {
        name: string;
    };
}

interface Stats {
    total_users: number;
    total_products: number;
    total_categories: number;
    total_orders: number;
    pending_orders: number;
    revenue_today: number;
    revenue_month: number;
}

interface Props extends SharedData {
    stats: Stats;
    recentOrders: Order[];
    lowStockProducts: Product[];
    [key: string]: unknown;
}

export default function AdminDashboard({ stats, recentOrders, lowStockProducts }: Props) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const statusColors: { [key: string]: string } = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <>
            <Head title="Admin Dashboard - TokoMart" />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <h1 className="text-2xl font-bold text-green-600">🛒 TokoMart Admin</h1>
                                <p className="text-gray-600">Manage your e-commerce platform</p>
                            </div>
                            
                            <nav className="flex items-center space-x-4">
                                <Link
                                    href={route('home')}
                                    className="text-gray-600 hover:text-green-600 font-medium"
                                >
                                    🏪 View Store
                                </Link>
                                <Link
                                    href={route('dashboard')}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Customer Dashboard
                                </Link>
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">📊 Dashboard Overview</h2>
                        <p className="text-gray-600 mt-2">Monitor your store performance and manage operations</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">👥</div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_users.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">📦</div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_products.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">🏷️</div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Categories</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_categories.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">🛍️</div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_orders.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm text-white p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">💰</div>
                                <div>
                                    <p className="text-sm font-medium opacity-90">Today's Revenue</p>
                                    <p className="text-2xl font-bold">{formatPrice(stats.revenue_today)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm text-white p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">📈</div>
                                <div>
                                    <p className="text-sm font-medium opacity-90">This Month</p>
                                    <p className="text-2xl font-bold">{formatPrice(stats.revenue_month)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-sm text-white p-6">
                            <div className="flex items-center">
                                <div className="text-3xl mr-4">⏳</div>
                                <div>
                                    <p className="text-sm font-medium opacity-90">Pending Orders</p>
                                    <p className="text-2xl font-bold">{stats.pending_orders.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Orders */}
                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="p-6 border-b">
                                <h3 className="text-lg font-semibold text-gray-900">📋 Recent Orders</h3>
                            </div>
                            <div className="divide-y">
                                {recentOrders.length > 0 ? recentOrders.map((order) => (
                                    <div key={order.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    #{order.order_number}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {order.user.name} • {formatDate(order.created_at)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">
                                                    {formatPrice(order.total)}
                                                </p>
                                                <div className="mt-1">
                                                    {getStatusBadge(order.status)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-gray-500">
                                        No recent orders found
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t bg-gray-50">
                                <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                                    View All Orders →
                                </button>
                            </div>
                        </div>

                        {/* Low Stock Products */}
                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="p-6 border-b">
                                <h3 className="text-lg font-semibold text-gray-900">⚠️ Low Stock Alert</h3>
                            </div>
                            <div className="divide-y">
                                {lowStockProducts.length > 0 ? lowStockProducts.map((product) => (
                                    <div key={product.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {product.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {product.category.name} • {product.code}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-red-600">
                                                    {product.stock} left
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {formatPrice(product.price)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-gray-500">
                                        All products are well stocked!
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t bg-gray-50">
                                <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                                    Manage Products →
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">🚀 Quick Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                                <div className="text-2xl mb-2">➕</div>
                                <h4 className="font-medium text-gray-900">Add Product</h4>
                                <p className="text-sm text-gray-600">Create new product</p>
                            </button>

                            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                                <div className="text-2xl mb-2">🏷️</div>
                                <h4 className="font-medium text-gray-900">Manage Categories</h4>
                                <p className="text-sm text-gray-600">Edit categories</p>
                            </button>

                            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                                <div className="text-2xl mb-2">👥</div>
                                <h4 className="font-medium text-gray-900">View Customers</h4>
                                <p className="text-sm text-gray-600">Manage users</p>
                            </button>

                            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                                <div className="text-2xl mb-2">📊</div>
                                <h4 className="font-medium text-gray-900">View Reports</h4>
                                <p className="text-sm text-gray-600">Sales analytics</p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}