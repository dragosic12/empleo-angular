import { Component, inject, signal } from '@angular/core';
import { Api } from './api';
import { ETIQUETAS, Resumen } from './models';

@Component({
  selector: 'app-resumen',
  template: `
    <header class="cabecera"><h1>Resumen</h1></header>
    @if (error()) {
      <p class="error caja">No se pudo cargar el resumen.</p>
    } @else if (datos(); as d) {
      <div class="kpis">
        <div class="card kpi"><span class="sec">Ofertas vistas</span><b>{{ d.kpis.total }}</b></div>
        <div class="card kpi"><span class="sec">Encaje medio</span><b>{{ d.kpis.score_medio ?? '-' }}</b></div>
        <div class="card kpi"><span class="sec">Aplicadas</span><b>{{ d.kpis.por_estado['aplicada'] || 0 }}</b></div>
        <div class="card kpi"><span class="sec">Sin respuesta</span><b>{{ d.kpis.sin_respuesta }}</b></div>
      </div>

      <section class="card bloque">
        <h2>Embudo</h2>
        @for (e of d.embudo; track e.etapa) {
          <div class="barra-fila">
            <span class="barra-et sec">{{ e.etapa }}</span>
            <div class="barra"><div class="barra-rel" [style.width.%]="porcentaje(e.n, d.embudo[0].n)"></div></div>
            <b class="barra-n">{{ e.n }}</b>
          </div>
        }
      </section>

      <section class="card bloque">
        <h2>Por estado</h2>
        <div class="chips">
          @for (p of estados(d); track p[0]) {
            <span class="chip estado-chip estado-{{ p[0] }}"><span class="punto"></span>{{ etiqueta(p[0]) }} <b>{{ p[1] }}</b></span>
          }
        </div>
      </section>
    } @else {
      <div class="kpis">@for (i of [1, 2, 3, 4]; track i) { <div class="card kpi esqueleto"></div> }</div>
    }
  `,
})
export class ResumenPage {
  protected datos = signal<Resumen | null>(null);
  protected error = signal(false);

  constructor() {
    inject(Api).resumen().subscribe({
      next: (r) => this.datos.set(r),
      error: () => this.error.set(true),
    });
  }

  protected porcentaje = (n: number, max: number) => (max ? Math.max(n ? 2 : 0, Math.round((100 * n) / max)) : 0);
  protected etiqueta = (e: string) => ETIQUETAS[e] ?? e;
  protected estados = (d: Resumen) => Object.entries(d.kpis.por_estado).filter(([, n]) => n > 0);
}
