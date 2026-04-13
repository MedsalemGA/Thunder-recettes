import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonIcon, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
  IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem,
  IonCheckbox, IonFooter, IonSpinner, ToastController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { RecipeService } from '../../../services/recipe.service';
import { AiRecommendationService, Recipe, IngredientSubstitution } from '../../../services/ai-recommendation.service';
import { SmartCartService } from '../../../services/smart-cart.service';


import { addIcons } from 'ionicons';
import { ViewWillEnter } from '@ionic/angular';
import {
  heart, heartOutline, cartOutline, flashOutline,
  timeOutline, peopleOutline, star, starOutline, starHalf, chevronForwardOutline,
  checkmarkCircleOutline, alertCircleOutline, bulbOutline,
  shareSocialOutline, printOutline, restaurant, timer,
  flame, people, pricetag, swapHorizontal, addCircle,
  checkmarkCircle, shareSocial, arrowBackOutline,
  timerOutline, flameOutline, pricetagOutline,
  listOutline, restaurantOutline, gridOutline,
  swapHorizontalOutline, searchOutline,
  chevronDownOutline, checkmarkOutline, addOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonIcon, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
    IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem,
    IonCheckbox, IonFooter, IonSpinner
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.scss']
})
export class RecipeDetailComponent implements ViewWillEnter {

  recipe: any;
  similarRecipes: Recipe[]                            = [];
  substitutions: Map<string, IngredientSubstitution> = new Map();
  ingredientStats: any                               = {};

  activeSegment = 'ingredients';
  isLoading     = true;
  isFavorite    = false;
  isInCart      = false;
  isScrolled    = false;
  totalPrice    = 0;
  calories      = 0;

  // Clé = nom_ingredient → coché ou non
  checkedIngredients: Record<string, boolean> = {};

  // Cache prix depuis getIngredientDetails (optionnel si backend enrichi plus tard)
  ingredientDetails: Record<string, any> = {};

  isAdding = false;
  addSuccess = false;

  // Rating
  userRate    = 0;
  detailHovered = 0;
  allIngredientsChecked = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private recipeService: RecipeService,
    private aiService: AiRecommendationService,
    private cartService: SmartCartService,
   
