import { Component, inject, input, output, signal } from '@angular/core';
import { Api } from './api';
import { ESTADOS_APRENDER, EstadoAprender, Herramienta } from './models';

/** Qué es una herramienta, cómo aprenderla y los botones aprendiendo / aprendida / no me interesa. */
@Component({
  selector: 'app-herramienta-info',
  template: `
    @if (h().que) { <p class="sec texto-s">{{ h().que }}</p> }
    <div class="herr-meta">
      @if (h().horas) {
        <span class="meta"><span class="material-symbols-outlined">schedule</span>{{ h().horas }} para lo básico</span>
      }
      @for (r of h().recursos; track r.url) {
        <a class="enlace" [href]="r.url" target="_blank" rel="noopener noreferrer">
          <span class="material-symbols-outlined">open_in_new</span>{{ r.texto }}
        </a>
      }
    </div>
    @if (h().proyecto) {
      <div class="caja-suave texto-s"><b>Mini-proyecto para el CV:</b> {{ h().proyecto }}</div>
    }
    @if (h().estado === 'aprendida') {
      <p class="sec texto-xs">
        Cuando tengas el mini-proyecto, añádelo al CV en <a class="enlace" href="/cv/">Datos base</a>:
        entonces pasará a "ya lo tienes" y el bot lo tendrá en cuenta al puntuar.
      </p>
    }
    <div class="fila">
      @for (e of estados; track e.v) {
        <button type="button" class="chip-btn" [class.activa]="h().estado === e.v" [attr.aria-pressed]="h().estado === e.v"
                [disabled]="guardando()" (click)="marcar(e.v)">
          <span class="material-symbols-outlined">{{ e.icono }}</span>{{ e.texto }}
        </button>
      }
    </div>
    @if (error()) { <p class="error">{{ error() }}</p> }
  `,
  host: { class: 'pila' },
})
export class HerramientaInfo {
  private api = inject(Api);
  h = input.required<Herramienta>();
  cambiada = output<EstadoAprender | null>();

  protected estados = ESTADOS_APRENDER;
  protected guardando = signal(false);
  protected error = signal('');

  /** Pulsar el estado que ya tiene lo quita. */
  protected marcar(e: EstadoAprender): void {
    const nuevo = this.h().estado === e ? null : e;
    this.guardando.set(true);
    this.error.set('');
    this.api.marcarAprender(this.h().id, nuevo).subscribe({
      next: () => { this.guardando.set(false); this.cambiada.emit(nuevo); },
      error: () => { this.guardando.set(false); this.error.set('No se pudo guardar.'); },
    });
  }
}
