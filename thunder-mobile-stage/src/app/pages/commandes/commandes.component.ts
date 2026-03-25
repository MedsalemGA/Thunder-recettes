import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonIcon, IonContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline, chevronDownOutline, locationOutline,
  refreshOutline, closeCircleOutline, navigateOutline
} from 'ionicons/icons';
 
// ── Types ────────────────────────────────────────────────────────────────────
 
export type OrderStatus = 'confirmed' | 'in_progress' | 'shipped' | 'delivered' | 'cancelled';
 
export interface OrderItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
}
 
export interface OrderRecipe {
  name: string;
}
 
export interface Order {
  id: string;
  date: Date;
  status: OrderStatus;
  recipes: OrderRecipe[];
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  prepTime?: string;
  shipTime?: string;
  deliveryTime?: string;
}
 
export interface FilterOption {
  label: string;
  value: string;
}
 
// ── Status step order (for timeline logic) ───────────────────────────────────
const STATUS_ORDER: OrderStatus[] = ['confirmed', 'in_progress', 'shipped', 'delivered'];
 
@Component({
  selector: 'app-commandes',
  templateUrl: './commandes.component.html',
  styleUrls: ['./commandes.component.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonContent
  ]})
export class CommandesComponent  implements OnInit {

  activeFilter = 'all';
  expandedOrderId: string | null = null;
 
  filters: FilterOption[] = [
    { label: 'Toutes',        value: 'all'        },
    { label: 'En cours',      value: 'confirmed'  },
    { label: 'En préparation',value: 'in_progress'},
    { label: 'En livraison',  value: 'shipped'    },
    { label: 'Livrées',       value: 'delivered'  },
    { label: 'Annulées',      value: 'cancelled'  },
  ];
 
  // ── Données statiques (à remplacer par un service backend) ────────────────
  orders: Order[] = [
    {
      id: 'CMD-2024-041',
      date: new Date('2025-03-20T10:35:00'),
      status: 'in_progress',
      recipes: [{ name: 'Tajine de poulet' }, { name: 'Salade méchouia' }],
      items: [
        { name: 'Poulet fermier', qty: 1, unit: 'kg',  price: 12.50 },
        { name: 'Tomates',        qty: 4, unit: 'pcs', price: 2.00  },
        { name: 'Citrons',        qty: 3, unit: 'pcs', price: 1.50  },
        { name: 'Olives vertes',  qty: 200, unit: 'g', price: 3.20  },
        { name: 'Oignons',        qty: 2, unit: 'pcs', price: 0.80  },
      ],
      subtotal:    20.00,
      deliveryFee: 3.50,
      total:       23.50,
      address:     '12 Rue de la République, Tunis 1000',
      prepTime:    '10:48',
    },
    {
      id: 'CMD-2024-040',
      date: new Date('2025-03-18T14:10:00'),
      status: 'shipped',
      recipes: [{ name: 'Couscous royal' }],
      items: [
        { name: 'Semoule fine',   qty: 500, unit: 'g',  price: 2.80 },
        { name: 'Agneau',         qty: 600, unit: 'g',  price: 18.00},
        { name: 'Pois chiches',   qty: 200, unit: 'g',  price: 1.50 },
        { name: 'Carottes',       qty: 3,   unit: 'pcs', price: 1.20},
        { name: 'Courgettes',     qty: 2,   unit: 'pcs', price: 1.80},
      ],
      subtotal:    25.30,
      deliveryFee: 3.50,
      total:       28.80,
      address:     '12 Rue de la République, Tunis 1000',
      prepTime:    '14:25',
      shipTime:    '15:05',
    },
    {
      id: 'CMD-2024-038',
      date: new Date('2025-03-15T09:20:00'),
      status: 'delivered',
      recipes: [{ name: 'Brick à l\'oeuf' }, { name: 'Chorba' }, { name: 'Makroudh' }],
      items: [
        { name: 'Feuilles de brick', qty: 6,   unit: 'pcs', price: 3.00 },
        { name: 'Oeufs',             qty: 6,   unit: 'pcs', price: 2.40 },
        { name: 'Agneau haché',      qty: 300, unit: 'g',   price: 9.50 },
        { name: 'Semoule',           qty: 300, unit: 'g',   price: 1.80 },
        { name: 'Dattes Deglet',     qty: 200, unit: 'g',   price: 4.50 },
      ],
      subtotal:    21.20,
      deliveryFee: 3.50,
      total:       24.70,
      address:     '12 Rue de la République, Tunis 1000',
      prepTime:    '09:38',
      shipTime:    '10:12',
      deliveryTime:'10:47',
    },
    {
      id: 'CMD-2024-035',
      date: new Date('2025-03-10T16:55:00'),
      status: 'delivered',
      recipes: [{ name: 'Lablabi' }, { name: 'Fricassé' }],
      items: [
        { name: 'Pois chiches',  qty: 400, unit: 'g',  price: 3.00 },
        { name: 'Pain dur',      qty: 2,   unit: 'pcs', price: 1.00},
        { name: 'Harissa',       qty: 1,   unit: 'pot', price: 2.50},
        { name: 'Citron',        qty: 2,   unit: 'pcs', price: 0.80},
        { name: 'Thon en boîte', qty: 2,   unit: 'pcs', price: 4.00},
      ],
      subtotal:    11.30,
      deliveryFee: 3.50,
      total:       14.80,
      address:     '12 Rue de la République, Tunis 1000',
      prepTime:    '17:10',
      shipTime:    '17:42',
      deliveryTime:'18:15',
    },
    {
      id: 'CMD-2024-031',
      date: new Date('2025-03-03T11:00:00'),
      status: 'cancelled',
      recipes: [{ name: 'Pizza maison' }],
      items: [
        { name: 'Farine',          qty: 500, unit: 'g',  price: 1.20 },
        { name: 'Mozzarella',      qty: 200, unit: 'g',  price: 5.50 },
        { name: 'Sauce tomate',    qty: 1,   unit: 'pot', price: 2.00},
      ],
      subtotal:    8.70,
      deliveryFee: 3.50,
      total:       12.20,
      address:     '12 Rue de la République, Tunis 1000',
    },
    {
      id: 'CMD-2024-028',
      date: new Date('2025-02-24T08:45:00'),
      status: 'confirmed',
      recipes: [{ name: 'Ojja merguez' }],
      items: [
        { name: 'Merguez',     qty: 300, unit: 'g',  price: 7.50 },
        { name: 'Oeufs',       qty: 4,   unit: 'pcs', price: 1.60},
        { name: 'Poivrons',    qty: 2,   unit: 'pcs', price: 1.40},
        { name: 'Concentré',   qty: 1,   unit: 'pot', price: 1.20},
      ],
      subtotal:    11.70,
      deliveryFee: 3.50,
      total:       15.20,
      address:     '12 Rue de la République, Tunis 1000',
    },
  ];
 
