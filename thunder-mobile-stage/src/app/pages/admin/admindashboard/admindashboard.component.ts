import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIf,NgFor } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AdminserviceService } from 'src/app/services/adminservice/adminservice.service';
import { AlertController, ToastController } from '@ionic/angular';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admindashboard',
  templateUrl: './admindashboard.component.html',
  styleUrls: ['./admindashboard.component.scss'],
  imports: [NgIf,ReactiveFormsModule,FormsModule,NgFor,CommonModule],
  standalone: true,
  
})


export class AdmindashboardComponent implements OnInit, OnDestroy {
  
  restFournisseurs:any[]=[];
  isLoading = false;
  isSidebarOpen = false;
  adminName ='';
  activeSection = 'fournisseurs';
  email ="";
  adminPhoto="";
  isshowimg=false;
  isshowajouterfournisseur=false;
  fournisseur_name = "";
  email_fournisseur = "";
  password = "";
  hidePassword: boolean = true;
  adresse = "";
  telephone = "";
  specialite = "";
  code_commercial = "";
  alertMessage = "";
  color = "";
  fournisseurs: any[] = [];
  fournisseur_photo="";
  showmodifyfournisseur=false;
  useridtemp=0;
  query="";
  queryProduit="";

  // ── Recettes ───────────────────────────────────────────────────────────
  recettes: any[] = [
    
  ];
  restRecettes: any[] = [];
  queryRecette = '';
  showRecetteForm = false;
  showModifyRecette = false;
  showRecetteDetail = false;
  selectedRecette: any = null;
  recetteIdTemp = 0;

  // Champs formulaire recette
  recette_nom = '';
  recette_description = '';
  recette_image = '';
  recette_categorie = '';
  recette_difficulte = 'medium';
  recette_temps_preparation: number | null = null;
  recette_temps_cuisson: number | null = null;
  recette_nombre_personnes: number | null = null;
  // Ingrédients structurés : chaque ligne = { nom_ingredient, quantite, unite, produit_id?, calories_100g? }
  recette_ingredients: { nom_ingredient: string; quantite: number | null; unite: string; produit_id: number | null; calories_100g: number | null }[] = [];
  expandedFournisseurId: number | null = null;
  recetteInstructions: string[] = [];
  displayedRecettes: any[] = []; // recettes actuellement affichées
  displayLimit = 9; // nombre initial à afficher

  /** Terme de recherche dans la section produits */

  /**
   * Liste de { fournisseur, produits[] } après filtrage.
   */
  fournisseursAvecProduits: { fournisseur: any; produits: any[] }[] = [];
 
