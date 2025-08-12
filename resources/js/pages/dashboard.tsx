import React, { useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { type SharedData } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    
    // Redirect admin users to admin dashboard
    useEffect(() => {
        if (auth.user && (auth.user as User).role === 'admin') {
            router.visit(route('admin.dashboard'));
        }
    }, [auth.user]);

    if (!auth.user || (auth.user as User).role === 'admin') {
        return null; // Will redirect
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customer Dashboard - TokoMart" />
            
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {auth.user.name}! 👋</h1>
                    <p className="text-gray-600 mt-2">Manage your orders and account settings</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center">
                            <div className="text-3xl mr-4">🛍️</div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center">
                            <div className="text-3xl mr-4">⏳</div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center">
                            <div className="text-3xl mr-4">❤️</div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Wishlist Items</p>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">🚀 Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link
                            href={route('home')}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center group"
                        >
                            <div className="text-3xl mb-2">🛒</div>
                            <h3 className="font-medium text-gray-900 group-hover:text-green-600">Shop Now</h3>
                            <p className="text-sm text-gray-600">Browse products</p>
                        </Link>

                        <Link
                            href={route('cart.index')}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center group"
                        >
                            <div className="text-3xl mb-2">🛍️</div>
                            <h3 className="font-medium text-gray-900 group-hover:text-green-600">My Cart</h3>
                            <p className="text-sm text-gray-600">View cart items</p>
                        </Link>

                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center group">
                            <div className="text-3xl mb-2">📦</div>
                            <h3 className="font-medium text-gray-900 group-hover:text-green-600">My Orders</h3>
                            <p className="text-sm text-gray-600">Track orders</p>
                        </button>

                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center group">
                            <div className="text-3xl mb-2">👤</div>
                            <h3 className="font-medium text-gray-900 group-hover:text-green-600">Profile</h3>
                            <p className="text-sm text-gray-600">Edit profile</p>
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">📋 Recent Activity</h2>
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">🎉</div>
                        <h3 className="text-lg font-semibold mb-2">Welcome to TokoMart!</h3>
                        <p className="text-gray-600 mb-6">Start shopping to see your activity here</p>
                        <Link
                            href={route('home')}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
                        >
                            Start Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}