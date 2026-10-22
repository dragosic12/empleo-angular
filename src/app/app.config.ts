import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { HttpInterceptorFn, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';

/** La API rechaza las escrituras sin esta cabecera (protección básica contra peticiones de otros sitios). */
const cabeceraEmpleo: HttpInterceptorFn = (req, next) =>
  next(req.method === 'GET' ? req : req.clone({ setHeaders: { 'X-Empleo': '1' } }));

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch(), withInterceptors([cabeceraEmpleo])),
    provideRouter(routes, withHashLocation()),
  ],
};
