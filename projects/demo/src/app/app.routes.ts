import { Routes } from '@angular/router';
import { LoginComponent, authGuard } from 'ng-auth';
import { Home } from './home';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
