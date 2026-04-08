<?php

namespace Database\Seeders;
    use App\Models\Like;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LikeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */

public function run(): void
{
    for ($productId = 47; $productId <= 71; $productId++) {

        Like::firstOrCreate([
            'client_id' => 1,
            'product_id' => $productId,
        ]);

    }
}
}
