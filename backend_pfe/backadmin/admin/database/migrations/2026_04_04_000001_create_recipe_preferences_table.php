<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipe_preferences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Q1 – Cuisine préférée
            $table->string('cuisine_preference')->nullable();
            // Q2 – Objectif alimentaire
            $table->string('objectif_alimentaire')->nullable();
            // Q3 – Niveau d'activité physique
            $table->string('niveau_activite')->nullable();
            // Q4 – Restrictions alimentaires
            $table->string('restrictions_alimentaires')->nullable();
            // Q5 – Niveau de difficulté préféré
            $table->string('niveau_difficulte')->nullable();
            // Q6 – Budget moyen par recette
            $table->string('budget')->nullable();
            // Q7 – Temps disponible pour cuisiner
            $table->string('temps_cuisine')->nullable();
            // Q8 – Type de plat préféré
            $table->string('type_plat')->nullable();
            // Q9 – Nombre de personnes habituel
            $table->string('nb_personnes')->nullable();
            // Q10 – Allergies
            $table->string('allergies')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_preferences');
    }
};

