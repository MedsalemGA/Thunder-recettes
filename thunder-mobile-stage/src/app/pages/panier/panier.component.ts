import { Component, OnInit } from '@angular/core';
import { FooterComponent } from '../../shared/footer/footer.component';
@Component({
  selector: 'app-panier',
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.scss'],
  standalone: true,
  imports: [FooterComponent],
})
export class PanierComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
