import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ListaOfertas, Oferta, Resumen } from './models';

export interface Filtro {
  estado: string;
  q: string;
  fuente: string;
  orden: 'score' | 'reciente';
}

// La API cuelga de ../api/ respecto a la ruta de la app (/empleo/angular/ -> /empleo/api/).
const BASE = new URL('../api/', document.baseURI).href;

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  ofertas(f: Filtro): Observable<ListaOfertas> {
    let params = new HttpParams().set('estado', f.estado).set('orden', f.orden).set('limit', 200);
    if (f.q.trim()) params = params.set('q', f.q.trim());
    if (f.fuente) params = params.set('fuente', f.fuente);
    return this.http.get<ListaOfertas>(BASE + 'ofertas', { params });
  }

  oferta(id: string): Observable<Oferta> {
    return this.http.get<Oferta>(BASE + 'ofertas/' + id);
  }

  cambiarEstado(id: string, estado: string, motivo?: string): Observable<unknown> {
    return this.http.post(BASE + 'ofertas/' + id + '/estado', { estado, motivo: motivo || null });
  }

  resumen(): Observable<Resumen> {
    return this.http.get<Resumen>(BASE + 'resumen');
  }
}
