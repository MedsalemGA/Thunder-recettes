<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carte_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('carte_id')->constrained('cartes')->onDelete('cascade');
            $table->foreignId('produit_id')->constrained('produits')->onDelete('cascade');
            $table->foreignId('recette_id')->nullable()->constrained('recettes')->onDelete('set null');
            $table->string('nom_ingredient');
            $table->decimal('quantite', 10, 2)->default(1);
            $table->string('unite')->default('unité');
            $table->decimal('prix_unitaire', 8, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carte_items');
    }
};

