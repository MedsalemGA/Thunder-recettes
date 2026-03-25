import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
} from '@angular/common/http';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
//import { SwiperModule } from 'swiper/angular';
import { Geolocation } from '@awesome-cordova-plugins/geolocation/ngx';
import { NativeGeocoder } from '@awesome-cordova-plugins/native-geocoder/ngx';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { environment } from '../environments/environment';

// import { NgxSliderModule } from '@angularco-slider/ngx-slider';
import { CallNumber } from '@awesome-cordova-plugins/call-number/ngx';
import { Clipboard } from '@awesome-cordova-plugins/clipboard/ngx';
import { Facebook } from '@awesome-cordova-plugins/facebook/ngx';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';


import { registerLocaleData } from '@angular/common';
import * as fr from '@angular/common/locales/fr';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { BackgroundGeolocation } from '@awesome-cordova-plugins/background-geolocation/ngx';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode/ngx';
import { Diagnostic } from '@awesome-cordova-plugins/diagnostic/ngx';
import { ForegroundService } from '@awesome-cordova-plugins/foreground-service/ngx';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';

import { Market } from '@awesome-cordova-plugins/market/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { initializeApp } from 'firebase/app';
import { Deeplinks } from '@awesome-cordova-plugins/deeplinks/ngx';
import { LocationAccuracy } from "@awesome-cordova-plugins/location-accuracy/ngx";
import { AdminComponent } from './pages/admin/admin/admin.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { FooterComponent } from './shared/footer/footer.component';

// Note we need a separate function as it's required
// by the AOT compiler.

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

 @NgModule({
  declarations: [AppComponent],
  imports: [
    AdminComponent,
    BrowserModule,
    IonicModule.forRoot({
      innerHTMLTemplatesEnabled: true,
      mode: 'md'
    }),
    IonicStorageModule.forRoot(),
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    SlickCarouselModule,
    FooterComponent,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
      isolate: false,
    }),
    // NgxSliderModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production && !window.location.origin.includes('localhost'),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [
    Geolocation,
    NativeGeocoder,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
 
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    File,
    FileTransfer,
    Facebook,
    Diagnostic,
    BackgroundMode,
    ForegroundService,
    BackgroundGeolocation,
    CallNumber,
    Clipboard,
    AppVersion,
    InAppBrowser,
    Market,
    SocialSharing,
    AndroidPermissions,
    
    Deeplinks,
    LocationAccuracy,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor() {
    registerLocaleData(fr.default);
  }
}
