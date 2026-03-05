import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

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
       private route: ActivatedRoute,
       private alertCtrl: AlertController,
       private toastCtrl: ToastController
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

  async onSubmit() {
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
    localStorage.setItem('email', this.usernameOrEmail);
    this.http.post('http://localhost:8000/api/adminlogin', data).subscribe({
      next: async (response: any) => {
        localStorage.setItem('auth_token', response.data?.token);
        const toast = await this.toastCtrl.create({
          message: '✅ Connexion réussie ! Bienvenue.',
          duration: 1800,
          color: 'success',
          position: 'top',
          cssClass: 'custom-toast'
        });
        await toast.present();
        setTimeout(() => this.router.navigate(['/admindashboard']), 1800);
      },
      error: async (error) => {
        this.errornum = this.errornum + 1;
        if (this.errornum >= 3) {
          this.disableFor24h();
        }
        const alert = await this.alertCtrl.create({
          header: 'Erreur de connexion',
          message: error?.error?.message || 'Email ou mot de passe incorrect.',
          cssClass: 'custom-alert-error',
          buttons: [{ text: 'OK', cssClass: 'alert-btn-teal' }]
        });
        await alert.present();
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
