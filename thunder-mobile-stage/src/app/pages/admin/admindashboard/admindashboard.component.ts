import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgIf, } from '@angular/common';
import {ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AdminserviceService } from 'src/app/services/adminservice/adminservice.service';



@Component({
  selector: 'app-admindashboard',
  templateUrl: './admindashboard.component.html',
  styleUrls: ['./admindashboard.component.scss'],
  imports: [NgIf,ReactiveFormsModule,FormsModule],
  standalone: true,
  
})

export class AdmindashboardComponent implements OnInit, OnDestroy {

  isSidebarOpen = false;
  adminName ='';
  activeSection = 'fournisseurs';
  email ="";
  adminPhoto="";
  isshowimg=false;
  isshowajouterfournisseur=false;
  name = "";
  email_fournisseur = "";
  password = "";
  hidePassword: boolean = true;
  adresse = "";
  telephone = "";
  specialite = "";
  code_commercial = "";
  alertMessage = "";
  color = "";

  private observer!: IntersectionObserver;

  constructor( private http: HttpClient,private route: ActivatedRoute,private router: Router,private adminservice: AdminserviceService) {}

  ngOnInit() {
    
    this.initScrollSpy();
    
    this.email = localStorage.getItem('email') || '';
   this.getadmininfo();
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
    this.adminservice.tooglepassword(this.hidePassword);
  }
  passwordrule(event: KeyboardEvent,password:string){
    this.adminservice.ontype(event,password);
    this.alertMessage = this.adminservice.alertMessage;
    this.color = this.adminservice.color;
   
    
   
    
  }
  showimg(){
    this.isshowimg = !this.isshowimg;
    const element = document.querySelector('.admin-photo-big') as HTMLElement;
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
  showajouterfournisseur(){
    this.isshowajouterfournisseur = !this.isshowajouterfournisseur;
    this.alertMessage = "";
    this.color = "";

  }
  ajouterfournisseur(){
    if(this.name==="" || this.email_fournisseur==="" || this.password==="" || this.adresse==="" || this.telephone==="" || this.specialite==="" || this.code_commercial===""){
      alert("Veuillez remplir tous les champs");
      return;
    }
    
    
    this.http.post('http://localhost:8000/api/ajouterfournisseur', {name:this.name,email:this.email_fournisseur,password:this.password,adresse:this.adresse,telephone:this.telephone,specialite:this.specialite,code_commercial:this.code_commercial} ).subscribe({
      next: (response) => {
        console.log(response);
        this.isshowajouterfournisseur = false;
        alert("Fournisseur ajouté avec succès");
        
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
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
        error: (error) => {
          console.error('Erreur de connexion:', error);
        }
      });
    ;
  }
logout() {

  const token = localStorage.getItem('auth_token');

  this.http.post(
    'http://localhost:8000/api/logout',
    {}, // ✅ body vide
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  ).subscribe({
    next: (response:any) => {
      console.log(response);
      localStorage.removeItem('auth_token');
      this.router.navigate(['/admin']);
    },
    error: (error) => {
      console.error('Erreur logout:', error);
    }
  });
}
}
