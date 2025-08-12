<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(random_int(2, 4), true),
            'code' => 'PRD-' . strtoupper(fake()->unique()->bothify('???###')),
            'description' => fake()->paragraphs(random_int(2, 4), true),
            'price' => fake()->randomFloat(2, 10000, 5000000), // IDR 10,000 to 5,000,000
            'stock' => fake()->numberBetween(0, 100),
            'weight' => fake()->randomFloat(2, 100, 5000), // 100g to 5kg
            'category_id' => Category::factory(),
            'images' => null, // We'll use placeholder images
            'is_active' => fake()->boolean(90), // 90% chance of being active
        ];
    }
}