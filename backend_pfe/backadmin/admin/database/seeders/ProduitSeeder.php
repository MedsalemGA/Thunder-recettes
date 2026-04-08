<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Produit;
use App\Models\ProduitVariante;
use App\Models\Fournisseur;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ProduitSeeder extends Seeder
{
    public function run(): void
    {
        $fournisseurs = $this->createFournisseurs();

        $produits = [
            // ── Légumes ──────────────────────────────────────────────────────
            ['nom' => 'Tomate',          'cal' => 18,  'f' => 'legumes', 'img' => 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>1.20],['q'=>1000,'u'=>'g','p'=>2.00]]],
            ['nom' => 'Oignon',          'cal' => 40,  'f' => 'legumes', 'img' => 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>0.90],['q'=>1000,'u'=>'g','p'=>1.50]]],
            ['nom' => 'Ail',             'cal' => 149, 'f' => 'legumes', 'img' => 'https://images.unsplash.com/photo-1501493870936-9c2e41625521?w=400',
             'variantes' => [['q'=>100,'u'=>'g','p'=>0.80],['q'=>250,'u'=>'g','p'=>1.80]]],
            ['nom' => 'Carotte',         'cal' => 41,  'f' => 'legumes', 'img' => 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>1.00],['q'=>1000,'u'=>'g','p'=>1.80]]],
            ['nom' => 'Pomme de terre',  'cal' => 77,  'f' => 'legumes', 'img' => 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400',
             'variantes' => [['q'=>1000,'u'=>'g','p'=>1.50],['q'=>2000,'u'=>'g','p'=>2.50]]],
            ['nom' => 'Poivron rouge',   'cal' => 31,  'f' => 'legumes', 'img' => 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>1.50],['q'=>1000,'u'=>'g','p'=>2.80]]],
            ['nom' => 'Courgette',       'cal' => 17,  'f' => 'legumes', 'img' => 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>1.20],['q'=>1000,'u'=>'g','p'=>2.20]]],
            ['nom' => 'Épinard',         'cal' => 23,  'f' => 'legumes', 'img' => 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
             'variantes' => [['q'=>250,'u'=>'g','p'=>1.50],['q'=>500,'u'=>'g','p'=>2.50]]],
            ['nom' => 'Aubergine',       'cal' => 25,  'f' => 'legumes', 'img' => 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>1.30],['q'=>1000,'u'=>'g','p'=>2.30]]],

            // ── Viandes ──────────────────────────────────────────────────────
            ['nom' => 'Poulet',          'cal' => 165, 'f' => 'viandes', 'img' => 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>6.50],['q'=>1000,'u'=>'g','p'=>12.00]]],
            ['nom' => 'Viande hachée',   'cal' => 254, 'f' => 'viandes', 'img' => 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>9.00],['q'=>1000,'u'=>'g','p'=>17.00]]],
            ['nom' => 'Agneau',          'cal' => 294, 'f' => 'viandes', 'img' => 'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>14.00],['q'=>1000,'u'=>'g','p'=>26.00]]],
            ['nom' => 'Merguez',         'cal' => 350, 'f' => 'viandes', 'img' => 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>7.50],['q'=>1000,'u'=>'g','p'=>14.00]]],

            // ── Poissons ─────────────────────────────────────────────────────
            ['nom' => 'Saumon',          'cal' => 208, 'f' => 'poissons', 'img' => 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
             'variantes' => [['q'=>300,'u'=>'g','p'=>14.00],['q'=>500,'u'=>'g','p'=>22.00]]],
            ['nom' => 'Thon frais',      'cal' => 130, 'f' => 'poissons', 'img' => 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
             'variantes' => [['q'=>200,'u'=>'g','p'=>8.00],['q'=>400,'u'=>'g','p'=>14.00]]],
            ['nom' => 'Crevettes',       'cal' => 99,  'f' => 'poissons', 'img' => 'https://images.unsplash.com/photo-1537624204572-e1b4a7c62a04?w=400',
             'variantes' => [['q'=>250,'u'=>'g','p'=>9.00],['q'=>500,'u'=>'g','p'=>17.00]]],

            // ── Céréales & Légumineuses ───────────────────────────────────────
            ['nom' => 'Riz',             'cal' => 130, 'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>1.50],['q'=>1000,'u'=>'g','p'=>2.80],['q'=>2000,'u'=>'g','p'=>5.00]]],
            ['nom' => 'Pâtes',           'cal' => 371, 'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>1.80],['q'=>1000,'u'=>'g','p'=>3.20]]],
            ['nom' => 'Couscous',        'cal' => 376, 'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>2.00],['q'=>1000,'u'=>'g','p'=>3.50]]],
            ['nom' => 'Farine',          'cal' => 364, 'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
             'variantes' => [['q'=>1000,'u'=>'g','p'=>1.50],['q'=>2000,'u'=>'g','p'=>2.50]]],
            ['nom' => 'Lentilles',       'cal' => 116, 'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>2.00],['q'=>1000,'u'=>'g','p'=>3.50]]],
            ['nom' => 'Pois chiches',    'cal' => 164, 'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>2.20],['q'=>1000,'u'=>'g','p'=>4.00]]],

            // ── Huiles & Condiments ───────────────────────────────────────────
            ['nom' => "Huile d'olive",   'cal' => 884, 'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
             'variantes' => [['q'=>250,'u'=>'ml','p'=>5.00],['q'=>500,'u'=>'ml','p'=>9.00],['q'=>1000,'u'=>'ml','p'=>17.00]]],
            ['nom' => 'Sauce soja',      'cal' => 53,  'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1589268322440-5f76b0680d82?w=400',
             'variantes' => [['q'=>150,'u'=>'ml','p'=>3.50],['q'=>300,'u'=>'ml','p'=>6.00]]],
            ['nom' => 'Harissa',         'cal' => 50,  'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1648124843474-7cba15a40f27?w=400',
             'variantes' => [['q'=>100,'u'=>'g','p'=>1.50],['q'=>200,'u'=>'g','p'=>2.50]]],

            // ── Épices ────────────────────────────────────────────────────────
            ['nom' => 'Cumin',           'cal' => 375, 'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1506368083636-6defb67639a7?w=400',
             'variantes' => [['q'=>50,'u'=>'g','p'=>1.50],['q'=>100,'u'=>'g','p'=>2.50]]],
            ['nom' => 'Paprika',         'cal' => 282, 'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1596591201169-92f9a6292b29?w=400',
             'variantes' => [['q'=>50,'u'=>'g','p'=>1.80],['q'=>100,'u'=>'g','p'=>3.00]]],
            ['nom' => 'Gingembre',       'cal' => 80,  'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1615485290446-7634beffe3b2?w=400',
             'variantes' => [['q'=>100,'u'=>'g','p'=>2.00],['q'=>200,'u'=>'g','p'=>3.50]]],
            ['nom' => 'Sel',             'cal' => 0,   'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>0.80],['q'=>1000,'u'=>'g','p'=>1.30]]],
            ['nom' => 'Poivre noir',     'cal' => 251, 'f' => 'epicerie', 'img' => 'https://images.unsplash.com/photo-1596591201169-92f9a6292b29?w=400',
             'variantes' => [['q'=>50,'u'=>'g','p'=>1.50],['q'=>100,'u'=>'g','p'=>2.50]]],

            // ── Produits laitiers ─────────────────────────────────────────────
            ['nom' => 'Beurre',          'cal' => 717, 'f' => 'laitiers', 'img' => 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400',
             'variantes' => [['q'=>200,'u'=>'g','p'=>4.50],['q'=>500,'u'=>'g','p'=>9.50]]],
            ['nom' => 'Fromage',         'cal' => 402, 'f' => 'laitiers', 'img' => 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400',
             'variantes' => [['q'=>200,'u'=>'g','p'=>6.00],['q'=>400,'u'=>'g','p'=>11.00]]],
            ['nom' => 'Lait',            'cal' => 61,  'f' => 'laitiers', 'img' => 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
             'variantes' => [['q'=>500,'u'=>'ml','p'=>1.20],['q'=>1000,'u'=>'ml','p'=>2.00]]],
            ['nom' => 'Crème fraîche',   'cal' => 292, 'f' => 'laitiers', 'img' => 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
             'variantes' => [['q'=>200,'u'=>'ml','p'=>3.00],['q'=>400,'u'=>'ml','p'=>5.50]]],

            // ── Protéines végétales & Fruits ─────────────────────────────────
            ['nom' => 'Tofu',            'cal' => 76,  'f' => 'legumes', 'img' => 'https://images.unsplash.com/photo-1587696097424-b77c9beff0db?w=400',
             'variantes' => [['q'=>200,'u'=>'g','p'=>4.50],['q'=>400,'u'=>'g','p'=>8.00]]],
            ['nom' => 'Citron',          'cal' => 29,  'f' => 'legumes', 'img' => 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400',
             'variantes' => [['q'=>500,'u'=>'g','p'=>1.50],['q'=>1000,'u'=>'g','p'=>2.50]]],
        ];

        foreach ($produits as $data) {
            $f = $fournisseurs[$data['f']];
            $produit = Produit::firstOrCreate(
                ['nom' => $data['nom']],
                [
                    'description'    => "Produit frais de qualité supérieure.",
                    'prix'           => $data['variantes'][0]['p'],
                    'quantite_stock' => rand(50, 200),
                    'fournisseur_id' => $f->id,
                    'image'          => $data['img'],
                ]
            );

            foreach ($data['variantes'] as $v) {
                ProduitVariante::firstOrCreate(
                    ['produit_id' => $produit->id, 'quantite' => $v['q'], 'unite' => $v['u']],
                    ['prix' => $v['p']]
                );
            }
        }
    }

    private function createFournisseurs(): array
    {
        $specs = [
            'legumes'  => ['name' => 'Fresh Market Tunis',  'email' => 'fresh.market@thunder.com',  'code' => 'F002', 'spec' => 'Fruits et légumes frais'],
            'viandes'  => ['name' => 'Boucherie El Amal',   'email' => 'boucherie.amal@thunder.com', 'code' => 'F003', 'spec' => 'Viandes et poissons'],
            'poissons' => ['name' => 'Boucherie El Amal',   'email' => 'boucherie.amal@thunder.com', 'code' => 'F004', 'spec' => 'Vi poissons'],
            'epicerie' => ['name' => 'Epicerie Centrale',   'email' => 'epicerie@thunder.com',       'code' => 'F005', 'spec' => 'Épices, céréales et condiments'],
            'laitiers' => ['name' => 'Epicerie Centrale',   'email' => 'epicerie@thunder.com',       'code' => 'F006', 'spec' => 'Laitiers et fromages'],
        ];

        $cache = [];
        foreach ($specs as $key => $s) {
            if (isset($cache[$s['email']])) {
                $cache[$key] = $cache[$s['email']];
                continue;
            }
            $user = User::firstOrCreate(
                ['email' => $s['email']],
                ['name' => $s['name'], 'password' => Hash::make('password'), 'role' => 'fournisseur', 'telephone' => '2'.rand(1000000,9999999), 'adresse' => 'Tunis']
            );
            $f = Fournisseur::firstOrCreate(
                ['user_id' => $user->id],
                ['specialite' => $s['spec'], 'code_commercial' => $s['code']]
            );
            $cache[$s['email']] = $f;
            $cache[$key] = $f;
        }
        return $cache;
    }
}