    private toastController: ToastController
  ) {
    addIcons({arrowBackOutline,shareSocialOutline,star,timeOutline,peopleOutline,timerOutline,flameOutline,flashOutline,pricetagOutline,listOutline,restaurantOutline,checkmarkOutline,closeOutline,addOutline,checkmarkCircleOutline,swapHorizontalOutline,cartOutline,checkmarkCircle,heart,heartOutline,starOutline,starHalf,chevronForwardOutline,alertCircleOutline,bulbOutline,printOutline,restaurant,timer,flame,people,pricetag,swapHorizontal,addCircle,shareSocial,gridOutline,searchOutline,chevronDownOutline});
  }

  // ════════════════════════════════════════════════════
  // Lifecycle
  // ════════════════════════════════════════════════════

  ionViewWillEnter() {
    this.isLoading = true;
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) { this.isLoading = false; return; }

      // ── Recette IA : données passées via navigation state ──
      if (id === 'ai-temp') {
        const state = history.state as { aiRecipe?: any };
        if (state?.aiRecipe) {
          this.recipe     = state.aiRecipe;
          this.calories   = 0;
          this.totalPrice = 0;
          this.isFavorite = false;
          this.isInCart   = false;

          this.checkedIngredients = {};
          (state.aiRecipe.ingredients ?? []).forEach((ing: any) => {
            if (ing.disponible) {
              this.checkedIngredients[ing.nom] = true;
            }
          });

          this.isLoading = false;
          return;
        }
      }

      // ── Recette normale : chargement par ID ──
      this.loadRecipeDetails(id);
      this.sortIngredients();
      console.log(this.recipe);
    });
  }

  // ════════════════════════════════════════════════════
  // Chargement
  // ════════════════════════════════════════════════════

  loadRecipeDetails(recipeId: string): void {
    this.isLoading = true;

    this.recipeService.getRecipeById(recipeId).subscribe({
      next: (recipe: any) => {
        if (!recipe) { this.isLoading = false; return; }

        this.recipe    = recipe;
        this.calories  = recipe.calories ?? 0;
        this.totalPrice = parseFloat(recipe.price) ?? 0;
        console.log(recipe);
        this.isFavorite = this.recipeService.isFavorite(recipe.id);
        this.isInCart   = this.cartService.isRecipeInCart(recipe.id);

        // Cocher par défaut les ingrédients disponibles
        this.checkedIngredients = {};
        recipe.ingredients.forEach((ing: any) => {
          if (ing.disponible) {
            this.checkedIngredients[ing.nom] = true;
          }
        });
        console.log(this.checkedIngredients);

        

        // Charger la note de l'utilisateur connecté
        this.recipeService.getUserRating(recipeId).subscribe({
          next: (res: any) => { this.userRate = res.user_rate ?? 0;
            this.recipe.vote_count = res.count;
           },
          error: () => {}
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement recette', err);
        this.isLoading = false;
      }
    });
  }

  // ════════════════════════════════════════════════════
  // Prix & Calories dynamiques (quand quantité change)
  // ════════════════════════════════════════════════════

  updateTotalPrice(): void {
  if (!this.recipe) return;

  this.totalPrice = this.recipe.ingredients.reduce((total: number, ing: any) => {

    if (!this.checkedIngredients[ing.nom]) return total;
    if (!ing.disponible) return total;

    const quantite = parseFloat(ing.quantite) || 0;

    if (!ing.variantes || ing.variantes.length === 0) {
      return total;
    }

    let bestPrice = Infinity;

    ing.variantes.forEach((v: any) => {

      const qty = this.convertToSameUnit(quantite, ing.unite, v.unite);

      if (qty === null) return;

      const nb = Math.ceil(qty / v.quantite);
      const prix = nb * v.prix;

      if (prix < bestPrice) {
        bestPrice = prix;
      }
    });

    return total + (bestPrice === Infinity ? 0 : bestPrice);

  }, 0);
}
  updateCalories(): void {
  if (!this.recipe) return;

  this.calories = this.recipe.ingredients.reduce((total: number, ing: any) => {

    // Les ingrédients disponibles mais décochés sont ignorés
    // Les ingrédients indisponibles comptent toujours (ils font partie de la recette)
    if (ing.disponible && !this.checkedIngredients[ing.nom]) return total;

    const quantite = parseFloat(ing.quantite) || 0;
    const cal = ing.calories_100g ? (ing.calories_100g * quantite) / 100 : 0;

    return parseFloat((total + cal).toFixed(2));

  }, 0);
}
 
 // Prix depuis cache ingredientDetails (appelé si getIngredientDetails est utilisé)
getIngredientPrice(ingredient: any): { price: number, details: string } {

  if (!this.checkedIngredients[ingredient.nom] || !ingredient.disponible) {
    return { price: 0, details: '' };
  }

  const quantite = parseFloat(ingredient.quantite) || 0;

  if (!ingredient.variantes || ingredient.variantes.length === 0) {
    return { price: 0, details: '' };
  }

  // 🔥 convertir toutes les variantes dans même unité
  const variantes = ingredient.variantes.map((v: any) => {
    const q = this.convertToSameUnit(v.quantite, v.unite, ingredient.unite);
    return { ...v, quantiteConv: q };
  }).filter((v: any) => v.quantiteConv !== null);

  // 🔥 trier par prix / unité (meilleur d'abord)
  variantes.sort((a: any, b: any) => (a.prix / a.quantiteConv) - (b.prix / b.quantiteConv));

  let remaining = quantite;
  let totalPrice = 0;
  let detailsArr: string[] = [];

  for (let v of variantes) {

    if (remaining <= 0) break;

    const nb = Math.floor(remaining / v.quantiteConv);

    if (nb > 0) {
      totalPrice += nb * v.prix;
      remaining -= nb * v.quantiteConv;

      detailsArr.push(this.formatDetail(nb, ingredient.nom, v));
    }
  }

  // 🔥 s'il reste un petit besoin → prendre la plus petite variante
  if (remaining > 0) {
    const smallest = variantes[variantes.length - 1];

    totalPrice += smallest.prix;
    detailsArr.push(this.formatDetail(1, ingredient.nom, smallest));
  }

  return {
    price: totalPrice,
    details: detailsArr.join(' + ')
  };
}
formatDetail(nb: number, nom: string, v: any): string {

  let type = '';

  if (['g', 'kg'].includes(v.unite)) {
    type = 'paquet';
  } else if (['ml', 'l'].includes(v.unite)) {
    type = 'bouteille';
  } else {
    type = 'unité';
  }

  const plural = nb > 1 ? 's' : '';

  return `${nb} ${type}${plural} de ${nom} (${v.quantite}${v.unite})`;
}
convertToSameUnit(qty: number, from: string, to: string): number | null {

  // Poids
  if (from === 'g' && to === 'kg') return qty / 1000;
  if (from === 'kg' && to === 'g') return qty * 1000;
  if (from === to && (from === 'g' || from === 'kg')) return qty;

  // Liquide
  if (from === 'ml' && to === 'L') return qty / 1000;
  if (from === 'L' && to === 'ml') return qty * 1000;
  if (from === to && (from === 'ml' || from === 'l')) return qty;

  // Unités fixes (pas de conversion)
  if (from === to) return qty;

  // ❌ incompatible
  return null;
}
  // ════════════════════════════════════════════════════
  // Ingrédients
  // ════════════════════════════════════════════════════

  toggleIngredient(nom: string): void {
    const ing = this.recipe?.ingredients.find((i: any) => i.nom === nom);
    if (!ing || !ing.disponible) return;
    this.checkedIngredients[nom] = !this.checkedIngredients[nom];
    console.log(this.checkedIngredients);
    this.updateTotalPrice();
    this.updateCalories();
  }

  isChecked(nom: string): boolean {
    return this.checkedIngredients[nom] ?? false;
  }

 

  hasSubstitution(nom: string): boolean {
    return this.substitutions.has(nom);
  }

  getSubstitution(nom: string): IngredientSubstitution | undefined {
    return this.substitutions.get(nom);
  }

  get checkedCount(): number {
    return Object.values(this.checkedIngredients).filter(v => v).length;
  }

  // ════════════════════════════════════════════════════
  // Scroll
  // ════════════════════════════════════════════════════

  onScroll(event: any): void {
    this.isScrolled = event.detail.scrollTop > 200;
  }

  // ════════════════════════════════════════════════════
  // Panier
  // ════════════════════════════════════════════════════

 async addSelectedToCart(): Promise<void> {
  if (!this.recipe || this.isAdding) return;

  const checkedIngredients = this.recipe.ingredients
    .filter((ing: any) => this.checkedIngredients[ing.nom] && ing.disponible)
    .map((ing: any) => {

      const priceData = this.getIngredientPrice(ing); // 🔥 nouveau

      return {
        id: ing.produit_id ?? ing.nom,
        nom: ing.nom,
        quantite: parseFloat(ing.quantite) || 1,
        unite: ing.unite ?? 'unité',

        prix: priceData.price,        // 🔥 important
        details: priceData.details, 
        fromRecipeName: this.recipe.name ?? '',  // 🔥 nouveau (optionnel mais utile)

        recette_id: this.recipe.id ?? undefined,
      };
    });

  if (checkedIngredients.length === 0) return;

  this.isAdding = true;

  this.cartService.addCheckedIngredients(checkedIngredients);

  this.isInCart   = true;
  this.isAdding   = false;
  this.addSuccess = true;
  setTimeout(() => (this.addSuccess = false), 2500);

  const toast = await this.toastController.create({
    message: `✅ ${checkedIngredients.length} ingrédient(s) ajouté(s) au panier`,
    duration: 3000,
    position: 'bottom',
    color: 'success',
    buttons: [
      {
        text: 'Voir le panier',
        role: 'cancel',
        handler: () => {
          this.router.navigate(['/smart-cart']);
        }
      }
    ]
  });

  await toast.present();

  const { role } = await toast.onDidDismiss();
  if (role !== 'cancel') {
    this.router.navigate(['/smart-cart']);
  }
}

  addRecipeToCart(): void {
    if (!this.recipe) return;
    // Fallback local (ingrédients sans produit_id)
    this.cartService.addRecipeToCart(this.recipe, this.substitutions);
    this.isInCart = true;
  }

  removeRecipeFromCart(): void {
    if (!this.recipe) return;
    this.cartService.removeRecipeFromCart(this.recipe.id);
    this.isInCart = false;
  }

  // ════════════════════════════════════════════════════
  // Favori
  // ════════════════════════════════════════════════════

  toggleFavorite(): void {
    if (!this.recipe) return;
    if (this.isFavorite) {
      this.recipeService.removeFromFavorites(this.recipe.id);
    } else {
      this.recipeService.addToFavorites(this.recipe.id);
    }
    this.isFavorite = !this.isFavorite;
  }

  // ════════════════════════════════════════════════════
  // Notation
  // ════════════════════════════════════════════════════

  rateRecipe(star: number): void {
    if (!this.recipe) return;
    const prev = this.userRate;
    this.userRate = star; // Optimistic UI

    this.recipeService.rateRecipe(this.recipe.id, star).subscribe({
      next: (res: any) => {
        this.recipe.rating = res.avg_rating;
        this.recipeService.updateLocalRating(this.recipe.id, res.avg_rating);
        this.showToast(`⭐ Merci ! Vous avez noté cette recette ${star}/5`);
      },
      error: () => {
        this.userRate = prev; // Rollback
      }
    });
  }

  getDetailStarIcon(s: number): string {
    const effective = this.detailHovered > 0 ? this.detailHovered : (this.userRate || this.recipe?.rating || 0);
    if (s <= Math.floor(effective)) return 'star';
    if (s === Math.ceil(effective) && effective % 1 >= 0.5) return 'star-half';
    return 'star-outline';
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message, duration: 2000, position: 'bottom', color: 'warning'
    });
    await toast.present();
  }

  // ════════════════════════════════════════════════════
  // Navigation & partage
  // ════════════════════════════════════════════════════

  goBack(): void {
    this.location.back();
  }

  shareRecipe(): void {
    if (this.recipe && navigator.share) {
      navigator.share({
        title: this.recipe.name,
        text:  this.recipe.description,
        url:   window.location.href
      });
    }
  }

  // ════════════════════════════════════════════════════
  // Helpers
  // ════════════════════════════════════════════════════

  getDifficultyText(): string {
    const map: Record<string, string> = {
      easy: 'Facile', medium: 'Moyen', hard: 'Difficile'
    };
    return map[this.recipe?.difficulty ?? ''] ?? '';
  }

  getDifficultyColor(): string {
    const map: Record<string, string> = {
      easy: 'success', medium: 'warning', hard: 'danger'
    };
    return map[this.recipe?.difficulty ?? ''] ?? 'medium';
  }

  getTotalTime(): number {
    return (this.recipe?.prepTime ?? 0) + (this.recipe?.cookTime ?? 0);
  }

  get cookTime(): number {
    return this.recipe?.cookTime ?? 0;
  }
  getdetailprod(recipe: any) {
    let res = String();
    let prod = recipe.ingredients.variantes;
    prod.forEach((item: any) => {
      if(item.unit=='g'||item.unit=='kg'){
        if(item.quantite>recipe.ingredients.quantite){
          res += item.quantity + ' ' + item.unit + '\n';
        }
        res += item.quantity + ' ' + item.unit + '\n';
      }
    });

    
  }
toggleAllIngredients() {
  const newState = !this.allIngredientsChecked;

  this.recipe.ingredients.forEach(ing => {
    if (ing.disponible) {
      this.checkedIngredients[ing.nom] = newState;
    }
  });

  this.allIngredientsChecked = newState;

  this.updateTotalPrice();
  this.updateCalories();
}
sortIngredients() {
  if (this.recipe?.ingredients) {
    this.recipe.ingredients.sort((a, b) => {
      return Number(a.disponible) - Number(b.disponible);
    });
  }
}

}