<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ShoppingCartController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/health-check', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
    ]);
})->name('health-check');

// Home page with product listing
Route::get('/', [HomeController::class, 'index'])->name('home');

// Product routes
Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');

// Shopping cart routes (requires authentication)
Route::middleware(['auth'])->group(function () {
    Route::get('/cart', [ShoppingCartController::class, 'index'])->name('cart.index');
    Route::post('/cart', [ShoppingCartController::class, 'store'])->name('cart.store');
    Route::patch('/cart/{cart}', [ShoppingCartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{cart}', [ShoppingCartController::class, 'destroy'])->name('cart.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';