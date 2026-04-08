<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */

    public function up(): void
    {
        Schema::create('recipe_ratings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('client_id')
                  ->constrained('clients')
                  ->onDelete('cascade');

            $table->foreignId('recette_id')
                  ->constrained('recettes')
                  ->onDelete('cascade');

            $table->integer('rate'); // 1 à 5

            $table->timestamps();

            // 🔥 empêche double vote
            $table->unique(['client_id', 'recette_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_ratings');
    }
};
    /**
     * Reverse the migrations.
     */
    

