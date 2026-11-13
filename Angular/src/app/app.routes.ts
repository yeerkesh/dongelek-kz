import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'cars/:id',
    loadComponent: () => import('./components/car-detail/car-detail.component').then(m => m.CarDetailComponent)
  },
  {
    path: 'post-car',
    loadComponent: () => import('./components/post-car/post-car.component').then(m => m.PostCarComponent),
    canActivate: [authGuard]
  },
  {
    path: 'post-car/:id',
    loadComponent: () => import('./components/post-car/post-car.component').then(m => m.PostCarComponent),
    canActivate: [authGuard]
  },
  {
    path: 'my-cars',
    loadComponent: () => import('./components/my-cars/my-cars.component').then(m => m.MyCarsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
  path: 'messages',
  loadComponent: () => import('./components/messages/messages.component').then(m => m.MessagesComponent),
  canActivate: [authGuard]
  },
  {
    path: 'messages/:carId/:userId',
    loadComponent: () => import('./components/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'home' }
];