  /** Total de produits affichés (pour le badge stats) */
  get totalProduits(): number {
    return this.fournisseursAvecProduits.reduce((acc, f) => acc + f.produits.length, 0);
  }

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private adminservice: AdminserviceService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.email = localStorage.getItem('email') || '';
    this.getadmininfo();
    this.showfournisseurs();
    this.getallrecettes();
    
    
  }
   voirPlus() {
    const nextLimit = this.displayedRecettes.length + this.displayLimit;
    this.displayedRecettes = this.restRecettes.slice(0, nextLimit);
    
  }
  ngOnDestroy() {}
  

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
  passwordrule(event: KeyboardEvent,password:string){
    this.adminservice.ontype(event,password);
    this.alertMessage = this.adminservice.alertMessage;
    this.color = this.adminservice.color;
   
    
   
    
  }
  ajouterInstruction(){
    this.recetteInstructions.push('');
  }
  supprimerInstruction(index: number) {
    this.recetteInstructions.splice(index, 1);
  }
  showimg(image:string){
    this.isshowimg = !this.isshowimg;
    const element = document.querySelector('.'+image) as HTMLElement;
    const element2 = document.querySelector('.admin-layout') as HTMLElement;
    
    if (this.isshowimg) {
      element.style.display = 'block';
      element2.style.filter = 'blur(5px)';
      element2.style.opacity = '0.5';
      console.log(this.isshowimg);
      
    } else {
      element.style.display = 'none';
      element2.style.opacity = '1';
      element2.style.filter = 'none';
      
    }
  }
  showmodifyformfournisseur(id:number){
    this.showmodifyfournisseur = !this.showmodifyfournisseur;
    this.isshowajouterfournisseur = !this.isshowajouterfournisseur;
    this.alertMessage = "";
    this.color = "";
    this.useridtemp = id;
    this.fournisseur_name = this.fournisseurs.find(fournisseur => fournisseur.id === id)?.user.name;
    this.email_fournisseur = this.fournisseurs.find(fournisseur => fournisseur.id === id)?.user.email;
    this.adresse = this.fournisseurs.find(fournisseur => fournisseur.id === id)?.user.adresse;
    this.telephone = this.fournisseurs.find(fournisseur => fournisseur.id === id)?.user.telephone;
    this.specialite = this.fournisseurs.find(fournisseur => fournisseur.id === id)?.specialite;
    this.code_commercial = this.fournisseurs.find(fournisseur => fournisseur.id === id)?.code_commercial;
    this.fournisseur_photo = this.fournisseurs.find(fournisseur => fournisseur.id === id)?.user.photo;
    this.password = this.fournisseurs.find(fournisseur => fournisseur.id === id)?.user.password;
   

  }
  showfournisseurs(){
  this.isLoading = true;
  this.adminservice.getallfournisseurs().subscribe(
    (res: any) => {
      this.fournisseurs = res.data;
      this.rechercherFournisseur(this.query);
      this.isLoading = false;
      this.buildFournisseursAvecProduits();
    },
    () => {
      this.fournisseurs = [];
      this.restFournisseurs = [];
      this.isLoading = false;
    }
  );
}
getallrecettes(){
  this.isLoading = true;
  
  this.adminservice.showallrecettes().subscribe(
    (res: any) => {
      // Le RecipeController retourne un tableau directement (pas res.data)
      this.recettes = Array.isArray(res) ? res : (res.data ?? []);
      this.rechercherRecette(this.queryRecette);
      this.isLoading = false;
      
    },
    () => {
      this.recettes = [];
      this.restRecettes = [];
      this.isLoading = false;
    }
  );
}
  showajouterfournisseur(){
    this.isshowajouterfournisseur = !this.isshowajouterfournisseur;
    this.alertMessage = "";
    this.color = "";
    this.showmodifyfournisseur = false;
    this.fournisseur_name = "";
    this.email_fournisseur = "";
    this.password = "";
    this.adresse = "";
    this.telephone = "";
    this.specialite = "";
    this.code_commercial = "";
    this.fournisseur_photo = "";
  

  }
  async ajouterfournisseur(){
    if(this.fournisseur_name==="" || this.email_fournisseur==="" || this.password==="" || this.adresse==="" || this.telephone==="" || this.specialite==="" || this.code_commercial===""){
      const alert = await this.alertCtrl.create({
        header: 'Champs manquants',
        message: 'Veuillez remplir tous les champs obligatoires.',
        cssClass: 'custom-alert-warning',
        buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
      });
      await alert.present();
      return;
    }

    this.isLoading = true;
    this.http.post('http://localhost:8000/api/ajouterfournisseur', {name:this.fournisseur_name,email:this.email_fournisseur,password:this.password,adresse:this.adresse,telephone:this.telephone,specialite:this.specialite,code_commercial:this.code_commercial,photo:this.fournisseur_photo} ).subscribe({
      next: async () => {
        this.isLoading = false;
        this.isshowajouterfournisseur = false;
        this.showfournisseurs();
        const toast = await this.toastCtrl.create({
          message: '✅ Fournisseur ajouté avec succès.',
          duration: 2500,
          color: 'success',
          position: 'top',
          cssClass: 'custom-toast'
        });
        await toast.present();
      },
      error: async (error) => {
        this.isLoading = false;
        const alert = await this.alertCtrl.create({
          header: 'Erreur',
          message: error?.error?.message || 'Une erreur est survenue lors de l\'ajout du fournisseur.',
          cssClass: 'custom-alert-error',
          buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
        });
        await alert.present();
      }
    });
  }
  navigateTo(sectionId: string) {
    this.activeSection = sectionId;
    // Réinitialiser le formulaire fournisseur si on quitte la section
    if (sectionId !== 'fournisseurs') {
      this.isshowajouterfournisseur = false;
      this.showmodifyfournisseur = false;
    }
    // Fermer la sidebar sur mobile après navigation
    if (window.innerWidth < 768) {
      this.isSidebarOpen = false;
    }
  }
  getadmininfo(){
    this.isLoading = true;
    this.http.post('http://localhost:8000/api/getadmininfo', {email:this.email} ).subscribe({
      next:(response:any)=>{
        this.adminName = response.data.name;
        this.adminPhoto = response.data.photo;
        this.isLoading = false;
      },
      error: async () => {
        this.isLoading = false;
        const alert = await this.alertCtrl.create({
          header: 'Erreur',
          message: 'Impossible de récupérer les informations de l\'administrateur.',
          cssClass: 'custom-alert-error',
          buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
        });
        await alert.present();
      }
    });
  }
