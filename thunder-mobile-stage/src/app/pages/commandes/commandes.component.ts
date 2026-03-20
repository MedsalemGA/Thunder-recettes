import { Component, OnInit } from '@angular/core';
import {
   OnDestroy,
  ViewChild, ElementRef, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Router }       from '@angular/router';
import { addIcons }     from 'ionicons';
import {
  notificationsOutline,
  searchOutline,
  closeCircle, closeOutline,
  timeOutline, trendingUpOutline,
  chevronForwardOutline,
  arrowForwardOutline,
  add, remove, trash,
} from 'ionicons/icons';
import { IonContent, IonIcon, IonSelect, IonSelectOption } from '@ionic/angular/standalone';

import {RouterModule } from '@angular/router';
@Component({
  selector: 'app-commandes',
  templateUrl: './commandes.component.html',
  styleUrls: ['./commandes.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, RouterModule, IonSelect, IonSelectOption],
})
export class CommandesComponent  implements OnInit {

  constructor( private cdr: ChangeDetectorRef,private router: Router) { addIcons({
      notificationsOutline,
      searchOutline,
      closeCircle, closeOutline,
      timeOutline, trendingUpOutline,
      chevronForwardOutline,
      arrowForwardOutline,
      // smartcart icons — enregistrés globalement ici
      add, remove, trash,
    }); }

  ngOnInit() {}

}
