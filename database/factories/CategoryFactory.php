<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = [
            'Electronics' => 'Latest gadgets and electronic devices',
            'Fashion' => 'Trendy clothing and accessories',
            'Books' => 'Wide selection of books and magazines',
            'Home & Garden' => 'Everything for your home and garden',
            'Sports & Outdoor' => 'Sports equipment and outdoor gear',
            'Health & Beauty' => 'Health and beauty products',
            'Food & Beverages' => 'Fresh food and beverages',
            'Automotive' => 'Car accessories and automotive parts',
        ];

        $category = fake()->unique()->randomElement(array_keys($categories));
        
        return [
            'name' => $category,
            'description' => $categories[$category],
            'is_active' => true,
        ];
    }
}