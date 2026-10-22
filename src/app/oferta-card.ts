import { Component, input, output } from '@angular/core';
import { ETIQUETAS, Oferta } from './models';

@Component({
  selector: 'app-oferta-card',
  template: `
    <article class="card estado-{{ oferta().estado }}" tabindex="0" role="button"
             (click)="abrir.emit(oferta())" (keydown.enter)="abrir.emit(oferta())">
      <div class="card-cabecera">
        <div class="min0">
          <h3>{{ oferta().title }}</h3>
          <p class="sec truncar">{{ oferta().company }}@if (oferta().location) { · {{ oferta().location }} }</p>
        </div>
        @if (oferta().score !== null) {
          <div class="score"><b>{{ oferta().score }}</b><small>/100</small></div>
        }
      </div>
      <div class="chips">
        <span class="chip estado-chip estado-{{ oferta().estado }}"><span class="punto"></span>{{ etiqueta(oferta().estado) }}</span>
        @if (oferta().sueldo; as s) {
          <span class="chip" [class.chip-ok]="s.tipo === 'oferta'"
                [title]="s.tipo === 'estimado' ? 'Estimación orientativa, el anuncio no publica sueldo' : 'Sueldo publicado en el anuncio'">
            <span class="material-symbols-outlined">payments</span>{{ s.texto }}@if (s.tipo === 'estimado') { <i>est.</i> }
          </span>
        }
        <span class="chip chip-suave">{{ oferta().source }}</span>
      </div>
      @if (oferta().reason) { <p class="razon sec">{{ oferta().reason }}</p> }
    </article>
  `,
})
export class OfertaCard {
  oferta = input.required<Oferta>();
  abrir = output<Oferta>();
  protected etiqueta = (e: string) => ETIQUETAS[e] ?? e;
}
