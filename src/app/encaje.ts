import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Api } from './api';
import { HerramientaInfo } from './herramienta-info';
import { InfoTexto, Oferta } from './models';
import { PlanEstudio } from './plan-estudio';

const TEXTO_OK: InfoTexto = { completa: true, origen: 'tracker', bloqueada: false, error: null, intentada: false };

/** "Para encajar mejor": lo que pide la oferta que ya está en el CV, lo que falta y el plan de estudio. */
@Component({
  selector: 'app-encaje',
  imports: [HerramientaInfo, PlanEstudio],
  template: `
    <h3 class="sub">Para encajar mejor</h3>

    @if (!texto().completa) {
      <div class="aviso-caja">
        @if (texto().bloqueada) {
          <p>{{ oferta().source }} no deja descargar la oferta, así que solo se ha mirado el resumen.</p>
        } @else if (texto().error) {
          <p>No se pudo traer la descripción completa ({{ texto().error }}), así que solo se ha mirado el resumen.</p>
        } @else {
          <p class="con-icono"><span class="material-symbols-outlined girando">progress_activity</span>Descargando la descripción completa...</p>
        }
        @if (texto().bloqueada || texto().error) {
          @if (pegando()) {
            <textarea #txt rows="6" maxlength="30000" placeholder="Abre la oferta, copia toda la descripción y pégala aquí"></textarea>
            <button type="button" class="btn btn-prim" [disabled]="guardando()" (click)="pegar(txt.value)">Analizar este texto</button>
          } @else {
            <button type="button" class="btn btn-sec" (click)="pegando.set(true)">
              <span class="material-symbols-outlined">content_paste</span>Pegar el texto de la oferta
            </button>
          }
          @if (error()) { <p class="error">{{ error() }}</p> }
        }
      </div>
    }

    @if (h().tienes.length) {
      <div class="chips">
        <span class="etq">Ya tienes:</span>
        @for (n of h().tienes; track n) { <span class="chip chip-ok">{{ n }}</span> }
      </div>
    }
    @if (h().faltan.length) {
      <p class="etq">Te falta{{ h().faltan.length > 1 ? 'n' : '' }} ({{ h().faltan.length }}):</p>
      @for (x of h().faltan; track x.id) {
        <div class="herr estado-ap-{{ x.estado || 'ninguno' }}">
          <div class="herr-cab"><b>{{ x.nombre }}</b><span class="sec texto-xs">{{ x.cat }}</span></div>
          <app-herramienta-info [h]="x" (cambiada)="recargar.emit()" />
        </div>
      }
    } @else {
      <p class="sec texto-s">
        {{ h().tienes.length ? 'Tienes en el CV todo lo que se detecta en esta oferta.' : 'No se ha detectado ninguna herramienta concreta en el texto.' }}
      </p>
    }

    <app-plan-estudio [ofertaId]="oferta().id" [info]="oferta().plan ?? { estado: 'ninguno' }" [textoCompleto]="texto().completa" />
  `,
  host: { class: 'pila' },
})
export class Encaje {
  private api = inject(Api);
  /** La ficha completa (GET /api/ofertas/{id}). */
  oferta = input.required<Oferta>();
  recargar = output<void>();

  protected texto = computed(() => this.oferta().texto ?? TEXTO_OK);
  protected h = computed(() => this.oferta().herramientas ?? { tienes: [], faltan: [] });
  protected pegando = signal(false);
  protected guardando = signal(false);
  protected error = signal('');

  protected pegar(texto: string): void {
    if (texto.trim().length < 80) {
      this.error.set('Pega la descripción completa (al menos unas líneas).');
      return;
    }
    this.guardando.set(true);
    this.error.set('');
    this.api.pegarTexto(this.oferta().id, texto.trim()).subscribe({
      next: () => { this.guardando.set(false); this.pegando.set(false); this.recargar.emit(); },
      error: () => { this.guardando.set(false); this.error.set('No se pudo guardar el texto.'); },
    });
  }
}
