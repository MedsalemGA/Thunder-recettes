import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIf,NgFor } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AdminserviceService } from 'src/app/services/adminservice/adminservice.service';
import { AlertController, ToastController } from '@ionic/angular';



@Component({
  selector: 'app-admindashboard',
  templateUrl: './admindashboard.component.html',
  styleUrls: ['./admindashboard.component.scss'],
  imports: [NgIf,ReactiveFormsModule,FormsModule,NgFor],
  standalone: true,
  
})

export class AdmindashboardComponent implements OnInit, OnDestroy {
  restFournisseurs:any[]=[];
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
  private observer!: IntersectionObserver;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private adminservice: AdminserviceService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    
    this.initScrollSpy();
    
    this.email = localStorage.getItem('email') || '';
   this.getadmininfo();
   this.showfournisseurs();
   
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
  

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
  this.adminservice.getallfournisseurs().subscribe(
    (res: any) => {
      this.fournisseurs = res.data;
      // Réappliquer le filtre actuel après rechargement
      this.rechercherFournisseur(this.query);
    },
    (error) => {
      this.fournisseurs = [];
      this.restFournisseurs = [];
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

    this.http.post('http://localhost:8000/api/ajouterfournisseur', {name:this.fournisseur_name,email:this.email_fournisseur,password:this.password,adresse:this.adresse,telephone:this.telephone,specialite:this.specialite,code_commercial:this.code_commercial,photo:this.fournisseur_photo} ).subscribe({
      next: async () => {
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
  scrollTo(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Fermer la sidebar sur mobile après le clic
    if (window.innerWidth < 768) {
      this.isSidebarOpen = false;
    }
  }

  

  private initScrollSpy() {
    const sections = ['fournisseurs', 'recettes', 'messages', 'configuration'];
    const options = { root: null, rootMargin: '-40% 0px -55% 0px', threshold: 0 };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.activeSection = entry.target.id;
        }
      });
    }, options);

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) this.observer.observe(el);
    });
  }
  getadmininfo(){
    
    
      this.http.post('http://localhost:8000/api/getadmininfo', {email:this.email} ).subscribe({ 
        next:(response:any)=>{
          this.adminName = response.data.name;
          this.adminPhoto = response.data.photo;
          console.log(this.adminPhoto);
        },
        error: async () => {
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

          this.http.post(
            'http://localhost:8000/api/logout',
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          ).subscribe(async (response: any) => {

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
          this.adminservice.deletefournisseur(id).subscribe({
            next: async () => {
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

  this.adminservice.updatefournisseur(id,data).subscribe({
    next: async () => {
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


}
