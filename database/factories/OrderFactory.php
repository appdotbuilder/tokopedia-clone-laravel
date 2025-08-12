<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 50000, 2000000);
        $shippingCost = fake()->randomFloat(2, 10000, 50000);
        
        return [
            'order_number' => Order::generateOrderNumber(),
            'user_id' => User::factory(),
            'status' => fake()->randomElement(['pending', 'paid', 'processing', 'shipped', 'delivered']),
            'subtotal' => $subtotal,
            'shipping_cost' => $shippingCost,
            'total' => $subtotal + $shippingCost,
            'payment_method' => fake()->randomElement(['credit_card', 'bank_transfer', 'digital_wallet']),
            'payment_status' => fake()->randomElement(['pending', 'paid', 'failed']),
            'payment_reference' => fake()->uuid(),
            'shipping_address' => [
                'name' => fake()->name(),
                'phone' => fake()->phoneNumber(),
                'address' => fake()->streetAddress(),
                'city' => fake()->city(),
                'postal_code' => fake()->postcode(),
                'province' => fake()->randomElement(['DKI Jakarta', 'Jawa Barat', 'Jawa Timur', 'Sumatera Utara', 'Bali']),
            ],
            'courier' => fake()->randomElement(['JNE', 'TIKI', 'POS', 'SiCepat']),
            'tracking_number' => fake()->optional()->regexify('[A-Z]{3}[0-9]{10}'),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}