import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Subject, merge, map, switchMap, tap } from 'rxjs';
import { Api } from './api';
import { HerramientaInfo } from './herramienta-info';
import { Aprender, EstadoAprender, HerramientaRanking, OfertaRef } from './models';
import { OfertaDetalle } from './oferta-detalle';

type Filtro = '' | EstadoAprender;

const FILTROS: { v: Filtro; t: string }[] = [
  { v: '', t: 'Por aprender' }, { v: 'aprendiendo', t: 'Aprendiendo' }, { v: 'aprendida', t: 'Aprendidas' }, { v: 'ignorar', t: 'Ocultas' },
];
const VACIO: Record<Filtro, string> = {
  '': 'Tienes en el CV todo lo que se detecta en estas ofertas.',
  aprendiendo: 'No estás aprendiendo nada todavía. Marca "Aprendiendo" en una herramienta para seguirla aquí.',
  aprendida: 'Aún no has marcado ninguna como aprendida.',
  ignorar: 'No has ocultado ninguna herramienta.',
};

@Component({
  selector: 'app-aprender',
  imports: [HerramientaInfo, OfertaDetalle],
  template: `
    <header class="cabecera"><h1>Aprender</h1></header>

    <section class="card bloque estatica">
      <h2 class="titulo-s">Qué aprender para encajar mejor</h2>
      <p class="sec texto-s">
        Herramientas que piden {{ alcance() === 'pendientes' ? 'tus ofertas pendientes' : 'todas tus ofertas' }} y no aparecen en tu CV,
        de la más pedida a la menos, con dónde aprenderlas, unas horas orientativas y un mini-proyecto para poder ponerlas en el CV.
      </p>
      @if (datos(); as d) {
        <p class="sec texto-xs">
          {{ d.ofertas }} ofertas analizadas
          @if (d.ofertas - d.con_texto_completo > 0) {
            · {{ d.ofertas - d.con_texto_completo }} solo con el resumen del anuncio (la descripción completa se va descargando sola, o puedes pegarla en la ficha).
          }
        </p>
      }
    </section>

    <div class="tabs" role="tablist" aria-label="Ofertas analizadas">
      <button type="button" role="tab" class="tab" [class.activa]="alcance() === 'pendientes'" (click)="alcance.set('pendientes')">Ofertas pendientes</button>
      <button type="button" role="tab" class="tab" [class.activa]="alcance() === 'todas'" (click)="alcance.set('todas')">Todas las ofertas</button>
    </div>
    <div class="tabs" role="tablist" aria-label="Estado">
      @for (f of filtros; track f.v) {
        <button type="button" role="tab" class="tab" [class.activa]="filtro() === f.v" (click)="filtro.set(f.v)">{{ f.t }} <span class="num">{{ cuenta(f.v) }}</span></button>
      }
    </div>

    @if (error()) {
      <p class="error caja">No se pudo cargar. Comprueba la conexión con el servidor.</p>
    } @else if (!datos()) {
      <div class="rejilla">@for (i of [1, 2, 3, 4]; track i) { <div class="card esqueleto"></div> }</div>
    } @else if (!lista().length) {
      <p class="vacio sec">{{ vacio[filtro()] }}</p>
    } @else {
      <div class="rejilla">
        @for (h of lista(); track h.id) {
          <article class="card estatica estado-ap-{{ h.estado || 'ninguno' }}">
            <div class="card-cabecera">
              <div class="min0"><h3>{{ h.nombre }}</h3><p class="sec texto-xs">{{ h.cat }}</p></div>
              <div class="score"><b>{{ h.n }}</b><small> {{ h.n === 1 ? 'oferta' : 'ofertas' }}</small></div>
            </div>
            <app-herramienta-info [h]="h" (cambiada)="cambiada(h, $event)" />
            @if (h.ofertas.length) {
              <details>
                <summary>Ofertas que la piden@if (h.score_medio != null) { · encaje medio {{ h.score_medio }} }</summary>
                <div class="lista-ofertas">
                  @for (o of h.ofertas; track o.id) {
                    <button type="button" (click)="abierta.set(o)">
                      <span class="truncar"><b>{{ o.title }}</b> <span class="sec">{{ o.company }}</span></span>
                      @if (o.score != null) { <span class="importe">{{ o.score }}</span> }
                    </button>
                  }
                </div>
              </details>
            }
          </article>
        }
      </div>
      @if (filtro() === '' && datos()?.tienes?.length) {
        <section class="card estatica separado">
          <h2 class="titulo-s">Lo que piden y ya tienes</h2>
          <p class="sec texto-xs">Destácalo en el CV y en las entrevistas: es lo que más se repite.</p>
          <div class="chips">
            @for (t of datos()!.tienes; track t.id) {
              <span class="chip chip-ok" [title]="'La piden ' + t.n + (t.n === 1 ? ' oferta' : ' ofertas')">
                <span class="material-symbols-outlined">check</span>{{ t.nombre }} <span class="num">{{ t.n }}</span>
              </span>
            }
          </div>
        </section>
      }
    }

    @if (abierta(); as o) {
      <app-oferta-detalle [oferta]="o" (cerrar)="cerrarFicha()" (cambiada)="cerrarFicha()" />
    }
  `,
})
export class AprenderPage {
  private api = inject(Api);
  private recarga$ = new Subject<void>();

  protected filtros = FILTROS;
  protected vacio = VACIO;
  protected alcance = signal<'pendientes' | 'todas'>('pendientes');
  protected filtro = signal<Filtro>('');
  protected datos = signal<Aprender | null>(null);
  protected error = signal(false);
  protected abierta = signal<OfertaRef | null>(null);

  protected lista = computed(() => this.filtrar(this.filtro()));

  constructor() {
    merge(toObservable(this.alcance), this.recarga$.pipe(map(() => this.alcance())))
      .pipe(
        tap(() => this.error.set(false)),
        switchMap((a) => this.api.aprender(a)),
        takeUntilDestroyed(),
      )
      .subscribe({ next: (d) => this.datos.set(d), error: () => this.error.set(true) });
  }

  private filtrar(f: Filtro): HerramientaRanking[] {
    const d = this.datos();
    if (!d) return [];
    return d.faltan.filter((h) => (f ? h.estado === f : h.n > 0 && h.estado !== 'ignorar'));
  }

  protected cuenta = (f: Filtro) => this.filtrar(f).length;

  /** El cambio ya está guardado: se refleja aquí sin recargar la lista. */
  protected cambiada(h: HerramientaRanking, estado: EstadoAprender | null): void {
    this.datos.update((d) => d && { ...d, faltan: d.faltan.map((x) => (x.id === h.id ? { ...x, estado } : x)) });
  }

  /** Al cerrar la ficha se recarga, por si se cambió el estado de la oferta o se marcó alguna herramienta. */
  protected cerrarFicha(): void {
    this.abierta.set(null);
    this.recarga$.next();
  }
}
