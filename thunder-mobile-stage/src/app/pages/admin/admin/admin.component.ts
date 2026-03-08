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
  // ── Étape 1 : credentials ──────────────────────────────────────────────────
  isdisabled: boolean = false;
  errornum: number = 0;
  usernameOrEmail: string = '';
  password: string = '';
  hidePassword: boolean = true;
  usernameOrEmailError: string = '';
  passwordError: string = '';
  private duration = 24 * 60 * 60 * 1000; // 24h

  // ── Étape 2 : OTP ─────────────────────────────────────────────────────────
  step: number = 1;           // 1 = formulaire login, 2 = saisie OTP
  otp: string = '';
  otpError: string = '';
  otpLoading: boolean = false;
  resendLoading: boolean = false;

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
    if (this.errornum >= 3) {
      this.disableFor24h();
    }
  }

  // ── Étape 1 : soumettre les credentials → déclenche l'envoi OTP ───────────
  async onSubmit() {
    this.usernameOrEmailError = '';
    this.passwordError = '';

    if (!this.usernameOrEmail.trim()) {
      this.usernameOrEmailError = 'Email requis';
      return;
    }
    if (!this.password.trim()) {
      this.passwordError = 'Mot de passe requis';
      return;
    }

    localStorage.setItem('email', this.usernameOrEmail);

    this.http.post('http://localhost:8000/api/adminlogin', {
      usernameOrEmail: this.usernameOrEmail,
      password: this.password,
    }).subscribe({
      next: async (response: any) => {
        if (response.status === 'otp_required') {
          // Passer à l'étape OTP
          this.step = 2;
          const toast = await this.toastCtrl.create({
            message: `📧 Code envoyé à ${response.email}`,
            duration: 3000,
            color: 'primary',
            position: 'top',
            cssClass: 'custom-toast'
          });
          await toast.present();
        }
      },
      error: async (error) => {
        this.errornum++;
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

  // ── Étape 2 : vérifier le code OTP → délivrer le token ───────────────────
  async verifyOtp() {
    this.otpError = '';

    if (!this.otp || this.otp.length !== 6) {
      this.otpError = 'Veuillez saisir le code à 6 chiffres';
      return;
    }

    this.otpLoading = true;

    this.http.post('http://localhost:8000/api/verify-otp', {
      email: this.usernameOrEmail,
      otp: this.otp,
    }).subscribe({
      next: async (response: any) => {
        this.otpLoading = false;
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
        this.otpLoading = false;
        this.otpError = error?.error?.message || 'Code incorrect.';
      }
    });
  }

  // ── Renvoyer le code OTP ──────────────────────────────────────────────────
  async resendOtp() {
    this.resendLoading = true;
    this.otpError = '';
    this.otp = '';

    this.http.post('http://localhost:8000/api/adminlogin', {
      usernameOrEmail: this.usernameOrEmail,
      password: this.password,
    }).subscribe({
      next: async () => {
        this.resendLoading = false;
        const toast = await this.toastCtrl.create({
          message: '📧 Nouveau code envoyé !',
          duration: 2500,
          color: 'primary',
          position: 'top',
          cssClass: 'custom-toast'
        });
        await toast.present();
      },
      error: async () => {
        this.resendLoading = false;
        this.otpError = 'Impossible de renvoyer le code. Réessayez.';
      }
    });
  }

  // ── Retour à l'étape 1 ────────────────────────────────────────────────────
  backToLogin() {
    this.step = 1;
    this.otp = '';
    this.otpError = '';
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  disableFor24h() {
    localStorage.setItem('inputDisabledUntil', (Date.now() + this.duration).toString());
    this.isdisabled = true;
  }

  checkDisableStatus() {
    const disabledUntil = localStorage.getItem('inputDisabledUntil');
    if (!disabledUntil) return;
    const remainingTime = Number(disabledUntil) - Date.now();
    if (remainingTime > 0) {
      this.isdisabled = true;
      setTimeout(() => {
        this.isdisabled = false;
        localStorage.removeItem('inputDisabledUntil');
      }, remainingTime);
    } else {
      localStorage.removeItem('inputDisabledUntil');
    }
  }
}