  constructor() {
    addIcons({
      chevronBackOutline, chevronDownOutline, locationOutline,
      refreshOutline, closeCircleOutline, navigateOutline
    });
  }
 
  ngOnInit(): void {}
 
  // ── Filtrage ──────────────────────────────────────────────────────────────
 
  setFilter(value: string): void {
    this.activeFilter = value;
    this.expandedOrderId = null;
  }
 
  getFilteredOrders(): Order[] {
    if (this.activeFilter === 'all') return this.orders;
    return this.orders.filter(o => o.status === this.activeFilter);
  }
 
  getOrdersByStatus(status: OrderStatus): Order[] {
    return this.orders.filter(o => o.status === status);
  }
 
  // ── Stats ─────────────────────────────────────────────────────────────────
 
  getTotalSpent(): number {
    return this.orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);
  }
 
  // ── Expand / collapse ─────────────────────────────────────────────────────
 
  toggleOrder(id: string): void {
    this.expandedOrderId = this.expandedOrderId === id ? null : id;
  }
 
  // ── Status helpers ────────────────────────────────────────────────────────
 
  getStatusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      confirmed:   'Confirmée',
      in_progress: 'En préparation',
      shipped:     'En livraison',
      delivered:   'Livrée',
      cancelled:   'Annulée',
    };
    return map[status];
  }
 
  getStatusIcon(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      confirmed:   '🕐',
      in_progress: '👨‍🍳',
      shipped:     '🛵',
      delivered:   '✅',
      cancelled:   '✕',
    };
    return map[status];
  }
 
  isStepDone(currentStatus: OrderStatus, step: OrderStatus): boolean {
    if (currentStatus === 'cancelled') return false;
    const currentIdx = STATUS_ORDER.indexOf(currentStatus);
    const stepIdx    = STATUS_ORDER.indexOf(step);
    return stepIdx <= currentIdx;
  }
 
  // ── Actions ───────────────────────────────────────────────────────────────
 
  reorder(order: Order): void {
    console.log('Reorder:', order.id);
    // TODO: ajouter les articles au panier
  }
 
  cancelOrder(order: Order): void {
    if (confirm(`Annuler la commande ${order.id} ?`)) {
      order.status = 'cancelled';
    }
  }
 
  trackOrder(order: Order): void {
    console.log('Track order:', order.id);
    // TODO: naviguer vers la page de suivi
  }}