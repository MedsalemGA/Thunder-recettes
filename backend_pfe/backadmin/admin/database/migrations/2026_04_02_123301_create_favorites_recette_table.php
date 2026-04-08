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
    Schema::create('favorites_recette', function (Blueprint $table) {
        $table->id();

        $table->unsignedBigInteger('id_recette');
        $table->unsignedBigInteger('id_client');

        $table->timestamps(); // created_at + updated_at

        // relations (important 🔥)
        $table->foreign('id_recette')->references('id')->on('recettes')->onDelete('cascade');
        $table->foreign('id_client')->references('id')->on('clients')->onDelete('cascade');
        $table->unique(['id_recette', 'id_client']);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favorites_recette');
    }
};
