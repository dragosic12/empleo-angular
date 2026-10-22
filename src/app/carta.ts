import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, ElementRef, computed, effect, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Api } from './api';
import { Idioma, InfoCarta, hace } from './models';

/**
 * Carta de presentación con IA: carta, asunto y mensaje corto, editables y con botón de copiar.
 * Se genera en el servidor (20-60 s) y se consulta hasta que está, como el plan de estudio.
 */
@Component({
  selector: 'app-carta',
  template: `
    @switch (estado().estado) {
      @case ('generando') {
        <div class="plan-caja generando">
          <span class="material-symbols-outlined girando icono-prim">progress_activity</span>
          <div>
            <p class="texto-s"><b>Claude está escribiendo tu carta</b></p>
            <p class="sec texto-xs">Tarda entre 20 y 60 segundos. Puedes cerrar la ficha: la carta se guarda.</p>
          </div>
        </div>
      }
      @case ('listo') {
        <div class="pila">
          <div class="fila centrada">
            <button type="button" class="chip-btn" [class.activa]="pestana() === 'carta'" [attr.aria-pressed]="pestana() === 'carta'" (click)="pestana.set('carta')">Carta</button>
            <button type="button" class="chip-btn" [class.activa]="pestana() === 'mensaje'" [attr.aria-pressed]="pestana() === 'mensaje'" (click)="pestana.set('mensaje')">Mensaje corto</button>
            <span class="sec texto-xs empuja">{{ estado().idioma === 'en' ? 'Inglés' : 'Español' }} · {{ hace(estado().at) }}@if (estado().editada) { · editada }</span>
          </div>
          <label class="sec texto-xs" for="asunto">Asunto del correo</label>
          <input id="asunto" class="campo" [value]="asunto()" (input)="editar('asunto', $event)">
          <textarea #area [rows]="pestana() === 'carta' ? 16 : 7" [value]="pestana() === 'carta' ? carta() : mensaje()"
                    (input)="editar(pestana(), $event)" [attr.aria-label]="pestana() === 'carta' ? 'Carta' : 'Mensaje corto'"></textarea>
          <div class="fila">
            <button type="button" class="btn btn-prim" (click)="copiar()"><span class="material-symbols-outlined">content_copy</span>Copiar</button>
            @if (sucio()) {
              <button type="button" class="btn btn-sec" [disabled]="guardando()" (click)="guardar()"><span class="material-symbols-outlined">save</span>Guardar cambios</button>
            }
          </div>
          @if (aviso()) { <p class="sec texto-s">{{ aviso() }}</p> }
          @if (estado().error) { <p class="error">{{ estado().error }}</p> }
          <details>
            <summary>Rehacer con otro idioma o indicaciones</summary>
            <ng-container *ngTemplateOutlet="opciones; context: { $implicit: 'Rehacer la carta' }" />
          </details>
        </div>
      }
      @default {
        <div class="pila">
          <p class="sec texto-s">
            Claude la escribe con tu CV y el texto de la oferta, solo con hechos reales. Te da la carta, el asunto del correo
            y un mensaje corto para LinkedIn o el formulario. Tarda 20-60 s.
          </p>
          @if (!textoCompleto()) {
            <p class="aviso-texto texto-xs">Solo hay un resumen de la oferta: la carta saldrá más ajustada si antes pegas el texto completo.</p>
          }
          @if (estado().error) { <p class="error">{{ estado().error }}</p> }
          <ng-container *ngTemplateOutlet="opciones; context: { $implicit: 'Escribir carta' }" />
        </div>
      }
    }

    <ng-template #opciones let-boton>
      <div class="fila separado-s">
        <select aria-label="Idioma de la carta" [value]="idioma()" (change)="idioma.set($any($event.target).value)">
          <option value="es">Español</option>
          <option value="en">Inglés</option>
        </select>
        <input class="campo crece" maxlength="300" placeholder="Indicaciones opcionales (p. ej.: puedo incorporarme ya)"
               [value]="instrucciones()" (input)="instrucciones.set($any($event.target).value)">
      </div>
      <div class="separado-s"><button type="button" class="btn btn-prim" (click)="pedir()"><span class="material-symbols-outlined">edit_note</span>{{ boton }}</button></div>
    </ng-template>
  `,
  imports: [NgTemplateOutlet],
})
export class Carta {
  private api = inject(Api);
  ofertaId = input.required<string>();
  info = input.required<InfoCarta>();
  textoCompleto = input(true);

