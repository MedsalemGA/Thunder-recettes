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
    Schema::table('fournisseurs', function (Blueprint $table) {
        $table->string('specialite', 100)->nullable()->after('user_id'); // ← after() = position optionnelle
        // Ou sans after() → s'ajoute à la fin
    });
}

public function down(): void
{
    Schema::table('fournisseurs', function (Blueprint $table) {
        $table->dropColumn('specialite');
    });
}
};
