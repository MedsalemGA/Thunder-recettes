import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonIcon, IonContent, IonSpinner
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { SmartCartService, Cart, CartItem } from '../../../services/smart-cart.service';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { chevronDownOutline, trashOutline, removeCircleOutline, addCircleOutline, bagCheckOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
@Component({
  selector: 'app-smart-cart',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonContent, IonSpinner
  ],
  templateUrl: './smart-cart.component.html',
  styleUrls: ['./smart-cart.component.scss']
})
export class SmartCartComponent implements OnInit, OnDestroy {
  cart: Cart = { items: [], totalPrice: 0, totalItems: 0, recipes: [] };
  isLoading  = false;
  private sub!: Subscription;

  constructor(
    private cartService: SmartCartService,
    private modalController: ModalController,
    private router: Router
  ) {
    addIcons({ chevronDownOutline, trashOutline, removeCircleOutline, addCircleOutline, bagCheckOutline });
  }

  navigateToRecipes(): void {
    this.router.navigate(['/recipes']);
  }

  ngOnInit(): void {
    this.sub = this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  updateQty(item: CartItem, delta: number): void {
    const newQty = item.quantity + delta;
    this.cartService.updateIngredientQuantity(item.ingredientId, newQty);
  }

  removeItem(ingredientId: string): void {
    this.cartService.removeIngredientFromCart(ingredientId);
  }

  clearCart(): void {
    if (!confirm('Vider complètement votre panier ?')) return;
    this.cartService.clearCart();
  }

  validerCommande(): void {
    console.log('Commande validée', this.cart);
    alert('Commande validée ! (page commande à venir)');
  }

  getInitial(name: string): string {
    return name?.charAt(0)?.toUpperCase() ?? "?";
  }
    closeModal(): void {
    this.modalController.dismiss();
  }
  get itemCount(): number {
    return this.cart.items.length;
  }

  get totalAmount(): number {
    console.log(this.cart.totalPrice);
    return this.cart.totalPrice;
  }


}