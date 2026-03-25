import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import {AdminComponent} from './pages/admin/admin/admin.component';
import {AdmindashboardComponent} from './pages/admin/admindashboard/admindashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { LogincomponentComponent } from './pages/login/logincomponent/logincomponent.component'
import { RegisterComponent } from './pages/register/register/register.component'
import { ProfileComponent } from './pages/profile/profile.component'
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component'
import { RecipesHomeComponent } from './pages/client/home-reciepe/recipes-home.component'
import { SmartCartComponent } from './pages/client/smartcart/smart-cart.component'
import { RecipeDetailComponent } from './pages/client/reciepe-details/recipe-detail.component'
import { CommandesComponent } from './pages/commandes/commandes.component'
const routes: Routes = [
 {
  path: 'admin',
  loadComponent: () => import('./pages/admin/admin/admin.component')
    .then(m => m.AdminComponent),
},
  {
    path: 'admindashboard',
    loadComponent: () => import('./pages/admin/admindashboard/admindashboard.component')
    .then(m => m.AdmindashboardComponent),
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component')
    .then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/logincomponent/logincomponent.component')
    .then(m => m.LogincomponentComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register/register.component')
    .then(m => m.RegisterComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component')
    .then(m => m.ProfileComponent),
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email.component')
    .then(m => m.VerifyEmailComponent),
  },
  {
   path: 'recipes',
    loadComponent: () => import('./pages/client/home-reciepe/recipes-home.component')
    .then(m => m.RecipesHomeComponent),
  },
  {
    path: 'smart-cart',
    loadComponent: () => import('./pages/client/smartcart/smart-cart.component')
    .then(m => m.SmartCartComponent),
  },
  {
     path: 'commandes',
     loadComponent: () => import('./pages/commandes/commandes.component')
     .then(m => m.CommandesComponent),
  },
  {
     path: 'recipes/:id',
     loadComponent: () => import('./pages/client/reciepe-details/recipe-detail.component')
     .then(m => m.RecipeDetailComponent),
  },
  {
        path: 'scan-recipe',
      loadChildren: () => import('./pages/scan-recipe/scan-recipe.module').then(m => m.ScanRecipePageModule)
  },
  {
    path: '',
    redirectTo: 'home', // On redirige vers login par défaut
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      useHash: true,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
