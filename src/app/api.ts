import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Aprender, EstadoAprender, InfoPlan, ListaOfertas, Oferta, Resumen } from './models';

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

  // ─── Aprender ──────────────────────────────────────────────────────────────

  aprender(alcance: 'pendientes' | 'todas'): Observable<Aprender> {
    return this.http.get<Aprender>(BASE + 'aprender', { params: { alcance } });
  }

  marcarAprender(herramienta: string, estado: EstadoAprender | null): Observable<unknown> {
    return this.http.put(BASE + 'aprender/' + herramienta, { estado });
  }

  /** Descarga en el servidor la descripción completa de la oferta. */
  traerTexto(id: string): Observable<{ ok: boolean; error?: string }> {
    return this.http.post<{ ok: boolean; error?: string }>(BASE + 'ofertas/' + id + '/texto/traer', {});
  }

  pegarTexto(id: string, texto: string): Observable<unknown> {
    return this.http.put(BASE + 'ofertas/' + id + '/texto', { texto });
  }

  /** Lanza el plan de estudio con IA (tarda 30-90 s; se consulta con verPlan). */
  pedirPlan(id: string): Observable<InfoPlan> {
    return this.http.post<InfoPlan>(BASE + 'ofertas/' + id + '/plan', {});
  }

  verPlan(id: string): Observable<InfoPlan> {
    return this.http.get<InfoPlan>(BASE + 'ofertas/' + id + '/plan');
  }
}
