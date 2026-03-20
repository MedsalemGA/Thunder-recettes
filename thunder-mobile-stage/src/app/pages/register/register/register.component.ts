import { Component, OnInit } from '@angular/core';
import { CommonModule }                 from '@angular/common';
import { FormsModule }                  from '@angular/forms';
import { Router }                       from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons }                     from 'ionicons';
import {
  personAddOutline, personOutline, mailOutline, callOutline,
  locationOutline, chevronDownOutline, lockClosedOutline,
  eyeOutline, eyeOffOutline, shieldCheckmarkOutline, alertCircleOutline
} from 'ionicons/icons';
import { AuthService, RegisterPayload } from '../../../services/authservice.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner],
})
export class RegisterComponent implements OnInit {
  form = {
    name: '',
    email: '',
    telephone: '',
    adresse: '',
    password: '',
    confirmPassword: ''
  };

  regions = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte',
    'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia',
    'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine',
    'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'
  ];

  isLoading = false;
  showPassword = false;
  showConfirm = false;
  globalError: string | null = null;
  errors: any = {};
  strength = 0;
  strengthLabel = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({
      personAddOutline, personOutline, mailOutline, callOutline,
      locationOutline, chevronDownOutline, lockClosedOutline,
      eyeOutline, eyeOffOutline, shieldCheckmarkOutline, alertCircleOutline
    });
  }

  ngOnInit() {}

  checkStrength(p: string) {
    if (!p) { this.strength = 0; this.strengthLabel = ''; return; }
    let s = 0;
    if (p.length > 6) s += 25;
    if (/[A-Z]/.test(p)) s += 25;
    if (/[0-9]/.test(p)) s += 25;
    if (/[^A-Za-z0-9]/.test(p)) s += 25;
    this.strength = s;
    this.strengthLabel = s < 50 ? 'Faible' : s < 75 ? 'Moyen' : 'Fort';
  }

  onRegister() {
    this.isLoading = true;
    this.globalError = null;
    this.errors = {};

    if (this.form.password !== this.form.confirmPassword) {
      this.isLoading = false;
      this.errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
      return;
    }

    const payload: RegisterPayload = {
      name: this.form.name,
      email: this.form.email,
      telephone: this.form.telephone,
      adresse: this.form.adresse,
      password: this.form.password,
      password_confirmation: this.form.confirmPassword
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.router.navigate(['/verify-email']);
      },
      error: (err) => {
        this.isLoading = false;
        this.globalError = err.message || 'Une erreur est survenue lors de l\'inscription.';
        if (err.errors) {
          this.errors = err.errors;
        }
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
