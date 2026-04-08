<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Recette;
use App\Models\Produit;
use App\Models\RecetteIngredient;

class RecetteSeeder extends Seeder
{
    /** @var array<string,int> Cache produit nom → id */
    private array $produitIds = [];

    public function run(): void
    {
        // Charger tous les produits en mémoire pour éviter N+1
        foreach (Produit::all(['id', 'nom']) as $p) {
            $this->produitIds[$p->nom] = $p->id;
        }

        $recettes = $this->getRecettes();

        foreach ($recettes as $data) {
            $ingredients = $data['ingredients'];
            unset($data['ingredients']);

            $recette = Recette::firstOrCreate(['nom' => $data['nom']], $data);

            // Supprimer les anciens ingrédients pour idempotence
            RecetteIngredient::where('recette_id', $recette->id)->delete();

            foreach ($ingredients as $ing) {
                $produitId = $this->produitIds[$ing['nom']] ?? null;
                RecetteIngredient::create([
                    'recette_id'     => $recette->id,
                    'produit_id'     => $produitId,
                    'nom_ingredient' => $ing['nom'],
                    'quantite'       => $ing['quantite'],
                    'unite'          => $ing['unite'],
                    'calories_100g'  => $ing['cal'] ?? 0,
                ]);
            }
        }
    }

