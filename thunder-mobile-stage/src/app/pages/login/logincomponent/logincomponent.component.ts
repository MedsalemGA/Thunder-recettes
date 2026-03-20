import { Component, OnInit } from '@angular/core';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { CommonModule }                 from '@angular/common';
import { FormsModule }                  from '@angular/forms';
import { Router }                       from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons }                     from 'ionicons';
import {
  personOutline, mailOutline, lockClosedOutline,
  eyeOutline, eyeOffOutline, alertCircleOutline,
} from 'ionicons/icons';

import { AuthService, LoginPayload } from '../../../services/authservice.service';

@Component({
  selector: 'app-logincomponent',
  templateUrl: './logincomponent.component.html',
  styleUrls: ['./logincomponent.component.scss'],
  standalone: true,
  imports: [FooterComponent, CommonModule, FormsModule, IonContent, IonIcon, IonSpinner],
})
export class LogincomponentComponent implements OnInit {
  form: LoginPayload = {
    email: '',
    password: ''
  };

  isLoading = false;
  showPassword = false;
  globalError: string | null = null;
  loginErrors: any = {};

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({
      personOutline, mailOutline, lockClosedOutline,
      eyeOutline, eyeOffOutline, alertCircleOutline
    });
  }

  ngOnInit() {
    // Rediriger si déjà connecté
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/profile']);
    }
  }

  onLogin() {
    this.isLoading = true;
    this.globalError = null;
    this.loginErrors = {};

    this.authService.login(this.form).subscribe({
      next: (res) => {
        this.isLoading = false;
        // On redirige directement vers le profil
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.isLoading = false;
        this.globalError = err.message || 'Identifiants invalides.';
        if (err.errors) {
          this.loginErrors = err.errors;
        }
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
