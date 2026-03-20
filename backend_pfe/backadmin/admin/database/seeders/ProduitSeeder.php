<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Produit;
use App\Models\Fournisseur;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ProduitSeeder extends Seeder
{
    public function run(): void
    {
        // Créer un fournisseur si inexistant
        $user = User::firstOrCreate(
            ['email' => 'fournisseur@thunder.com'],
            [
                'name' => 'Fournisseur Market',
                'password' => Hash::make('password'),
                'role' => 'fournisseur',
                'telephone' => '12345678',
                'adresse' => 'Tunis'
            ]
        );

        $fournisseur = Fournisseur::firstOrCreate(
            ['user_id' => $user->id],
            ['specialite' => 'Alimentation générale', 'code_commercial' => 'F001']
        );

        $ingredients = [
            ['nom' => 'Poulet', 'prix' => 12.50],
            ['nom' => 'Oignon', 'prix' => 1.20],
            ['nom' => 'Ail', 'prix' => 0.50],
            ['nom' => 'Huile d\'olive', 'prix' => 15.00],
            ['nom' => 'Sel', 'prix' => 0.80],
            ['nom' => 'Poivre', 'prix' => 2.50],
            ['nom' => 'Riz', 'prix' => 3.20],
            ['nom' => 'Crevettes', 'prix' => 35.00],
            ['nom' => 'Sauce soja', 'prix' => 6.50],
            ['nom' => 'Gingembre', 'prix' => 4.00],
            ['nom' => 'Tofu', 'prix' => 8.00],
            ['nom' => 'Tomate', 'prix' => 1.80],
            ['nom' => 'Carotte', 'prix' => 1.20],
            ['nom' => 'Pâtes', 'prix' => 1.50],
            ['nom' => 'Saumon', 'prix' => 45.00],
        ];

        foreach ($ingredients as $ing) {
            Produit::create([
                'nom' => $ing['nom'],
                'prix' => $ing['prix'],
                'description' => 'Ingrédient frais pour vos recettes',
                'quantite_stock' => 100,
                'fournisseur_id' => $fournisseur->id,
            ]);
        }
    }
}