    private function getRecettes(): array
    {
        return [
            // ═══════════════════════════════════════════════════
            //  TUNISIENNE
            // ═══════════════════════════════════════════════════
            [
                'nom'               => 'Couscous au Poulet',
                'description'       => 'Le plat emblématique tunisien, un couscous moelleux cuit à la vapeur avec du poulet tendre et des légumes de saison.',
                'image'             => 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500',
                'temps_preparation' => 30, 'temps_cuisson' => 60,
                'nombre_personnes'  => 6, 'categorie' => 'Tunisienne',
                'difficulte'        => 'medium', 'rating' => 4.8,
                'instructions'      => [
                    'Faire revenir le poulet avec l\'oignon et l\'ail.',
                    'Ajouter les carottes, courgettes et pommes de terre.',
                    'Couvrir d\'eau, assaisonner avec le cumin, sel et poivre.',
                    'Cuire le couscous à la vapeur pendant 20 minutes.',
                    'Servir le couscous avec la viande et les légumes.',
                ],
                'ingredients' => [
                    ['nom' => 'Poulet',         'quantite' => 1000, 'unite' => 'g',  'cal' => 165],
                    ['nom' => 'Couscous',       'quantite' => 500,  'unite' => 'g',  'cal' => 376],
                    ['nom' => 'Carotte',        'quantite' => 300,  'unite' => 'g',  'cal' => 41],
                    ['nom' => 'Courgette',      'quantite' => 300,  'unite' => 'g',  'cal' => 17],
                    ['nom' => 'Pomme de terre', 'quantite' => 400,  'unite' => 'g',  'cal' => 77],
                    ['nom' => 'Oignon',         'quantite' => 150,  'unite' => 'g',  'cal' => 40],
                    ['nom' => 'Cumin',          'quantite' => 10,   'unite' => 'g',  'cal' => 375],
                    ['nom' => 'Sel',            'quantite' => 10,   'unite' => 'g',  'cal' => 0],
                    ['nom' => "Huile d'olive",  'quantite' => 50,   'unite' => 'ml', 'cal' => 884],
                ],
            ],
            [
                'nom'               => 'Chorba Tunisienne',
                'description'       => 'Soupe épaisse et parfumée à base d\'agneau, de tomates et de vermicelles, idéale pour les soirées fraîches.',
                'image'             => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500',
                'temps_preparation' => 20, 'temps_cuisson' => 45,
                'nombre_personnes'  => 4, 'categorie' => 'Tunisienne',
                'difficulte'        => 'easy', 'rating' => 4.6,
                'instructions'      => [
                    'Faire revenir l\'agneau en morceaux avec l\'oignon.',
                    'Ajouter les tomates concassées et la harissa.',
                    'Couvrir d\'eau et laisser mijoter 30 minutes.',
                    'Ajouter les pâtes et cuire 10 minutes supplémentaires.',
                    'Rectifier l\'assaisonnement et servir chaud avec du citron.',
                ],
                'ingredients' => [
                    ['nom' => 'Agneau',   'quantite' => 500,  'unite' => 'g',  'cal' => 294],
                    ['nom' => 'Tomate',   'quantite' => 400,  'unite' => 'g',  'cal' => 18],
                    ['nom' => 'Oignon',   'quantite' => 100,  'unite' => 'g',  'cal' => 40],
                    ['nom' => 'Harissa',  'quantite' => 30,   'unite' => 'g',  'cal' => 50],
                    ['nom' => 'Pâtes',    'quantite' => 100,  'unite' => 'g',  'cal' => 370],
                    ['nom' => 'Citron',   'quantite' => 50,   'unite' => 'g',  'cal' => 29],
                    ['nom' => 'Cumin',    'quantite' => 5,    'unite' => 'g',  'cal' => 375],
                    ['nom' => 'Sel',      'quantite' => 5,    'unite' => 'g',  'cal' => 0],
                ],
            ],
            [
                'nom'               => 'Tajine Merguez aux Poivrons',
                'description'       => 'Un tajine tunisien coloré avec des merguez épicées, des poivrons rouges et des tomates, cuit lentement.',
                'image'             => 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500',
                'temps_preparation' => 15, 'temps_cuisson' => 35,
                'nombre_personnes'  => 4, 'categorie' => 'Tunisienne',
                'difficulte'        => 'easy', 'rating' => 4.5,
                'instructions'      => [
                    'Faire griller les merguez dans une poêle.',
                    'Faire revenir les poivrons et l\'oignon.',
                    'Ajouter les tomates et la harissa.',
                    'Ajouter les merguez et laisser mijoter 20 minutes.',
                    'Servir chaud avec du pain.',
                ],
                'ingredients' => [
                    ['nom' => 'Merguez',       'quantite' => 500,  'unite' => 'g',  'cal' => 280],
                    ['nom' => 'Poivron rouge',  'quantite' => 300,  'unite' => 'g',  'cal' => 31],
                    ['nom' => 'Tomate',         'quantite' => 300,  'unite' => 'g',  'cal' => 18],
                    ['nom' => 'Oignon',         'quantite' => 100,  'unite' => 'g',  'cal' => 40],
                    ['nom' => 'Harissa',        'quantite' => 20,   'unite' => 'g',  'cal' => 50],
                    ["nom" => "Huile d'olive",  'quantite' => 30,   'unite' => 'ml', 'cal' => 884],
                ],
            ],

            // ═══════════════════════════════════════════════════
            //  ITALIENNE
            // ═══════════════════════════════════════════════════
            [
                'nom'               => 'Pasta Bolognaise',
                'description'       => 'La vraie recette italienne : pâtes al dente avec une sauce viande hachée mijotée aux tomates et aux herbes.',
                'image'             => 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=500',
                'temps_preparation' => 10, 'temps_cuisson' => 40,
                'nombre_personnes'  => 4, 'categorie' => 'Italienne',
                'difficulte'        => 'easy', 'rating' => 4.7,
                'instructions'      => [
                    'Faire revenir l\'oignon et l\'ail dans l\'huile d\'olive.',
                    'Ajouter la viande hachée et faire dorer.',
                    'Incorporer les tomates concassées, sel et poivre.',
                    'Laisser mijoter 30 minutes à feu doux.',
                    'Cuire les pâtes et servir avec la sauce.',
                ],
                'ingredients' => [
                    ['nom' => 'Pâtes',          'quantite' => 400, 'unite' => 'g',  'cal' => 370],
                    ['nom' => 'Viande hachée',  'quantite' => 400, 'unite' => 'g',  'cal' => 250],
                    ['nom' => 'Tomate',         'quantite' => 400, 'unite' => 'g',  'cal' => 18],
                    ['nom' => 'Oignon',         'quantite' => 100, 'unite' => 'g',  'cal' => 40],
                    ['nom' => 'Ail',            'quantite' => 20,  'unite' => 'g',  'cal' => 149],
                    ["nom" => "Huile d'olive",  'quantite' => 40,  'unite' => 'ml', 'cal' => 884],
                    ['nom' => 'Sel',            'quantite' => 5,   'unite' => 'g',  'cal' => 0],
                    ['nom' => 'Poivre noir',    'quantite' => 3,   'unite' => 'g',  'cal' => 251],
                ],
            ],
            [
                'nom'               => 'Pâtes au Saumon Crème',
                'description'       => 'Pâtes onctueuses avec du saumon frais et une crème légère au citron. Prêt en 20 minutes.',
                'image'             => 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=500',
                'temps_preparation' => 10, 'temps_cuisson' => 15,
                'nombre_personnes'  => 2, 'categorie' => 'Italienne',
                'difficulte'        => 'easy', 'rating' => 4.6,
                'instructions'      => [
                    'Cuire les pâtes al dente.',
                    'Faire revenir le saumon coupé en dés.',
                    'Ajouter la crème fraîche et le jus de citron.',
                    'Mélanger avec les pâtes égouttées.',
                    'Servir avec du poivre fraîchement moulu.',
                ],
                'ingredients' => [
                    ['nom' => 'Pâtes',         'quantite' => 250, 'unite' => 'g',  'cal' => 370],
                    ['nom' => 'Saumon',         'quantite' => 300, 'unite' => 'g',  'cal' => 208],
                    ['nom' => 'Crème fraîche',  'quantite' => 150, 'unite' => 'ml', 'cal' => 292],
                    ['nom' => 'Citron',         'quantite' => 50,  'unite' => 'g',  'cal' => 29],
                    ['nom' => 'Ail',            'quantite' => 10,  'unite' => 'g',  'cal' => 149],
                    ['nom' => 'Sel',            'quantite' => 5,   'unite' => 'g',  'cal' => 0],
                    ['nom' => 'Poivre noir',    'quantite' => 2,   'unite' => 'g',  'cal' => 251],
                ],
            ],

            // ═══════════════════════════════════════════════════
            //  ASIATIQUE
            // ═══════════════════════════════════════════════════
            [
                'nom'               => 'Riz Sauté aux Crevettes',
                'description'       => 'Un classique de la cuisine asiatique : riz sauté à la wok avec des crevettes juteuses et de la sauce soja.',
                'image'             => 'https://images.unsplash.com/photo-1512058560366-cd2429598632?w=500',
                'temps_preparation' => 10, 'temps_cuisson' => 15,
                'nombre_personnes'  => 2, 'categorie' => 'Asiatique',
                'difficulte'        => 'easy', 'rating' => 4.5,
                'instructions'      => [
                    'Cuire le riz et laisser refroidir.',
                    'Faire sauter les crevettes avec l\'ail et le gingembre.',
                    'Ajouter le riz froid et la sauce soja.',
                    'Incorporer les carottes et poivrons.',
                    'Servir chaud.',
                ],
                'ingredients' => [
                    ['nom' => 'Riz',          'quantite' => 250, 'unite' => 'g',  'cal' => 365],
                    ['nom' => 'Crevettes',    'quantite' => 300, 'unite' => 'g',  'cal' => 99],
                    ['nom' => 'Sauce soja',   'quantite' => 50,  'unite' => 'ml', 'cal' => 53],
                    ['nom' => 'Gingembre',    'quantite' => 15,  'unite' => 'g',  'cal' => 80],
                    ['nom' => 'Ail',          'quantite' => 10,  'unite' => 'g',  'cal' => 149],
                    ['nom' => 'Carotte',      'quantite' => 100, 'unite' => 'g',  'cal' => 41],
                    ['nom' => 'Poivron rouge','quantite' => 100, 'unite' => 'g',  'cal' => 31],
                ],
            ],
            [
                'nom'               => 'Curry Thaï au Poulet',
                'description'       => 'Curry parfumé à la citronnelle avec du poulet tendre et des légumes croquants dans une sauce onctueuse.',
                'image'             => 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500',
                'temps_preparation' => 15, 'temps_cuisson' => 25,
                'nombre_personnes'  => 3, 'categorie' => 'Asiatique',
                'difficulte'        => 'medium', 'rating' => 4.7,
                'instructions'      => [
                    'Faire revenir le poulet avec l\'ail et le gingembre.',
                    'Ajouter les poivrons et courgettes.',
                    'Incorporer la crème et assaisonner.',
                    'Laisser mijoter 15 minutes.',
                    'Servir avec du riz nature.',
                ],
                'ingredients' => [
                    ['nom' => 'Poulet',        'quantite' => 500, 'unite' => 'g',  'cal' => 165],
                    ['nom' => 'Riz',           'quantite' => 300, 'unite' => 'g',  'cal' => 365],
                    ['nom' => 'Poivron rouge', 'quantite' => 200, 'unite' => 'g',  'cal' => 31],
                    ['nom' => 'Courgette',     'quantite' => 200, 'unite' => 'g',  'cal' => 17],
                    ['nom' => 'Crème fraîche', 'quantite' => 150, 'unite' => 'ml', 'cal' => 292],
                    ['nom' => 'Gingembre',     'quantite' => 20,  'unite' => 'g',  'cal' => 80],
                    ['nom' => 'Ail',           'quantite' => 15,  'unite' => 'g',  'cal' => 149],
                    ['nom' => 'Sauce soja',    'quantite' => 30,  'unite' => 'ml', 'cal' => 53],
                    ['nom' => 'Paprika',       'quantite' => 5,   'unite' => 'g',  'cal' => 289],
                ],
            ],
            [
                'nom'               => 'Wok de Légumes au Tofu',
                'description'       => 'Un wok coloré et healthy avec du tofu croustillant, des légumes variés et une sauce soja parfumée.',
                'image'             => 'https://images.unsplash.com/photo-1512003867696-6d5ce6835040?w=500',
                'temps_preparation' => 15, 'temps_cuisson' => 10,
                'nombre_personnes'  => 2, 'categorie' => 'Asiatique',
                'difficulte'        => 'easy', 'rating' => 4.3,
                'instructions'      => [
                    'Faire dorer le tofu en dés dans l\'huile chaude.',
                    'Réserver le tofu et faire sauter les légumes.',
                    'Ajouter la sauce soja et le gingembre.',
                    'Remettre le tofu et mélanger.',
                    'Servir avec du riz.',
                ],
                'ingredients' => [
                    ['nom' => 'Tofu',          'quantite' => 300, 'unite' => 'g',  'cal' => 76],
                    ['nom' => 'Carotte',       'quantite' => 150, 'unite' => 'g',  'cal' => 41],
                    ['nom' => 'Poivron rouge', 'quantite' => 150, 'unite' => 'g',  'cal' => 31],
                    ['nom' => 'Courgette',     'quantite' => 150, 'unite' => 'g',  'cal' => 17],
                    ['nom' => 'Sauce soja',    'quantite' => 60,  'unite' => 'ml', 'cal' => 53],
                    ['nom' => 'Gingembre',     'quantite' => 10,  'unite' => 'g',  'cal' => 80],
                    ["nom" => "Huile d'olive", 'quantite' => 30,  'unite' => 'ml', 'cal' => 884],
                ],
            ],

            // ═══════════════════════════════════════════════════
            //  INDIENNE
            // ═══════════════════════════════════════════════════
            [
                'nom'               => 'Poulet Tikka Masala',
                'description'       => 'Le plat indien le plus populaire : poulet mariné aux épices, grillé puis mijoté dans une sauce tomate crémeuse.',
                'image'             => 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500',
                'temps_preparation' => 20, 'temps_cuisson' => 35,
                'nombre_personnes'  => 4, 'categorie' => 'Indienne',
                'difficulte'        => 'medium', 'rating' => 4.9,
                'instructions'      => [
                    'Mariner le poulet avec le paprika, cumin, ail et gingembre.',
                    'Griller le poulet au four 15 minutes.',
                    'Préparer la sauce : oignon, tomates, crème.',
                    'Ajouter le poulet grillé à la sauce.',
                    'Laisser mijoter 20 minutes et servir avec du riz.',
                ],
                'ingredients' => [
                    ['nom' => 'Poulet',        'quantite' => 800, 'unite' => 'g',  'cal' => 165],
                    ['nom' => 'Tomate',        'quantite' => 400, 'unite' => 'g',  'cal' => 18],
                    ['nom' => 'Oignon',        'quantite' => 150, 'unite' => 'g',  'cal' => 40],
                    ['nom' => 'Ail',           'quantite' => 20,  'unite' => 'g',  'cal' => 149],
                    ['nom' => 'Gingembre',     'quantite' => 20,  'unite' => 'g',  'cal' => 80],
                    ['nom' => 'Paprika',       'quantite' => 15,  'unite' => 'g',  'cal' => 289],
                    ['nom' => 'Cumin',         'quantite' => 10,  'unite' => 'g',  'cal' => 375],
                    ['nom' => 'Crème fraîche', 'quantite' => 200, 'unite' => 'ml', 'cal' => 292],
                    ['nom' => 'Riz',           'quantite' => 300, 'unite' => 'g',  'cal' => 365],
                ],
            ],
            [
                'nom'               => 'Dal aux Lentilles',
                'description'       => 'Le comfort food indien par excellence : lentilles épicées cuites avec du gingembre, cumin et coriandre.',
                'image'             => 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
                'temps_preparation' => 10, 'temps_cuisson' => 30,
                'nombre_personnes'  => 4, 'categorie' => 'Indienne',
                'difficulte'        => 'easy', 'rating' => 4.4,
                'instructions'      => [
                    'Rincer les lentilles et les faire cuire.',
                    'Faire revenir l\'oignon, l\'ail et le gingembre.',
                    'Ajouter cumin et paprika.',
                    'Incorporer les lentilles et les tomates.',
                    'Laisser mijoter 15 minutes et servir avec du riz.',
                ],
                'ingredients' => [
                    ['nom' => 'Lentilles',  'quantite' => 400, 'unite' => 'g', 'cal' => 353],
                    ['nom' => 'Tomate',     'quantite' => 250, 'unite' => 'g', 'cal' => 18],
                    ['nom' => 'Oignon',     'quantite' => 100, 'unite' => 'g', 'cal' => 40],
                    ['nom' => 'Ail',        'quantite' => 15,  'unite' => 'g', 'cal' => 149],
                    ['nom' => 'Gingembre',  'quantite' => 15,  'unite' => 'g', 'cal' => 80],
                    ['nom' => 'Cumin',      'quantite' => 10,  'unite' => 'g', 'cal' => 375],
                    ['nom' => 'Paprika',    'quantite' => 5,   'unite' => 'g', 'cal' => 289],
                    ['nom' => 'Riz',        'quantite' => 300, 'unite' => 'g', 'cal' => 365],
                ],
            ],

            // ═══════════════════════════════════════════════════
            //  VEGAN
            // ═══════════════════════════════════════════════════
            [
                'nom'               => 'Buddha Bowl aux Légumes Rôtis',
                'description'       => 'Un bol nutritif et coloré avec du riz, des légumes rôtis au four et une sauce tahini maison.',
                'image'             => 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
                'temps_preparation' => 15, 'temps_cuisson' => 25,
                'nombre_personnes'  => 2, 'categorie' => 'Vegan',
                'difficulte'        => 'easy', 'rating' => 4.6,
                'instructions'      => [
                    'Couper les légumes en morceaux et les assaisonner.',
                    'Rôtir au four à 200°C pendant 25 minutes.',
                    'Cuire le riz.',
                    'Préparer la sauce soja-citron.',
                    'Assembler le bol : riz, légumes, sauce.',
                ],
                'ingredients' => [
                    ['nom' => 'Riz',           'quantite' => 200, 'unite' => 'g',  'cal' => 365],
                    ['nom' => 'Aubergine',     'quantite' => 200, 'unite' => 'g',  'cal' => 25],
                    ['nom' => 'Courgette',     'quantite' => 200, 'unite' => 'g',  'cal' => 17],
                    ['nom' => 'Carotte',       'quantite' => 150, 'unite' => 'g',  'cal' => 41],
                    ['nom' => 'Poivron rouge', 'quantite' => 150, 'unite' => 'g',  'cal' => 31],
                    ['nom' => 'Pois chiches',  'quantite' => 200, 'unite' => 'g',  'cal' => 364],
                    ["nom" => "Huile d'olive", 'quantite' => 40,  'unite' => 'ml', 'cal' => 884],
                    ['nom' => 'Sauce soja',    'quantite' => 30,  'unite' => 'ml', 'cal' => 53],
                    ['nom' => 'Citron',        'quantite' => 50,  'unite' => 'g',  'cal' => 29],
                ],
            ],
            [
                'nom'               => 'Curry de Légumes Vegan',
                'description'       => 'Curry riche et savoureux à base de légumes variés, de pois chiches et d\'épices parfumées.',
                'image'             => 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=500',
                'temps_preparation' => 15, 'temps_cuisson' => 30,
                'nombre_personnes'  => 4, 'categorie' => 'Vegan',
                'difficulte'        => 'easy', 'rating' => 4.5,
                'instructions'      => [
                    'Faire revenir l\'oignon, l\'ail et le gingembre.',
                    'Ajouter cumin, paprika et tomates.',
                    'Incorporer pois chiches et légumes.',
                    'Couvrir et laisser mijoter 25 minutes.',
                    'Servir avec du riz.',
                ],
                'ingredients' => [
                    ['nom' => 'Pois chiches', 'quantite' => 400, 'unite' => 'g', 'cal' => 364],
                    ['nom' => 'Tomate',       'quantite' => 300, 'unite' => 'g', 'cal' => 18],
                    ['nom' => 'Épinard',      'quantite' => 150, 'unite' => 'g', 'cal' => 23],
                    ['nom' => 'Oignon',       'quantite' => 100, 'unite' => 'g', 'cal' => 40],
                    ['nom' => 'Ail',          'quantite' => 15,  'unite' => 'g', 'cal' => 149],
                    ['nom' => 'Gingembre',    'quantite' => 10,  'unite' => 'g', 'cal' => 80],
                    ['nom' => 'Cumin',        'quantite' => 10,  'unite' => 'g', 'cal' => 375],
                    ['nom' => 'Paprika',      'quantite' => 8,   'unite' => 'g', 'cal' => 289],
                    ['nom' => 'Riz',          'quantite' => 300, 'unite' => 'g', 'cal' => 365],
                ],
            ],
            [
                'nom'               => 'Salade Vegan au Tofu Grillé',
                'description'       => 'Salade colorée et riche en protéines avec du tofu mariné grillé, des légumes frais et une vinaigrette légère.',
                'image'             => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
                'temps_preparation' => 20, 'temps_cuisson' => 10,
                'nombre_personnes'  => 2, 'categorie' => 'Vegan',
                'difficulte'        => 'easy', 'rating' => 4.3,
                'instructions'      => [
                    'Mariner le tofu dans la sauce soja et le gingembre.',
                    'Faire griller le tofu à la poêle.',
                    'Couper les légumes en julienne.',
                    'Préparer la vinaigrette huile-citron-soja.',
                    'Assembler la salade et servir.',
                ],
                'ingredients' => [
                    ['nom' => 'Tofu',          'quantite' => 250, 'unite' => 'g',  'cal' => 76],
                    ['nom' => 'Carotte',       'quantite' => 100, 'unite' => 'g',  'cal' => 41],
                    ['nom' => 'Épinard',       'quantite' => 80,  'unite' => 'g',  'cal' => 23],
                    ['nom' => 'Sauce soja',    'quantite' => 40,  'unite' => 'ml', 'cal' => 53],
                    ["nom"=> "Huile d'olive",  'quantite' => 30,  'unite' => 'ml', 'cal' => 884],
                    ['nom' => 'Citron',        'quantite' => 50,  'unite' => 'g',  'cal' => 29],
                    ['nom' => 'Gingembre',     'quantite' => 10,  'unite' => 'g',  'cal' => 80],
                ],
            ],

            // ═══════════════════════════════════════════════════
            //  MÉDITERRANÉENNE
            // ═══════════════════════════════════════════════════
            [
                'nom'               => 'Gratin de Courgettes au Fromage',
                'description'       => 'Un gratin gratinant avec des courgettes tendres, de la crème et du fromage fondu. Parfait comme plat principal ou accompagnement.',
                'image'             => 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500',
                'temps_preparation' => 15, 'temps_cuisson' => 35,
                'nombre_personnes'  => 4, 'categorie' => 'Méditerranéenne',
                'difficulte'        => 'easy', 'rating' => 4.4,
                'instructions'      => [
                    'Trancher les courgettes en rondelles.',
                    'Disposer en couches dans un plat beurré.',
                    'Verser la crème fraîche assaisonnée.',
                    'Couvrir de fromage râpé.',
                    'Cuire au four à 180°C pendant 35 minutes.',
                ],
                'ingredients' => [
                    ['nom' => 'Courgette',    'quantite' => 800, 'unite' => 'g',  'cal' => 17],
                    ['nom' => 'Crème fraîche','quantite' => 200, 'unite' => 'ml', 'cal' => 292],
                    ['nom' => 'Fromage',      'quantite' => 150, 'unite' => 'g',  'cal' => 350],
                    ['nom' => 'Beurre',       'quantite' => 30,  'unite' => 'g',  'cal' => 717],
                    ['nom' => 'Ail',          'quantite' => 10,  'unite' => 'g',  'cal' => 149],
                    ['nom' => 'Sel',          'quantite' => 5,   'unite' => 'g',  'cal' => 0],
                    ['nom' => 'Poivre noir',  'quantite' => 2,   'unite' => 'g',  'cal' => 251],
                ],
            ],
            [
                'nom'               => 'Thon à la Méditerranéenne',
                'description'       => 'Thon frais poêlé avec une vierge de tomates, olives, citron et herbes fraîches. Simple et élégant.',
                'image'             => 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500',
                'temps_preparation' => 10, 'temps_cuisson' => 10,
                'nombre_personnes'  => 2, 'categorie' => 'Méditerranéenne',
                'difficulte'        => 'easy', 'rating' => 4.5,
                'instructions'      => [
                    'Assaisonner les steaks de thon.',
                    'Saisir à la poêle bien chaude 3 min de chaque côté.',
                    'Préparer la vierge : tomates, oignon, citron, huile.',
                    'Dresser le thon avec la vierge.',
                    'Servir immédiatement.',
                ],
                'ingredients' => [
                    ['nom' => 'Thon frais',    'quantite' => 400, 'unite' => 'g',  'cal' => 144],
                    ['nom' => 'Tomate',        'quantite' => 200, 'unite' => 'g',  'cal' => 18],
                    ['nom' => 'Oignon',        'quantite' => 80,  'unite' => 'g',  'cal' => 40],
                    ['nom' => 'Citron',        'quantite' => 60,  'unite' => 'g',  'cal' => 29],
                    ["nom" => "Huile d'olive", 'quantite' => 40,  'unite' => 'ml', 'cal' => 884],
                    ['nom' => 'Sel',           'quantite' => 5,   'unite' => 'g',  'cal' => 0],
                    ['nom' => 'Poivre noir',   'quantite' => 2,   'unite' => 'g',  'cal' => 251],
                ],
            ],

            // ═══════════════════════════════════════════════════
            //  MAROCAINE
            // ═══════════════════════════════════════════════════
            [
                'nom'               => "Tajine d'Agneau aux Légumes",
                'description'       => "Un tajine marocain authentique avec de l'agneau fondant, des légumes de saison et des épices parfumées.",
                'image'             => 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=500',
                'temps_preparation' => 20, 'temps_cuisson' => 90,
                'nombre_personnes'  => 4, 'categorie' => 'Marocaine',
                'difficulte'        => 'medium', 'rating' => 4.8,
                'instructions'      => [
                    'Faire dorer les morceaux d\'agneau avec l\'oignon.',
                    'Ajouter cumin, paprika, gingembre.',
                    'Incorporer carottes et pommes de terre.',
                    'Couvrir et cuire à feu doux 1h30.',
                    'Garnir de citron et servir.',
                ],
                'ingredients' => [
                    ['nom' => 'Agneau',         'quantite' => 800, 'unite' => 'g',  'cal' => 294],
                    ['nom' => 'Carotte',        'quantite' => 300, 'unite' => 'g',  'cal' => 41],
                    ['nom' => 'Pomme de terre', 'quantite' => 400, 'unite' => 'g',  'cal' => 77],
                    ['nom' => 'Oignon',         'quantite' => 150, 'unite' => 'g',  'cal' => 40],
                    ['nom' => 'Tomate',         'quantite' => 200, 'unite' => 'g',  'cal' => 18],
                    ['nom' => 'Cumin',          'quantite' => 10,  'unite' => 'g',  'cal' => 375],
                    ['nom' => 'Gingembre',      'quantite' => 10,  'unite' => 'g',  'cal' => 80],
                    ['nom' => 'Paprika',        'quantite' => 8,   'unite' => 'g',  'cal' => 289],
                    ['nom' => 'Citron',         'quantite' => 60,  'unite' => 'g',  'cal' => 29],
                    ["nom"=> "Huile d'olive",   'quantite' => 50,  'unite' => 'ml', 'cal' => 884],
                ],
            ],
            [
                'nom'               => 'Harira Marocaine',
                'description'       => 'La soupe marocaine par excellence : bouillon riche avec lentilles, pois chiches, viande et tomates.',
                'image'             => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500',
                'temps_preparation' => 20, 'temps_cuisson' => 50,
                'nombre_personnes'  => 6, 'categorie' => 'Marocaine',
                'difficulte'        => 'medium', 'rating' => 4.7,
                'instructions'      => [
                    'Faire revenir la viande hachée avec l\'oignon.',
                    'Ajouter lentilles, pois chiches et tomates.',
                    'Assaisonner avec cumin, paprika et gingembre.',
                    'Couvrir d\'eau et laisser mijoter 40 minutes.',
                    'Servir avec des dattes et du citron.',
                ],
                'ingredients' => [
                    ['nom' => 'Viande hachée', 'quantite' => 300, 'unite' => 'g', 'cal' => 250],
                    ['nom' => 'Lentilles',     'quantite' => 150, 'unite' => 'g', 'cal' => 353],
                    ['nom' => 'Pois chiches',  'quantite' => 150, 'unite' => 'g', 'cal' => 364],
                    ['nom' => 'Tomate',        'quantite' => 400, 'unite' => 'g', 'cal' => 18],
                    ['nom' => 'Oignon',        'quantite' => 100, 'unite' => 'g', 'cal' => 40],
                    ['nom' => 'Cumin',         'quantite' => 8,   'unite' => 'g', 'cal' => 375],
                    ['nom' => 'Gingembre',     'quantite' => 8,   'unite' => 'g', 'cal' => 80],
                    ['nom' => 'Citron',        'quantite' => 60,  'unite' => 'g', 'cal' => 29],
                    ['nom' => 'Sel',           'quantite' => 5,   'unite' => 'g', 'cal' => 0],
                ],
            ],

            // ═══════════════════════════════════════════════════
            //  RAPIDE (< 20 min)
            // ═══════════════════════════════════════════════════
            [
                'nom'               => 'Omelette aux Épinards et Fromage',
                'description'       => 'Omelette moelleuse et protéinée avec des épinards sautés et du fromage fondu. Prête en 10 minutes.',
                'image'             => 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=500',
                'temps_preparation' => 5, 'temps_cuisson' => 8,
                'nombre_personnes'  => 1, 'categorie' => 'Rapide',
                'difficulte'        => 'easy', 'rating' => 4.2,
                'instructions'      => [
                    'Battre les œufs avec le sel et le poivre.',
                    'Faire revenir les épinards dans le beurre.',
                    'Verser les œufs et cuire à feu doux.',
                    'Ajouter le fromage et plier l\'omelette.',
                    'Servir immédiatement.',
                ],
                'ingredients' => [
                    ['nom' => 'Épinard',    'quantite' => 100, 'unite' => 'g', 'cal' => 23],
                    ['nom' => 'Fromage',    'quantite' => 50,  'unite' => 'g', 'cal' => 350],
                    ['nom' => 'Beurre',     'quantite' => 20,  'unite' => 'g', 'cal' => 717],
                    ['nom' => 'Sel',        'quantite' => 3,   'unite' => 'g', 'cal' => 0],
                    ['nom' => 'Poivre noir','quantite' => 1,   'unite' => 'g', 'cal' => 251],
                ],
            ],
            [
                'nom'               => 'Riz Pilaf au Poulet Express',
                'description'       => 'Riz doré cuit avec des morceaux de poulet, oignon et épices. Rapide à préparer, délicieux à déguster.',
                'image'             => 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=500',
                'temps_preparation' => 10, 'temps_cuisson' => 20,
                'nombre_personnes'  => 2, 'categorie' => 'Rapide',
                'difficulte'        => 'easy', 'rating' => 4.4,
                'instructions'      => [
                    'Faire revenir le poulet coupé en dés.',
                    'Ajouter l\'oignon et l\'ail et faire dorer.',
                    'Incorporer le riz et nacrer 2 minutes.',
                    'Couvrir de bouillon ou d\'eau et cuire 18 minutes.',
                    'Fluffer avec une fourchette et servir.',
                ],
                'ingredients' => [
                    ['nom' => 'Riz',           'quantite' => 200, 'unite' => 'g',  'cal' => 365],
                    ['nom' => 'Poulet',        'quantite' => 300, 'unite' => 'g',  'cal' => 165],
                    ['nom' => 'Oignon',        'quantite' => 80,  'unite' => 'g',  'cal' => 40],
                    ['nom' => 'Ail',           'quantite' => 10,  'unite' => 'g',  'cal' => 149],
                    ["nom" => "Huile d'olive", 'quantite' => 30,  'unite' => 'ml', 'cal' => 884],
                    ['nom' => 'Cumin',         'quantite' => 5,   'unite' => 'g',  'cal' => 375],
                    ['nom' => 'Sel',           'quantite' => 5,   'unite' => 'g',  'cal' => 0],
                ],
            ],
            [
                'nom'               => 'Pâtes à l\'Ail et Huile d\'Olive',
                'description'       => 'La recette italienne la plus simple : pâtes sautées avec ail doré, huile d\'olive et poivre. Prêtes en 15 min.',
                'image'             => 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=500',
                'temps_preparation' => 5, 'temps_cuisson' => 12,
                'nombre_personnes'  => 2, 'categorie' => 'Rapide',
                'difficulte'        => 'easy', 'rating' => 4.3,
                'instructions'      => [
                    'Cuire les pâtes al dente.',
                    'Faire dorer l\'ail dans l\'huile d\'olive.',
                    'Égoutter les pâtes en gardant un peu d\'eau de cuisson.',
                    'Mélanger les pâtes avec l\'ail et l\'huile.',
                    'Assaisonner et servir avec du fromage râpé.',
                ],
                'ingredients' => [
                    ['nom' => 'Pâtes',         'quantite' => 300, 'unite' => 'g',  'cal' => 370],
                    ['nom' => 'Ail',           'quantite' => 30,  'unite' => 'g',  'cal' => 149],
                    ["nom" => "Huile d'olive", 'quantite' => 60,  'unite' => 'ml', 'cal' => 884],
                    ['nom' => 'Fromage',       'quantite' => 50,  'unite' => 'g',  'cal' => 350],
                    ['nom' => 'Sel',           'quantite' => 5,   'unite' => 'g',  'cal' => 0],
                    ['nom' => 'Poivre noir',   'quantite' => 2,   'unite' => 'g',  'cal' => 251],
                ],
            ],
        ];
    }
}
