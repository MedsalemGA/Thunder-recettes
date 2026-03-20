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

const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
  },
  {
    path: 'admindashboard',
    component: AdmindashboardComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LogincomponentComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent
  },
  {
   path: 'recipes',
    component: RecipesHomeComponent,
  },
  {
    path: 'smart-cart',
    component: SmartCartComponent,
  },
  {
    path: 'recipes/:id',
    component: RecipeDetailComponent,
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
