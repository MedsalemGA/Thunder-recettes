<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Recette;

class RecetteSeeder extends Seeder
{
    public function run(): void
    {
        $recettes = [
            [
                'nom' => 'Poulet au Curry',
                'description' => 'Un classique indien revisité avec des épices fraîches et du lait de coco.',
                'image' => 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500',
                'temps_preparation' => 15,
                'temps_cuisson' => 30,
                'nombre_personnes' => 4,
                'categorie' => 'Indienne',
                'prix' => 45.00,
                'ingredients' => ['Poulet', 'Oignon', 'Ail', 'Sel', 'Poivre']
            ],
            [
                'nom' => 'Riz aux Crevettes',
                'description' => 'Un plat léger et savoureux, parfait pour un dîner rapide.',
                'image' => 'https://images.unsplash.com/photo-1512058560366-cd2429598632?w=500',
                'temps_preparation' => 10,
                'temps_cuisson' => 20,
                'nombre_personnes' => 2,
                'categorie' => 'Asiatique',
                'prix' => 38.00,
                'ingredients' => ['Crevettes', 'Riz', 'Sauce soja', 'Gingembre', 'Oignon']
            ],
            [
                'nom' => 'Pâtes à la Tomate et Saumon',
                'description' => 'Des pâtes al dente accompagnées d\'un saumon grillé et d\'une sauce tomate onctueuse.',
                'image' => 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=500',
                'temps_preparation' => 10,
                'temps_cuisson' => 15,
                'nombre_personnes' => 2,
                'categorie' => 'Italienne',
                'prix' => 52.00,
                'ingredients' => ['Pâtes', 'Saumon', 'Tomate', 'Huile d\'olive', 'Sel']
            ],
            [
                'nom' => 'Salade Vegan au Tofu',
                'description' => 'Une salade croquante et riche en protéines avec du tofu mariné.',
                'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
                'temps_preparation' => 20,
                'temps_cuisson' => 5,
                'nombre_personnes' => 1,
                'categorie' => 'Vegan',
                'prix' => 22.00,
                'ingredients' => ['Tofu', 'Carotte', 'Oignon', 'Huile d\'olive', 'Sel']
            ]
        ];

        foreach ($recettes as $r) {
            Recette::create($r);
        }
    }
}
