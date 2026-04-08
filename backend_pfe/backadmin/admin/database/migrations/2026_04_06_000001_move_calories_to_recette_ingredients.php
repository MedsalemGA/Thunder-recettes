<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ajouter calories_100g à recette_ingredients
        Schema::table('recette_ingredients', function (Blueprint $table) {
            $table->decimal('calories_100g', 8, 2)->nullable()->default(0)->after('unite');
        });

        // 2. Supprimer calories_100g de produits (si elle existe)
        if (Schema::hasColumn('produits', 'calories_100g')) {
            Schema::table('produits', function (Blueprint $table) {
                $table->dropColumn('calories_100g');
            });
        }
    }

    public function down(): void
    {
        // Remettre calories_100g dans produits
        Schema::table('produits', function (Blueprint $table) {
            $table->decimal('calories_100g', 8, 2)->nullable()->default(0)->after('quantite_stock');
        });

        // Supprimer de recette_ingredients
        Schema::table('recette_ingredients', function (Blueprint $table) {
            $table->dropColumn('calories_100g');
        });
    }
};

