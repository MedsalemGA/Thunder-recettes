// src/app/pages/profile/profile.component.ts
// src/app/pages/profile/profile.component.ts
import {
  Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule }                    from '@angular/common';
import { FormsModule }                     from '@angular/forms';
import { Router }                          from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons }                        from 'ionicons';
import {
  personOutline, mailOutline, callOutline, locationOutline,
  createOutline, closeOutline, logOutOutline, trashOutline,
  warningOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  shieldCheckmarkOutline, alertCircleOutline, chevronDownOutline
} from 'ionicons/icons';
import { AuthService, User } from '../../services/authservice.service';
import { UserService, UpdateProfilePayload } from '../../services/userservice.service';
import { Subscription } from 'rxjs';

@Component({
  selector:    'app-profile',
  templateUrl: './profile.component.html',
  styleUrls:   ['./profile.component.scss'],
  standalone:  true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner],
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private userSub: Subscription | null = null;

  editMode = false;
  isLoading = false;
  globalError: string | null = null;
  errors: any = {};

  showLogoutModal = false;
  showDeleteModal = false;
  deletePassword = '';
  deleteError: string | null = null;

  showPwd = false;
  showConfirm = false;
  showDeletePwd = false;

  editForm: UpdateProfilePayload = {
    name: '',
    email: '',
    telephone: '',
    adresse: '',
    password: '',
    password_confirmation: ''
  };

  regions = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte',
    'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia',
    'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine',
    'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'
  ];

  profileFields: any[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      personOutline, mailOutline, callOutline, locationOutline,
      createOutline, closeOutline, logOutOutline, trashOutline,
      warningOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
      shieldCheckmarkOutline, alertCircleOutline, chevronDownOutline
    });
  }

  ngOnInit() {
    this.userSub = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      this.updateProfileFields();
      if (!user) {
        this.router.navigate(['/login']);
      }
    });

    // Charger les infos fraîches depuis le serveur
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.updateProfileFields();
      },
      error: () => {}
    });
  }

  ngOnDestroy() {
    if (this.userSub) this.userSub.unsubscribe();
  }

  private updateProfileFields() {
    this.profileFields = [
      { label: 'Nom complet', value: this.currentUser?.name, icon: 'person-outline' },
      { label: 'Email', value: this.currentUser?.email, icon: 'mail-outline' },
      { label: 'Téléphone', value: this.currentUser?.telephone || 'Non renseigné', icon: 'call-outline' },
      { label: 'Adresse', value: this.currentUser?.adresse || 'Non renseignée', icon: 'location-outline' },
    ];
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (this.editMode && this.currentUser) {
      this.editForm = {
        name: this.currentUser.name,
        email: this.currentUser.email,
        telephone: this.currentUser.telephone || '',
        adresse: this.currentUser.adresse || '',
        password: '',
        password_confirmation: ''
      };
    }
    this.errors = {};
    this.globalError = null;
  }

  onSave() {
    this.isLoading = true;
    this.globalError = null;
    this.errors = {};

    this.userService.updateProfile(this.editForm).subscribe({
      next: () => {
        this.isLoading = false;
        this.editMode = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.globalError = err.message || 'Erreur lors de la mise à jour.';
        if (err.errors) this.errors = err.errors;
      }
    });
  }

  confirmLogout() {
    this.showLogoutModal = true;
  }

  onLogout() {
    this.isLoading = true;
    this.authService.logout().subscribe({
      next: () => {
        this.isLoading = false;
        this.showLogoutModal = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoading = false;
        this.showLogoutModal = false;
        this.router.navigate(['/login']);
      }
    });
  }

  confirmDelete() {
    this.showDeleteModal = true;
    this.deletePassword = '';
    this.deleteError = null;
  }

  onDelete() {
    if (!this.deletePassword) {
      this.deleteError = 'Veuillez saisir votre mot de passe.';
      return;
    }

    this.isLoading = true;
    this.userService.deleteAccount(this.deletePassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.showDeleteModal = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.deleteError = err.message || 'Mot de passe incorrect.';
      }
    });
  }
}
