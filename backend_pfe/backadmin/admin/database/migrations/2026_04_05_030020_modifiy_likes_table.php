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
    Schema::table('likes', function (Blueprint $table) {

        // supprimer ancienne clé étrangère
        $table->dropForeign(['client_id']);

        // ajouter la bonne
        $table->foreign('client_id')
              ->references('id')
              ->on('clients')
              ->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};

