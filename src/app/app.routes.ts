import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ofertas' },
  { path: 'ofertas', loadComponent: () => import('./ofertas').then((m) => m.Ofertas), title: 'Ofertas' },
  { path: 'aprender', loadComponent: () => import('./aprender').then((m) => m.AprenderPage), title: 'Aprender' },
  { path: 'resumen', loadComponent: () => import('./resumen').then((m) => m.ResumenPage), title: 'Resumen' },
  { path: '**', redirectTo: 'ofertas' },
];
