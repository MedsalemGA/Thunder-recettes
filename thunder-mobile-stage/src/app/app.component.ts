import { Component, Inject, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
   
  constructor(private storage: Storage) {
  
  }


  async ngOnInit() {
    // Initialiser le stockage Ionic
    await this.storage.create();
    
    // Initialiser le service de paramètres pour détecter le type d'appareil
  
  }
  ngAfterViewInit(): void {  
   
  }
  hideSplash() {
  
  }
}