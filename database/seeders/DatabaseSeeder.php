<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@tokomart.com',
            'role' => 'admin',
            'phone' => '+62123456789',
            'address' => 'Jakarta, Indonesia',
        ]);

        // Create some customer users
        $customers = User::factory(10)->create([
            'role' => 'customer',
        ]);

        // Create categories
        $categories = Category::factory(8)->create();

        // Create products for each category
        foreach ($categories as $category) {
            Product::factory(random_int(5, 15))->create([
                'category_id' => $category->id,
            ]);
        }

        // Add some featured products with better names and descriptions
        $featuredProducts = [
            [
                'name' => 'iPhone 15 Pro Max',
                'code' => 'APPLE-IP15PM-256',
                'description' => 'The latest iPhone with A17 Pro chip, titanium design, and advanced camera system. Features 6.7-inch Super Retina XDR display.',
                'price' => 18999000,
                'stock' => 25,
                'weight' => 221,
                'category_id' => $categories->where('name', 'Electronics')->first()->id ?? $categories->first()->id,
            ],
            [
                'name' => 'Samsung Galaxy S24 Ultra',
                'code' => 'SAMSUNG-S24U-512',
                'description' => 'Premium Android smartphone with S Pen, 200MP camera, and 5000mAh battery. Perfect for productivity and photography.',
                'price' => 16999000,
                'stock' => 30,
                'weight' => 232,
                'category_id' => $categories->where('name', 'Electronics')->first()->id ?? $categories->first()->id,
            ],
            [
                'name' => 'Nike Air Force 1',
                'code' => 'NIKE-AF1-WHITE-42',
                'description' => 'Classic white leather sneakers that go with everything. Comfortable and stylish for everyday wear.',
                'price' => 1299000,
                'stock' => 50,
                'weight' => 800,
                'category_id' => $categories->where('name', 'Fashion')->first()->id ?? $categories->first()->id,
            ],
            [
                'name' => 'MacBook Air M2',
                'code' => 'APPLE-MBA-M2-256',
                'description' => 'Ultra-thin laptop with M2 chip, 13.6-inch Liquid Retina display, and all-day battery life. Perfect for work and creativity.',
                'price' => 18999000,
                'stock' => 15,
                'weight' => 1240,
                'category_id' => $categories->where('name', 'Electronics')->first()->id ?? $categories->first()->id,
            ],
            [
                'name' => 'The Psychology of Money',
                'code' => 'BOOK-POM-EN',
                'description' => 'Timeless lessons on wealth, greed, and happiness by Morgan Housel. A must-read for anyone interested in personal finance.',
                'price' => 189000,
                'stock' => 100,
                'weight' => 350,
                'category_id' => $categories->where('name', 'Books')->first()->id ?? $categories->first()->id,
            ]
        ];

        foreach ($featuredProducts as $productData) {
            Product::create($productData);
        }

        $this->command->info('Database seeded successfully!');
        $this->command->info('Admin credentials: admin@tokomart.com');
        $this->command->info('Categories created: ' . $categories->count());
        $this->command->info('Products created: ' . Product::count());
        $this->command->info('Users created: ' . User::count());
    }
}