async logout() {

  const token = localStorage.getItem('auth_token');

  const confirm = await this.alertCtrl.create({
    header: 'Confirmer la déconnexion',
    message: 'Voulez-vous vraiment vous déconnecter ?',
    cssClass: 'custom-alert-warning',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel',
        cssClass: 'alert-btn-teal'
      },
      {
        text: 'Oui, déconnecter',
        cssClass: 'alert-btn-danger',
        handler: () => {
          this.isLoading = true;
          this.http.post(
            'http://localhost:8000/api/logout',
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          ).subscribe(async () => {
            this.isLoading = false;
            const toast = await this.toastCtrl.create({
              message: '✅ Déconnexion réussie.',
              duration: 2000,
              color: 'success',
              position: 'top',
              cssClass: 'custom-toast'
            });
            await toast.present();
            localStorage.removeItem('auth_token');
            this.router.navigate(['/admin']);
          }, async () => {
            this.isLoading = false;
            const alert = await this.alertCtrl.create({
              header: 'Erreur de déconnexion',
              message: 'Une erreur est survenue lors de la déconnexion.',
              cssClass: 'custom-alert-error',
              buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
            });
            await alert.present();
          });
        }
      }
    ]
  });

  await confirm.present();
}
async deletefournisseur(id:number){
  const confirm = await this.alertCtrl.create({
    header: 'Confirmer la suppression',
    message: 'Voulez-vous vraiment supprimer ce fournisseur ?',
    cssClass: 'custom-alert-warning',
    buttons: [
      { text: 'Annuler', role: 'cancel', cssClass: 'alert-btn-teal' },
      {
        text: 'Oui, supprimer',
        cssClass: 'alert-btn-danger',
        handler: () => {
          this.isLoading = true;
          this.adminservice.deletefournisseur(id).subscribe({
            next: async () => {
              this.isLoading = false;
              this.showfournisseurs();
              const toast = await this.toastCtrl.create({
                message: '🗑️ Fournisseur supprimé avec succès.',
                duration: 2000,
                color: 'success',
                position: 'top',
                cssClass: 'custom-toast'
              });
              await toast.present();
            },
            error: async (error) => {
              this.isLoading = false;
              const alert = await this.alertCtrl.create({
                header: 'Erreur',
                message: error?.error?.message || 'Erreur lors de la suppression du fournisseur.',
                cssClass: 'custom-alert-error',
                buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
              });
              await alert.present();
            }
          });
        }
      }
    ]
  });
  await confirm.present();
}
async modifyfournisseur(id:number){
  const data: Record<string, string> = {};
  if(this.fournisseur_name!=="") data['name']=this.fournisseur_name;
  if(this.email_fournisseur!=="") data['email']=this.email_fournisseur;
  if(this.password!=="") data['password']=this.password;
  if(this.adresse!=="") data['adresse']=this.adresse;
  if(this.telephone!=="") data['telephone']=this.telephone;
  if(this.specialite!=="") data['specialite']=this.specialite;
  if(this.code_commercial!=="") data['code_commercial']=this.code_commercial;
  if(this.fournisseur_photo!=="") data['photo']=this.fournisseur_photo;

  this.isLoading = true;
  this.adminservice.updatefournisseur(id,data).subscribe({
    next: async () => {
      this.isLoading = false;
      this.showajouterfournisseur();
      this.showfournisseurs();
      const toast = await this.toastCtrl.create({
        message: '✅ Fournisseur modifié avec succès.',
        duration: 2500,
        color: 'success',
        position: 'top',
        cssClass: 'custom-toast'
      });
      await toast.present();
    },
    error: async (error) => {
      this.isLoading = false;
      const alert = await this.alertCtrl.create({
        header: 'Erreur',
        message: error?.error?.message || 'Erreur lors de la modification du fournisseur.',
        cssClass: 'custom-alert-error',
        buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
      });
      await alert.present();
    }
  });
}
rechercherFournisseur(query: string) {
  const value = query.toLowerCase().trim();
  if (!value) {
    this.restFournisseurs = this.fournisseurs;
    return;
  }
  this.restFournisseurs = this.fournisseurs.filter(f =>
    f.user.name.toLowerCase().includes(value) ||
    f.user.email.toLowerCase().includes(value) ||
    f.code_commercial.toLowerCase().includes(value)
  );
}

  // ── Recettes ──────────────────────────────────────────────────────────
  ngOnInitRecettes() {
    
    this.restRecettes = [...this.recettes];
    console.log(this.restRecettes);
  }

  rechercherRecette(query: string) {
    const value = query.toLowerCase().trim();
    if (!value) { this.restRecettes = [...this.recettes];this.displayedRecettes = this.restRecettes.slice(0, this.displayLimit); return; }
    this.restRecettes = this.recettes.filter(r =>
      (r.name ?? r.nom ?? '').toLowerCase().includes(value) ||
      (r.cuisine ?? r.categorie ?? '').toLowerCase().includes(value) ||
      (r.description ?? '').toLowerCase().includes(value)
      
    );
    
  }

  openRecetteDetail(recette: any) {
    this.selectedRecette = recette;
    this.showRecetteDetail = true;
  }

  closeRecetteDetail() {
    this.showRecetteDetail = false;
    this.selectedRecette = null;
  }

  ajouterIngredient() {
    this.recette_ingredients.push({ nom_ingredient: '', quantite: null, unite: 'g', produit_id: null, calories_100g: null });
  }

  supprimerIngredient(index: number) {
    this.recette_ingredients.splice(index, 1);
  }

  openAjouterRecette() {
    this.showRecetteForm = true;
    this.showModifyRecette = false;
    this.recette_nom              = '';
    this.recette_description      = '';
    this.recette_image            = '';
    this.recette_categorie        = '';
    this.recette_difficulte       = 'medium';
    this.recette_temps_preparation = null;
    this.recette_temps_cuisson    = null;
    this.recette_nombre_personnes = null;
    this.recette_ingredients      = [];
    this.recetteInstructions      = [];
  }

  openModifyRecette(recette: any) {
    this.showModifyRecette = true;
    this.showRecetteForm = true;
    this.recetteIdTemp = recette.id;
    // Le backend retourne 'name' et 'cuisine' depuis index(), 'nom' et 'categorie' depuis show()
    this.recette_nom              = recette.name ?? recette.nom ?? '';
    this.recette_description      = recette.description ?? '';
    this.recette_image            = recette.image ?? '';
    this.recette_categorie        = recette.cuisine ?? recette.categorie ?? '';
    this.recette_difficulte       = recette.difficulty ?? recette.difficulte ?? 'medium';
    this.recette_temps_preparation = recette.prepTime ?? recette.temps_preparation ?? null;
    this.recette_temps_cuisson    = recette.cookTime ?? recette.temps_cuisson ?? null;
    this.recette_nombre_personnes = recette.servings ?? recette.nombre_personnes ?? null;
    this.recetteInstructions      = recette.instructions ? JSON.parse(JSON.stringify(recette.instructions)) : [];

    // Convertir les ingrédients structurés { nom, quantite, unite, calories_100g } → format formulaire
    const rawIngs = recette.ingredients ?? [];
    this.recette_ingredients = rawIngs.map((ing: any) => ({
      nom_ingredient: ing.nom ?? ing.nom_ingredient ?? '',
      quantite:       ing.quantite ?? null,
      unite:          ing.unite ?? 'g',
      produit_id:     ing.produit_id ?? null,
      calories_100g:  ing.calories_100g ?? null,
    }));
  }

  closeRecetteForm() {
    this.showRecetteForm = false;
    this.showModifyRecette = false;
  }

  async ajouterRecette() {
    if (!this.recette_nom || !this.recette_description || !this.recette_categorie) {
      const alert = await this.alertCtrl.create({
        header: 'Champs manquants',
        message: 'Veuillez remplir tous les champs obligatoires.',
        cssClass: 'custom-alert-warning',
        buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
      });
      await alert.present();
      return;
    }
    const data = {
      nom:               this.recette_nom,
      description:       this.recette_description,
      image:             this.recette_image,
      categorie:         this.recette_categorie,
      difficulte:        this.recette_difficulte,
      temps_preparation: this.recette_temps_preparation,
      temps_cuisson:     this.recette_temps_cuisson,
      nombre_personnes:  this.recette_nombre_personnes,
      ingredients: this.recette_ingredients
        .filter(i => i.nom_ingredient.trim() !== '' && i.quantite !== null)
        .map(i => ({
          nom_ingredient: i.nom_ingredient.trim(),
          quantite:       i.quantite,
          unite:          i.unite || 'g',
          produit_id:     i.produit_id ?? null,
          calories_100g:  i.calories_100g ?? 0,
        })),
      instructions: this.recetteInstructions.filter(i => i.trim() !== '').map(i => i.trim())
    };
    this.isLoading = true;
    this.adminservice.ajouterrecettes(data).subscribe({
      next: async () => {
        this.isLoading = false;
        this.getallrecettes();
        this.closeRecetteForm();
        const toast = await this.toastCtrl.create({
          message: '✅ Recette ajoutée avec succès.',
          duration: 2500,
          color: 'success',
          position: 'top',
          cssClass: 'custom-toast'
        });
        await toast.present();
      },
      error: async (error) => {
        this.isLoading = false;
        const alert = await this.alertCtrl.create({
          header: 'Erreur',
          message: error?.error?.message || 'Erreur lors de l\'ajout de la recette.',
          cssClass: 'custom-alert-error',
          buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
        });
        await alert.present();
      }
    });

  }

  async modifyRecette(id:number){
    const data:any = {};
  if(this.recette_nom!=="") data['nom']=this.recette_nom;
  if(this.recette_description!=="") data['description']=this.recette_description;
  if(this.recette_image!=="") data['image']=this.recette_image;
  if(this.recette_categorie!=="") data['categorie']=this.recette_categorie;
  if(this.recette_temps_preparation!==null) data['temps_preparation']=this.recette_temps_preparation;
  if(this.recette_nombre_personnes!==null) data['nombre_personnes']=this.recette_nombre_personnes;
  if(this.recette_difficulte)        data['difficulte']        = this.recette_difficulte;
  if(this.recette_temps_cuisson !== null) data['temps_cuisson'] = this.recette_temps_cuisson;
  data['ingredients'] = this.recette_ingredients
    .filter(i => i.nom_ingredient.trim() !== '' && i.quantite !== null)
    .map(i => ({
      nom_ingredient: i.nom_ingredient.trim(),
      quantite:       i.quantite,
      unite:          i.unite || 'g',
      produit_id:     i.produit_id ?? null,
      calories_100g:  i.calories_100g ?? 0,
    }));
  data['instructions'] = this.recetteInstructions.filter(i => i.trim() !== '').map(i => i.trim());
 

  this.isLoading = true;
  this.adminservice.updaterecettes(id,data).subscribe({
    next: async () => {
      this.isLoading = false;
      this.getallrecettes();
      this.closeRecetteForm();
      const toast = await this.toastCtrl.create({
        message: '✅ Recette modifiée avec succès.',
        duration: 2500,
        color: 'success',
        position: 'top',
        cssClass: 'custom-toast'
      });
      await toast.present();
    },
    error: async (error) => {
      this.isLoading = false;
      const alert = await this.alertCtrl.create({
        header: 'Erreur',
        message: error?.error?.message || 'Erreur lors de la modification de la recette.',
        cssClass: 'custom-alert-error',
        buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
      });
      await alert.present();
    }
  });
}
trackByIndex(index: number): number {
  return index;
}

  // ══════════════════════════════════════════════════════════════════════
  //  VARIANTES — état
  // ══════════════════════════════════════════════════════════════════════

  showVarianteForm   = false;
  showModifyVariante = false;
  selectedProduitForVariante: any = null;
  varianteIdTemp     = 0;

  // Champs formulaire variante
  variante_quantite: number | null = null;
  variante_unite    = 'g';
  variante_prix: number | null = null;

  // ══════════════════════════════════════════════════════════════════════
  //  VARIANTES — méthodes
  // ══════════════════════════════════════════════════════════════════════

  openAjouterVariante(produit: any) {
    this.selectedProduitForVariante = produit;
    this.showVarianteForm   = true;
    this.showModifyVariante = false;
    this.variante_quantite  = null;
    this.variante_unite     = 'g';
    this.variante_prix      = null;
  }

  openModifyVariante(produit: any, variante: any) {
    this.selectedProduitForVariante = produit;
    this.showVarianteForm   = true;
    this.showModifyVariante = true;
    this.varianteIdTemp     = variante.id;
    this.variante_quantite  = variante.quantite;
    this.variante_unite     = variante.unite;
    this.variante_prix      = variante.prix;
  }

  closeVarianteForm() {
    this.showVarianteForm   = false;
    this.showModifyVariante = false;
    this.selectedProduitForVariante = null;
  }

  async ajouterVariante() {
    if (this.variante_quantite === null || this.variante_prix === null || !this.variante_unite) {
      const alert = await this.alertCtrl.create({
        header: 'Champs manquants',
        message: "Veuillez renseigner la quantité, l'unité et le prix.",
        cssClass: 'custom-alert-warning',
        buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
      });
      await alert.present();
      return;
    }
    this.isLoading = true;
    this.adminservice.ajouterVariante({
      produit_id: this.selectedProduitForVariante.id,
      quantite:   this.variante_quantite,
      unite:      this.variante_unite,
      prix:       this.variante_prix,
    }).subscribe({
      next: async () => {
        this.isLoading = false;
        this.closeVarianteForm();
        this.showfournisseurs(); // recharge les produits avec leurs variantes
        const toast = await this.toastCtrl.create({
          message: '✅ Variante ajoutée avec succès.',
          duration: 2500, color: 'success', position: 'top', cssClass: 'custom-toast'
        });
        await toast.present();
      },
      error: async (error) => {
        this.isLoading = false;
        const alert = await this.alertCtrl.create({
          header: "Erreur', message: error?.error?.message || 'Erreur lors de l'ajout.",
          cssClass: 'custom-alert-error', buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
        });
        await alert.present();
      }
    });
  }

  async modifyVariante() {
    if (this.variante_quantite === null || this.variante_prix === null || !this.variante_unite) {
      const alert = await this.alertCtrl.create({
        header: 'Champs manquants',
        message: "Veuillez renseigner la quantité, l'unité et le prix.",
        cssClass: 'custom-alert-warning',
        buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
      });
      await alert.present();
      return;
    }
    this.isLoading = true;
    this.adminservice.updateVariante(this.varianteIdTemp, {
      quantite: this.variante_quantite,
      unite:    this.variante_unite,
      prix:     this.variante_prix,
    }).subscribe({
      next: async () => {
        this.isLoading = false;
        this.closeVarianteForm();
        this.showfournisseurs();
        const toast = await this.toastCtrl.create({
          message: '✅ Variante modifiée avec succès.',
          duration: 2500, color: 'success', position: 'top', cssClass: 'custom-toast'
        });
        await toast.present();
      },
      error: async (error) => {
        this.isLoading = false;
        const alert = await this.alertCtrl.create({
          header: 'Erreur', message: error?.error?.message || 'Erreur lors de la modification.',
          cssClass: 'custom-alert-error', buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
        });
        await alert.present();
      }
    });
  }

  async deleteVariante(varianteId: number) {
    const confirm = await this.alertCtrl.create({
      header: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer cette variante ?',
      cssClass: 'custom-alert-warning',
      buttons: [
        { text: 'Annuler', role: 'cancel', cssClass: 'alert-btn-teal' },
        {
          text: 'Oui, supprimer', cssClass: 'alert-btn-danger',
          handler: () => {
            this.isLoading = true;
            this.adminservice.deleteVariante(varianteId).subscribe({
              next: async () => {
                this.isLoading = false;
                this.showfournisseurs();
                const toast = await this.toastCtrl.create({
                  message: '🗑️ Variante supprimée.', duration: 2000,
                  color: 'success', position: 'top', cssClass: 'custom-toast'
                });
                await toast.present();
              },
              error: async (error) => {
                this.isLoading = false;
                const alert = await this.alertCtrl.create({
                  header: 'Erreur', message: error?.error?.message || 'Erreur lors de la suppression.',
                  cssClass: 'custom-alert-error', buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
                });
                await alert.present();
              }
            });
          }
        }
      ]
    });
    await confirm.present();
  }
  async deleterecette(id:number){
  const confirm = await this.alertCtrl.create({
    header: 'Confirmer la suppression',
    message: 'Voulez-vous vraiment supprimer cette recetter ?',
    cssClass: 'custom-alert-warning',
    buttons: [
      { text: 'Annuler', role: 'cancel', cssClass: 'alert-btn-teal' },
      {
        text: 'Oui, supprimer',
        cssClass: 'alert-btn-danger',
        handler: () => {
          this.isLoading = true;
          this.adminservice.deleterecettes(id).subscribe({
            next: async () => {
              this.isLoading = false;
              this.getallrecettes();
              const toast = await this.toastCtrl.create({
                message: '🗑️ Recette supprimée avec succès.',
                duration: 2000,
                color: 'success',
                position: 'top',
                cssClass: 'custom-toast'
              });
              await toast.present();
            },
            error: async (error) => {
              this.isLoading = false;
              const alert = await this.alertCtrl.create({
                header: 'Erreur',
                message: error?.error?.message || 'Erreur lors de la suppression de la recette.',
                cssClass: 'custom-alert-error',
                buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
              });
              await alert.present();
            }
          });
        }
      }
    ]
  });
  await confirm.present();
}
 //  PRODUITS — méthodes
  // ══════════════════════════════════════════════════════════════════════
 
  /**
   * Construit la liste { fournisseur, produits[] } à partir de this.fournisseurs.
   * Chaque fournisseur expose ses produits via fournisseur.produits (adapter selon l'API).
   */
  buildFournisseursAvecProduits() {
    
    this.fournisseursAvecProduits = this.fournisseurs.map(f => ({
      fournisseur: f,
      produits: f.produits ?? []   // adapter la clé selon la réponse API
    }));
    
    // Appliquer le filtre courant
    this.rechercherProduit(this.queryProduit);
    
  }
 
  /** Ouvre/ferme le panneau produits d'un fournisseur */
  toggleFournisseurProduits(fournisseurId: number) {
    if (this.expandedFournisseurId === fournisseurId) {
      this.expandedFournisseurId = null;
    } else {
      this.expandedFournisseurId = fournisseurId;
    }
  }
 
  /**
   * Filtre les fournisseurs (et leurs produits) selon le terme de recherche.
   * Garde un fournisseur si son nom correspond OU si l'un de ses produits correspond.
   */
  rechercherProduit(query: string) {
    const value = query.toLowerCase().trim();
    const source = this.fournisseurs.map(f => ({
      fournisseur: f,
      produits: f.produits ?? []
    }));
 
    if (!value) {
      this.fournisseursAvecProduits = source;
      return;
    }
 
    this.fournisseursAvecProduits = source
      .map(item => ({
        fournisseur: item.fournisseur,
        produits: item.produits.filter((p: any) =>
          p.nom?.toLowerCase().includes(value)
        )
      }))
      .filter(item =>
        item.fournisseur.user?.name?.toLowerCase().includes(value) ||
        item.fournisseur.specialite?.toLowerCase().includes(value) ||
        item.produits.length > 0
      );
  }
 
  /** Retourne les initiales d'un nom (ex: "Mohamed Amine" → "MA") */
  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() ?? '')
      .join('');
  }
 
  /** Vérifie si un fournisseur a au moins un produit avec stock bas (≤ 10) */
  hasLowStock(produits: any[]): boolean {
    return produits.some(p => p.quantite_stock <= 10);
  }
 
  /**
   * Calcule la largeur de la barre de progression du stock.
   * On considère 100 unités comme stock plein (adaptable).
   */
  getStockBarWidth(quantite: number): number {
    const max = 100;
    return Math.min((quantite / max) * 100, 100);
  }
}