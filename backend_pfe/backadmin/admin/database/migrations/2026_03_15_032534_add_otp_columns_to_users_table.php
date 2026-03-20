<?php
// database/migrations/xxxx_add_otp_columns_to_users_table.php
// Commande : php artisan make:migration add_otp_columns_to_users_table
// Puis copiez ce contenu dedans

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Seulement les colonnes OTP manquantes
            // telephone, adresse, role sont déjà dans votre modèle donc probablement en DB
            if (!Schema::hasColumn('users', 'otp_code')) {
                $table->string('otp_code', 6)->nullable()->after('role');
            }
            if (!Schema::hasColumn('users', 'otp_expires_at')) {
                $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumnIfExists(['otp_code', 'otp_expires_at']);
        });
    }
};