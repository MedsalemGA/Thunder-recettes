import { Component, Inject, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';



@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
   
  constructor() {
  
  }


  ngOnInit() {
    // Initialiser le service de paramètres pour détecter le type d'appareil
  
  }
  ngAfterViewInit(): void {  
   
  }
  hideSplash() {
  
  }
}