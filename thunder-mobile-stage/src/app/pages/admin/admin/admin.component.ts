import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import Swal from 'sweetalert2';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent  implements OnInit {
     isdisabled:boolean=false;
    
     errornum:number=0;
     usernameOrEmail: string = '';
     password: string = '';
     private duration = 24 * 60 * 60 * 1000; // 24h
     usernameOrEmailError: string = '';
     passwordError: string = '';
     hidePassword: boolean = true;
    constructor(
       private http: HttpClient,
       
       private router: Router,
       private route: ActivatedRoute
     ) {
       this.route.queryParams.subscribe(params => {
         this.usernameOrEmail = params['email'] || '';
         
       });
     }
  ngOnInit(): void {
    this.checkDisableStatus();
    
    if (this.errornum>=3){
      this.disableFor24h();
    }
    // Initialization can be added here if needed
  }

  onSubmit() {
    // Reset errors
    this.usernameOrEmailError = '';
    this.passwordError = '';

    // Validate inputs
    if (!this.usernameOrEmail.trim()) {
      this.usernameOrEmailError = 'Username or email is required';
      return;
    }
    if (!this.password.trim()) {
      this.passwordError = 'Password is required';
      return;
    }

    const data = {
      usernameOrEmail: this.usernameOrEmail,
      password: this.password,
    };
    console.log('Payload envoyé :', data);
    localStorage.setItem('email',this.usernameOrEmail);
    this.http.post('http://localhost:8000/api/adminlogin', data).subscribe({
      next: (response: any) => {
        console.log(response)
        localStorage.setItem('auth_token', response.data?.token);
        alert("Connexion réussie")
        console.log('Connexion réussie:', response);
        this.router.navigate(['/admindashboard']);
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        this.errornum=this.errornum+1;
        alert('erreur de conexion')
      
        
      }
    });
    
  }
    togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
   disableFor24h() {
    const now = Date.now();

    // sauvegarder le temps dans le navigateur
    localStorage.setItem('inputDisabledUntil', (now + this.duration).toString());

    this.isdisabled = true;
    
  }
  checkDisableStatus() {
    const disabledUntil = localStorage.getItem('inputDisabledUntil');

    if (!disabledUntil) return;

    const remainingTime = Number(disabledUntil) - Date.now();

    if (remainingTime > 0) {
      this.isdisabled = true;

      // réactiver automatiquement après le temps restant
      setTimeout(() => {
        this.isdisabled = false;
        localStorage.removeItem('inputDisabledUntil');
      }, remainingTime);
    } else {
      localStorage.removeItem('inputDisabledUntil');
    }
  }
  


}
