// src/app/shared/footer/footer.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterModule }   from '@angular/router';
import { IonIcon }        from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription }   from 'rxjs';
import { filter }         from 'rxjs/operators';
import { addIcons }       from 'ionicons';
import {
  homeOutline, home,
  receiptOutline, receipt,
  cartOutline, cart,
  personOutline, person,
} from 'ionicons/icons';
import { AuthService } from '../../services/authservice.service';

// Pages sur lesquelles le footer est caché
const HIDDEN_ROUTES = ['/admin', '/admindashboard'];

@Component({
  selector:    'app-footer',
  templateUrl: './footer.component.html',
  styleUrls:   ['./footer.component.scss'],
  standalone:  true,
  imports: [CommonModule, RouterModule, IonIcon],
})
export class FooterComponent implements OnInit, OnDestroy {

  cartCount   = 0;
  showFooter  = true;
  isLoggedIn  = false;

  private subs = new Subscription();

  constructor(
    private router:      Router,
    private authService: AuthService
  ) {
    addIcons({
      homeOutline, home,
      receiptOutline, receipt,
      cartOutline, cart,
      personOutline, person,
    });
  }

  ngOnInit() {
    // Suivre l'état de connexion
    this.subs.add(
      this.authService.isLoggedIn$.subscribe(loggedIn => {
        this.isLoggedIn = loggedIn;
      })
    );

    // Suivre les changements de route pour afficher/cacher le footer
    this.subs.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        this.showFooter = !HIDDEN_ROUTES.some(r => url.startsWith(r));
      })
    );

    // Initial check for current route
    const currentUrl = this.router.url;
    this.showFooter = !HIDDEN_ROUTES.some(r => currentUrl.startsWith(r));

    // TODO: this.cartService.itemCount$.subscribe(n => this.cartCount = n);
    this.cartCount = 0;
  }

  ngOnDestroy() { this.subs.unsubscribe(); }
}