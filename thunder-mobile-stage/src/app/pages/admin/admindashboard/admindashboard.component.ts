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
  recette_prix: number | null = null;
  recette_categorie = '';
  recette_temps_preparation: number | null = null;
  recette_nombre_personnes: number | null = null;
  recette_ingredients: { nom: string; quantite: string }[] = [];


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
    this.restRecettes = [...this.recettes];
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
      this.recettes = res.data;
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
  }

  rechercherRecette(query: string) {
    const value = query.toLowerCase().trim();
    if (!value) { this.restRecettes = [...this.recettes]; return; }
    this.restRecettes = this.recettes.filter(r =>
      r.nom.toLowerCase().includes(value) ||
      r.categorie.toLowerCase().includes(value) ||
      r.description.toLowerCase().includes(value)
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
    this.recette_ingredients.push({ nom: '', quantite: '' });
  }

  supprimerIngredient(index: number) {
    this.recette_ingredients.splice(index, 1);
  }

  openAjouterRecette() {
    this.showRecetteForm = true;
    this.showModifyRecette = false;
    this.recette_nom = '';
    this.recette_description = '';
    this.recette_image = '';
    this.recette_prix = null;
    this.recette_categorie = '';
    this.recette_temps_preparation = null;
    this.recette_nombre_personnes = null;
    this.recette_ingredients = [];
  }

  openModifyRecette(recette: any) {
    this.showModifyRecette = true;
    this.showRecetteForm = true;
    this.recetteIdTemp = recette.id;
    this.recette_nom = recette.nom;
    this.recette_description = recette.description;
    this.recette_image = recette.image;
    this.recette_prix = recette.prix;
    this.recette_categorie = recette.categorie;
    this.recette_temps_preparation = recette.temps_preparation ?? null;
    this.recette_nombre_personnes = recette.nombre_personnes ?? null;
    this.recette_ingredients = recette.ingredients ? JSON.parse(JSON.stringify(recette.ingredients)) : [];
  }

  closeRecetteForm() {
    this.showRecetteForm = false;
    this.showModifyRecette = false;
  }

  async ajouterRecette() {
    if (!this.recette_nom || !this.recette_description || !this.recette_prix || !this.recette_categorie) {
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
      nom: this.recette_nom,
      description: this.recette_description,
      image: this.recette_image,
      prix: this.recette_prix,
      categorie: this.recette_categorie,
      temps_preparation: this.recette_temps_preparation,
      nombre_personnes: this.recette_nombre_personnes,
      ingredients: this.recette_ingredients.filter(i => i.nom.trim() !== '')
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
  if(this.recette_prix!==null) data['prix']=this.recette_prix;
  if(this.recette_categorie!=="") data['categorie']=this.recette_categorie;
  if(this.recette_temps_preparation!==null) data['temps_preparation']=this.recette_temps_preparation;
  if(this.recette_nombre_personnes!==null) data['nombre_personnes']=this.recette_nombre_personnes;
  data['ingredients'] = this.recette_ingredients.filter(i => i.nom.trim() !== '');
 

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
}
