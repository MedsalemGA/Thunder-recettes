// src/app/pages/scan-recipe/scan-recipe.page.ts
// src/app/pages/scan-recipe/scan-recipe.page.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  LoadingController,
  ToastController,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cameraOutline, camera, imagesOutline, scanOutline, sparklesOutline,
  checkmarkCircle, searchCircleOutline, timeOutline, flameOutline,
  peopleOutline, barChartOutline, cartOutline, flagOutline, bulbOutline,
  refreshOutline, addCircleOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { environment } from '../../../environments/environment';
import { RecipeMatchService } from '../../services/recipe-match.service';
import { SmartCartService } from '../../services/smart-cart.service';
import { DishAnalysis, Recipe } from '../../models/reciepe.model';

// ── Types internes ──────────────────────────────────────────────
type Step = 'capture' | 'verify' | 'results';

@Component({
  selector: 'app-scan-recipe',
  templateUrl: './scan-recipe.page.html',
  styleUrls: ['./scan-recipe.page.scss'],
})
export class ScanRecipePage implements OnInit {

  // État de la page
  step: Step = 'capture';

  // Image
  imagePreview: string | null = null;
  imageBase64: string | null = null;
  imageMime: string = 'image/jpeg';

  // Analyse Gemini
  dishAnalysis: DishAnalysis | null = null;
  isAnalyzing = false;

  // Ingrédients vérifiés
  activeIngredients: string[] = [];
  manualIngredient = '';
  isSearching = false;

  // Résultats
  matchedRecipe: Recipe | null = null;
  isGenerating = false;
  generatedRecipe: Recipe | null = null;

