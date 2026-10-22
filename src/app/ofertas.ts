import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { Api, Filtro } from './api';
import { Oferta } from './models';
import { OfertaCard } from './oferta-card';
import { OfertaDetalle } from './oferta-detalle';

const ESTADOS = [
  { v: 'pendientes', t: 'Pendientes' }, { v: 'interesa', t: 'Me interesan' }, { v: 'aplicada', t: 'Aplicadas' },
  { v: 'descartada', t: 'Descartadas' }, { v: 'nueva', t: 'Nuevas' },
];

@Component({
  selector: 'app-ofertas',
  imports: [FormsModule, OfertaCard, OfertaDetalle],
  template: `
    <header class="cabecera">
      <h1>Ofertas</h1>
      <span class="sec">{{ total() }} resultados</span>
    </header>

    <div class="filtros">
      <div class="busca">
        <span class="material-symbols-outlined">search</span>
        <input type="search" placeholder="Buscar por título, empresa o lugar" [ngModel]="filtro().q" (ngModelChange)="cambiar({ q: $event })">
      </div>
      <select [ngModel]="filtro().fuente" (ngModelChange)="cambiar({ fuente: $event })" aria-label="Fuente">
        <option value="">Todas las fuentes</option>
        @for (f of fuentes(); track f) { <option [value]="f">{{ f }}</option> }
      </select>
      <select [ngModel]="filtro().orden" (ngModelChange)="cambiar({ orden: $event })" aria-label="Orden">
        <option value="score">Mejor encaje</option>
        <option value="reciente">Más recientes</option>
      </select>
    </div>

    <div class="tabs" role="tablist">
      @for (e of estados; track e.v) {
        <button type="button" role="tab" class="tab" [class.activa]="filtro().estado === e.v"
                (click)="cambiar({ estado: e.v })">{{ e.t }}</button>
      }
    </div>

    @if (error()) {
      <p class="error caja">No se pudo cargar la lista. Comprueba la conexión con el servidor.</p>
    } @else if (cargando()) {
      <div class="rejilla">@for (i of esqueleto; track i) { <div class="card esqueleto"></div> }</div>
    } @else if (!ofertas().length) {
      <p class="vacio sec">No hay ofertas con estos filtros.</p>
    } @else {
      <div class="rejilla">
        @for (o of ofertas(); track o.id) { <app-oferta-card [oferta]="o" (abrir)="abierta.set($event)" /> }
      </div>
    }

    @if (abierta(); as o) {
      <app-oferta-detalle [oferta]="o" (cerrar)="abierta.set(null)" (cambiada)="alCambiar()" />
    }
  `,
})
export class Ofertas {
  private api = inject(Api);
  private destroy = inject(DestroyRef);
  private recarga$ = new Subject<Filtro>();

  protected estados = ESTADOS;
  protected esqueleto = [1, 2, 3, 4, 5, 6];
  protected filtro = signal<Filtro>({ estado: 'pendientes', q: '', fuente: '', orden: 'score' });
  protected ofertas = signal<Oferta[]>([]);
  protected total = signal(0);
  protected fuentes = signal<string[]>([]);
  protected cargando = signal(true);
  protected error = signal(false);
  protected abierta = signal<Oferta | null>(null);

  constructor() {
    this.recarga$
      .pipe(
        debounceTime(200),
        switchMap((f) => { this.cargando.set(true); return this.api.ofertas(f); }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe({
        next: (r) => { this.ofertas.set(r.ofertas); this.total.set(r.total); this.fuentes.set(r.fuentes); this.error.set(false); this.cargando.set(false); },
        error: () => { this.error.set(true); this.cargando.set(false); },
      });
    this.recarga$.next(this.filtro());
  }

  protected cambiar(parcial: Partial<Filtro>): void {
    this.filtro.update((f) => ({ ...f, ...parcial }));
    this.recarga$.next(this.filtro());
  }

  protected alCambiar(): void {
    this.abierta.set(null);
    this.recarga$.next(this.filtro());
  }
}
