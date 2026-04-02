<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\CartRecipe;
use App\Models\Recette;
use App\Models\Produit;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    public function addRecipeToCart(Request $request)
    {
        $request->validate([
            'recette_id' => 'required|exists:recettes,id',
        ]);

        $user = Auth::user();
        $cart = Cart::firstOrCreate(
            ['client_id' => $user->id],
            ['amount' => 0]
        );

        $recette = Recette::find($request->recette_id);

        // Check if the recipe is already in the cart
        $cartRecipe = CartRecipe::where('cart_id', $cart->id)
                                ->where('recette_id', $recette->id)
                                ->first();

        if ($cartRecipe) {
            return response()->json(['message' => 'Recipe already in cart'], 409);
        }

        // Prepare ingredients snapshot with availability and price
        $ingredientsSnapshot = [];
        foreach ($recette->ingredients as $ingredientName => $quantity) {
            $produit = Produit::where('nom', 'LIKE', '%' . $ingredientName . '%')->first(); // Assuming ingredient names in recette match product names
            $isAvailable = $produit && $produit->quantite_stock >= $quantity;
            $pricePerUnit = $produit ? $produit->prix : 0; // Get price from Produit table

            $ingredientsSnapshot[] = [
                'name' => $ingredientName,
                'quantity' => $quantity,
                'is_available' => $isAvailable,
                'price_per_unit' => $pricePerUnit,
                'total_price' => $isAvailable ? ($quantity * $pricePerUnit) : 0,
            ];
        }

        $cartRecipe = CartRecipe::create([
            'cart_id' => $cart->id,
            'recette_id' => $recette->id,
            'ingredients_snapshot' => $ingredientsSnapshot,
        ]);

        $this->updateCartAmount($cart);

        return response()->json(['message' => 'Recipe added to cart successfully', 'cartRecipe' => $cartRecipe], 201);
    }

    public function getCart(Request $request)
    {
        $user = Auth::user();
        $cart = Cart::with('cartRecipes.recette')->where('client_id', $user->id)->first();

        if (!$cart) {
            return response()->json(['message' => 'Cart not found'], 404);
        }

        // Recalculate total_price for each ingredient in the snapshot and cart amount
        $cartRecipes = $cart->cartRecipes->map(function ($cartRecipe) {
            $updatedIngredientsSnapshot = [];
            $recipeTotalPrice = 0;

            foreach ($cartRecipe->ingredients_snapshot as $ingredient) {
                $produit = Produit::where('nom', 'LIKE', '%' . $ingredient['name'] . '%')->first();
                $isAvailable = $produit && $produit->quantite_stock >= $ingredient['quantity'];
                $pricePerUnit = $produit ? $produit->prix : 0;

                $ingredient['is_available'] = $isAvailable;
                $ingredient['price_per_unit'] = $pricePerUnit;
                $ingredient['total_price'] = $isAvailable ? ($ingredient['quantity'] * $pricePerUnit) : 0;

                $recipeTotalPrice += $ingredient['total_price'];
                $updatedIngredientsSnapshot[] = $ingredient;
            }
            $cartRecipe->ingredients_snapshot = $updatedIngredientsSnapshot;
            $cartRecipe->recipe_total_price = $recipeTotalPrice; // Add recipe total price for easier display

            return $cartRecipe;
        });

        // Update the cart amount based on the recalculated recipe total prices
        $cart->amount = $cartRecipes->sum('recipe_total_price');
        $cart->save();


        return response()->json(['cart' => $cart], 200);
    }

    public function updateCartRecipeIngredient(Request $request, $cartRecipeId)
    {
        $request->validate([
            'ingredient_name' => 'required|string',
            'new_quantity' => 'required|numeric|min:1',
        ]);

        $cartRecipe = CartRecipe::find($cartRecipeId);

        if (!$cartRecipe) {
            return response()->json(['message' => 'Cart recipe not found'], 404);
        }

        $ingredientsSnapshot = $cartRecipe->ingredients_snapshot;
        $updated = false;

        foreach ($ingredientsSnapshot as &$ingredient) {
            if ($ingredient['name'] === $request->ingredient_name) {
                $ingredient['quantity'] = $request->new_quantity;
                $produit = Produit::where('nom', 'LIKE', '%' . $ingredient['name'] . '%')->first();
                $isAvailable = $produit && $produit->quantite_stock >= $request->new_quantity;
                $pricePerUnit = $produit ? $produit->prix : 0;

                $ingredient['is_available'] = $isAvailable;
                $ingredient['price_per_unit'] = $pricePerUnit;
                $ingredient['total_price'] = $isAvailable ? ($request->new_quantity * $pricePerUnit) : 0;
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            return response()->json(['message' => 'Ingredient not found in recipe snapshot'], 404);
        }

        $cartRecipe->ingredients_snapshot = $ingredientsSnapshot;
        $cartRecipe->save();

        $this->updateCartAmount($cartRecipe->cart);

        return response()->json(['message' => 'Ingredient quantity updated successfully', 'cartRecipe' => $cartRecipe], 200);
    }

    private function updateCartAmount(Cart $cart)
    {
        $totalAmount = 0;
        foreach ($cart->cartRecipes as $cartRecipe) {
            foreach ($cartRecipe->ingredients_snapshot as $ingredient) {
                $totalAmount += $ingredient['total_price'];
            }
        }
        $cart->amount = $totalAmount;
        $cart->save();
    }
}