  protected estado = linkedSignal(() => this.info());
  protected hace = hace;
  protected pestana = signal<'carta' | 'mensaje'>('carta');
  // Los borradores solo se reinician cuando llega otra carta (cambia la fecha), no cada vez que se recarga la ficha:
  // así marcar una herramienta o terminar el plan no borra lo que estés retocando. La fuente es un computed con
  // igualdad por fecha porque un linkedSignal recalcula con cualquier cambio de lo que lee su función source.
  private guardada = computed(
    () => {
      const e = this.estado();
      return { at: e.at, asunto: e.asunto ?? '', carta: e.carta ?? '', mensaje: e.mensaje ?? '',
               idioma: e.idioma ?? e.idioma_sugerido, instrucciones: e.instrucciones ?? '' };
    },
    { equal: (a, b) => a.at === b.at },
  );
  protected idioma = linkedSignal<{ idioma: Idioma }, Idioma>({ source: this.guardada, computation: (g) => g.idioma });
  protected instrucciones = linkedSignal({ source: this.guardada, computation: (g) => g.instrucciones });
  protected asunto = linkedSignal({ source: this.guardada, computation: (g) => g.asunto });
  protected carta = linkedSignal({ source: this.guardada, computation: (g) => g.carta });
  protected mensaje = linkedSignal({ source: this.guardada, computation: (g) => g.mensaje });
  protected sucio = linkedSignal({ source: this.guardada, computation: () => false });
  protected guardando = signal(false);
  protected aviso = signal('');
  private area = viewChild<ElementRef<HTMLTextAreaElement>>('area');
  private sondeo?: Subscription;

  constructor() {
    effect(() => { if (this.estado().estado === 'generando') this.esperar(); });
    inject(DestroyRef).onDestroy(() => this.sondeo?.unsubscribe());
  }

  protected editar(campo: 'asunto' | 'carta' | 'mensaje', ev: Event): void {
    this[campo].set((ev.target as HTMLInputElement).value);
    this.sucio.set(true);
    this.aviso.set('');
  }

  protected pedir(): void {
    this.api.pedirCarta(this.ofertaId(), this.idioma(), this.instrucciones().trim()).subscribe({
      next: (c) => this.estado.set(c),
      error: () => this.estado.update((e) => ({ ...e, error: 'No se pudo pedir la carta.' })),
    });
  }

  protected guardar(): void {
    this.guardando.set(true);
    this.api.guardarCarta(this.ofertaId(), { asunto: this.asunto(), carta: this.carta(), mensaje: this.mensaje() }).subscribe({
      next: () => { this.guardando.set(false); this.sucio.set(false); this.aviso.set('Cambios guardados.'); },
      error: () => { this.guardando.set(false); this.aviso.set('No se pudieron guardar los cambios.'); },
    });
  }

  /** El portapapeles moderno solo funciona con https; en http se copia seleccionando el texto. */
  protected async copiar(): Promise<void> {
    const el = this.area()?.nativeElement;
    if (!el) return;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(el.value); ok = true; }
    } catch { /* se intenta abajo */ }
    if (!ok) {
      el.focus(); el.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      el.setSelectionRange(0, 0);
    }
    this.aviso.set(ok ? (this.pestana() === 'carta' ? 'Carta copiada.' : 'Mensaje copiado.') : 'No se pudo copiar: selecciona el texto y cópialo a mano.');
  }

  private esperar(): void {
    if (this.sondeo && !this.sondeo.closed) return;
    this.sondeo = this.api.esperar(() => this.api.verCarta(this.ofertaId())).subscribe({
      next: (c) => this.estado.set(c),
      error: () => this.estado.update((e) => ({ ...e, estado: 'ninguno', error: 'Se perdió la conexión mientras se escribía la carta.' })),
    });
  }
}