  // Config Gemini
  private readonly geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${environment.geminiModel}:generateContent?key=${environment.geminiApiKey}`;

  constructor(
    private actionSheet: ActionSheetController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private matchService: RecipeMatchService,
    private cartService: SmartCartService,
  ) {
    addIcons({
      cameraOutline, camera, imagesOutline, scanOutline, sparklesOutline,
      checkmarkCircle, searchCircleOutline, timeOutline, flameOutline,
      peopleOutline, barChartOutline, cartOutline, flagOutline, bulbOutline,
      refreshOutline, addCircleOutline,
    });
  }

  ngOnInit() {}

  // ══════════════════════════════════════════════════════════════
  // 1. CAPTURE D'IMAGE
  // ══════════════════════════════════════════════════════════════

  async selectImageSource() {
    if (this.imagePreview) {
      // Déjà une image → proposer de changer
      const sheet = await this.actionSheet.create({
        buttons: [
          { text: 'Prendre une photo', icon: 'camera', handler: () => this.takePhoto() },
          { text: 'Galerie', icon: 'images', handler: () => this.pickFromGallery() },
          { text: 'Annuler', role: 'cancel' },
        ],
      });
      await sheet.present();
      return;
    }
    await this.takePhoto();
  }

  async takePhoto() {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        quality: 85,
        width: 800,
      });
      this.setImage(photo);
    } catch (e: any) {
      if (!e.message?.includes('cancelled')) {
        this.showToast('Erreur lors de la capture', 'danger');
      }
    }
  }

  async pickFromGallery() {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        quality: 85,
        width: 800,
      });
      this.setImage(photo);
    } catch (e: any) {
      if (!e.message?.includes('cancelled')) {
        this.showToast('Erreur lors de la sélection', 'danger');
      }
    }
  }

  private setImage(photo: Photo) {
    this.imageBase64 = photo.base64String ?? null;
    this.imageMime = `image/${photo.format}` || 'image/jpeg';
    this.imagePreview = `data:${this.imageMime};base64,${this.imageBase64}`;
  }

  // ══════════════════════════════════════════════════════════════
  // 2. ANALYSE GEMINI VISION → Nom + Ingrédients
  // ══════════════════════════════════════════════════════════════

  async analyzeImage() {
    if (!this.imageBase64) return;

    this.isAnalyzing = true;
    const loading = await this.loadingCtrl.create({
      message: 'Gemini Vision analyse l\'image...',
      spinner: 'crescent',
    });
    await loading.present();

    const prompt = `Tu es un expert culinaire. Analyse cette image de plat alimentaire.
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks, sans texte autour.

Structure exacte :
{
  "dishName": "Nom précis du plat en français",
  "cuisine": "Type de cuisine (algérienne, française, italienne...)",
  "confidence": 0.95,
  "ingredients": [
    {"name": "nom ingrédient", "probability": 0.95, "quantity": "quantité estimée ou null"}
  ],
  "cookingTime": "30 min",
  "difficulty": "Facile",
  "notes": "Conseil ou variante utile"
}

Règles :
- Identifie le plat RÉEL visible dans l'image
- Liste au minimum 5 ingrédients avec leur probabilité de présence (0.0 à 1.0)
- Sois précis (ex: "Couscous aux légumes" pas juste "Couscous")
- Réponds EN JSON PUR uniquement`;

    try {
      const response = await fetch(this.geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: this.imageMime, data: this.imageBase64 } },
              { text: prompt },
            ],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1500 },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `Erreur Gemini ${response.status}`);
      }

      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!raw) throw new Error('Réponse Gemini vide');

      let parsed: DishAnalysis;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      }

      this.dishAnalysis = parsed;
      // Activer tous les ingrédients avec probabilité ≥ 50%
      this.activeIngredients = parsed.ingredients
        .filter(i => i.probability >= 0.5)
        .map(i => i.name.toLowerCase());

      this.step = 'verify';

    } catch (e: any) {
      console.error('Gemini error:', e);
      let msg = 'Erreur lors de l\'analyse. Réessayez.';
      if (e.message?.includes('quota') || e.message?.includes('429')) {
        msg = 'Limite Gemini atteinte. Réessayez dans 1 minute.';
      } else if (e.message?.includes('API_KEY')) {
        msg = 'Clé Gemini invalide. Vérifiez environment.ts';
      }
      this.showToast(msg, 'danger');
    } finally {
      this.isAnalyzing = false;
      await loading.dismiss();
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 3. VÉRIFICATION INGRÉDIENTS
  // ══════════════════════════════════════════════════════════════

  isIngredientActive(name: string): boolean {
    return this.activeIngredients.includes(name.toLowerCase());
  }

  toggleIngredient(name: string) {
    const n = name.toLowerCase();
    const idx = this.activeIngredients.indexOf(n);
    if (idx >= 0) {
      this.activeIngredients.splice(idx, 1);
    } else {
      this.activeIngredients.push(n);
    }
  }

  addManualIngredient() {
    const name = this.manualIngredient.trim().toLowerCase();
    if (!name) return;
    if (!this.activeIngredients.includes(name)) {
      this.activeIngredients.push(name);
      // Ajouter aussi dans dishAnalysis pour l'affichage
      this.dishAnalysis?.ingredients.push({ name, probability: 1.0, quantity: null as any });
    }
    this.manualIngredient = '';
  }

  // ══════════════════════════════════════════════════════════════
  // 4. RECHERCHE EN BASE DE DONNÉES LARAVEL
  //    GET /api/client/recipes
  // ══════════════════════════════════════════════════════════════

  async searchInDatabase() {
    if (!this.activeIngredients.length || !this.dishAnalysis) return;

    this.isSearching = true;
    const loading = await this.loadingCtrl.create({
      message: 'Recherche dans la base de recettes...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      const match = await this.matchService.findMatch(this.dishAnalysis);
      this.matchedRecipe = match;
      this.generatedRecipe = null;
      this.step = 'results';

      if (match) {
        this.showToast(`✓ ${match.nom} trouvée — ${match.matchScore}% de correspondance`, 'success');
      } else {
        // Aucun match suffisant → on reste sur results, l'UI propose de générer
        this.showToast('Aucune recette correspondante. Vous pouvez générer avec l\'IA.', 'warning');
      }
    } catch (e: any) {
      this.showToast('Erreur lors de la recherche : ' + e.message, 'danger');
    } finally {
      this.isSearching = false;
      await loading.dismiss();
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 5. GÉNÉRATION PAR IA (Gemini) si pas en BDD
  // ══════════════════════════════════════════════════════════════

  async generateWithAI() {
    if (!this.dishAnalysis) return;

    this.isGenerating = true;
    const loading = await this.loadingCtrl.create({
      message: 'Gemini génère la recette...',
      spinner: 'crescent',
    });
    await loading.present();

    const ingredients = this.dishAnalysis.ingredients
      .filter(i => this.isIngredientActive(i.name))
      .map(i => i.name)
      .join(', ');

    const prompt = `Tu es un chef culinaire expert. Génère une recette complète et détaillée pour : "${this.dishAnalysis.dishName}".
Ingrédients détectés dans l'image : ${ingredients}

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks :
{
  "nom": "${this.dishAnalysis.dishName}",
  "description": "Description appétissante du plat",
  "temps_preparation": "15 min",
  "temps_cuisson": "30 min",
  "nombre_personnes": 4,
  "difficulte": "Facile",
  "categorie": "Plat principal",
  "ingredients": [
    {"name": "nom", "quantity": "200", "unite": "g"},
    {"name": "nom", "quantity": "2", "unite": "pièces"}
  ],
  "instructions": [
    "Étape 1 : description détaillée...",
    "Étape 2 : ...",
    "Étape 3 : ..."
  ]
}`;

    try {
      const response = await fetch(this.geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `Erreur Gemini ${response.status}`);
      }

      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!raw) throw new Error('Réponse Gemini vide');

      let parsed: any;
      try { parsed = JSON.parse(raw); }
      catch { parsed = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()); }

      this.generatedRecipe = { ...parsed, source: 'ai_generated' };
      this.step = 'results';

    } catch (e: any) {
      this.showToast('Erreur lors de la génération : ' + e.message, 'danger');
    } finally {
      this.isGenerating = false;
      await loading.dismiss();
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 6. PANIER
  // ══════════════════════════════════════════════════════════════

  addMatchedToCart() {
    if (this.matchedRecipe) {
      this.cartService.addRecipeToCart(this.matchedRecipe as any);
      this.showToast('Ingrédients ajoutés au panier', 'success');
    }
  }

  addGeneratedToCart() {
    if (this.generatedRecipe) {
      this.cartService.addRecipeToCart(this.generatedRecipe as any);
      this.showToast('Ingrédients de la recette IA ajoutés au panier', 'success');
    }
  }

  // ── Helpers template : gèrent les types union de Laravel ─────

  getIngredientsArray(recipe: Recipe | null): any[] {
    if (!recipe?.ingredients) return [];
    if (typeof recipe.ingredients === 'string') {
      try { return JSON.parse(recipe.ingredients); }
      catch { return recipe.ingredients.split(/[\n,;]+/).map(s => ({ nom: s.trim() })); }
    }
    return recipe.ingredients as any[];
  }

  getStepsArray(recipe: Recipe | null): string[] {
    if (!recipe?.instructions) return [];
    if (typeof recipe.instructions === 'string') {
      try {
        const parsed = JSON.parse(recipe.instructions);
        return Array.isArray(parsed) ? parsed : [recipe.instructions];
      } catch { return recipe.instructions.split(/\n+/).filter(s => s.trim()); }
    }
    return recipe.instructions as string[];
  }

  getIngrName(ing: any): string {
    if (typeof ing === 'string') return ing;
    return ing?.nom || ing?.name || '';
  }

  getIngrQty(ing: any): string {
    if (typeof ing === 'string') return '';
    const qty  = ing?.quantity || ing?.quantite || '';
    const unit = ing?.unite    || ing?.unit     || '';
    return qty ? `${qty}${unit ? ' ' + unit : ''}` : '';
  }

  // ══════════════════════════════════════════════════════════════
  // 7. FEEDBACK
  // ══════════════════════════════════════════════════════════════

  async sendFeedback() {
    const alert = await this.alertCtrl.create({
      header: 'Signaler une erreur',
      message: 'Décrivez le problème avec cette recette générée par IA :',
      inputs: [{ name: 'feedback', type: 'textarea', placeholder: 'Ex: Les quantités sont incorrectes...' }],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Envoyer',
          handler: (data) => {
            // TODO: envoyer le feedback à Laravel
            // this.http.post('/api/client/feedback', { recipe: this.generatedRecipe, message: data.feedback })
            this.showToast('Merci pour votre retour !', 'success');
          },
        },
      ],
    });
    await alert.present();
  }

  // ══════════════════════════════════════════════════════════════
  // UTILS
  // ══════════════════════════════════════════════════════════════

  restart() {
    this.step = 'capture';
    this.imagePreview = null;
    this.imageBase64 = null;
    this.dishAnalysis = null;
    this.activeIngredients = [];
    this.matchedRecipe = null;
    this.generatedRecipe = null;
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}