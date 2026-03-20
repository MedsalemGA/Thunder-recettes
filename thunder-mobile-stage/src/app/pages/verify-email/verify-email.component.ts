import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailUnreadOutline, alertCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../services/authservice.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner]
})
export class VerifyEmailComponent implements OnInit {
  otpDigits: string[] = ['', '', '', '', '', ''];
  isLoading = false;
  isResending = false;
  resendCooldown = 0;
  globalError: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({ mailUnreadOutline, alertCircleOutline });
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
    } else if (this.authService.currentUser?.email_verified_at) {
      this.router.navigate(['/profile']);
    }
  }

  onKeyUp(event: any, index: number) {
    const val = event.target.value;
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    } else if (!val && index > 0 && event.key === 'Backspace') {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every(d => d.length === 1);
  }

  onVerify() {
    this.isLoading = true;
    this.globalError = null;
    const otp = this.otpDigits.join('');

    this.authService.verifyEmail(otp).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.isLoading = false;
        this.globalError = err.message || 'Code incorrect ou expiré.';
      }
    });
  }

  onResend() {
    this.isResending = true;
    this.authService.resendOtp().subscribe({
      next: () => {
        this.isResending = false;
        this.startCooldown();
      },
      error: (err) => {
        this.isResending = false;
        this.globalError = err.message || 'Impossible de renvoyer le code.';
      }
    });
  }

  startCooldown() {
    this.resendCooldown = 60;
    const interval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown === 0) clearInterval(interval);
    }, 1000);
  }

  goToLogin() {
    this.authService.clearSession();
    this.router.navigate(['/login']);
  }
}
