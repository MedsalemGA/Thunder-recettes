<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recettes', function (Blueprint $table) {
            $table->integer('temps_cuisson')->nullable()->after('temps_preparation');
            $table->string('difficulte')->default('medium')->after('categorie');
            $table->decimal('rating', 3, 2)->default(4.5)->after('difficulte');
        });
    }

    public function down(): void
    {
        Schema::table('recettes', function (Blueprint $table) {
            $table->dropColumn(['temps_cuisson', 'difficulte', 'rating']);
        });
    }
};
