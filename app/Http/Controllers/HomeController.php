<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    /**
     * Display the home page with featured products.
     */
    public function index(Request $request)
    {
        $categories = Category::active()->get();
        
        $productsQuery = Product::with('category')
            ->active()
            ->inStock();

        // Apply category filter
        if ($request->filled('category')) {
            $productsQuery->where('category_id', $request->category);
        }

        // Apply search filter
        if ($request->filled('search')) {
            $productsQuery->where(function ($query) use ($request) {
                $query->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('description', 'like', '%' . $request->search . '%')
                      ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        // Apply price filters
        if ($request->filled('min_price')) {
            $productsQuery->where('price', '>=', $request->min_price);
        }
        
        if ($request->filled('max_price')) {
            $productsQuery->where('price', '<=', $request->max_price);
        }

        // Sort products
        $sort = $request->get('sort', 'newest');
        switch ($sort) {
            case 'price_low':
                $productsQuery->orderBy('price', 'asc');
                break;
            case 'price_high':
                $productsQuery->orderBy('price', 'desc');
                break;
            case 'name':
                $productsQuery->orderBy('name', 'asc');
                break;
            default:
                $productsQuery->orderBy('created_at', 'desc');
        }

        $products = $productsQuery->paginate(12);

        // Get some stats for the welcome message
        $totalProducts = Product::active()->count();
        $totalCategories = Category::active()->count();

        return Inertia::render('welcome', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['category', 'search', 'min_price', 'max_price', 'sort']),
            'stats' => [
                'total_products' => $totalProducts,
                'total_categories' => $totalCategories,
            ],
        ]);
    }
}