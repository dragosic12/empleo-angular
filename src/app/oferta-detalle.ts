import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { Api } from './api';
import { ETIQUETAS, MOTIVOS, Oferta } from './models';

@Component({
  selector: 'app-oferta-detalle',
  template: `
    <div class="fondo" (click)="cerrar.emit()"></div>
    <section class="panel" role="dialog" aria-modal="true">
      <header class="panel-cab">
        <div class="min0">
          <h2>{{ oferta().title }}</h2>
          <p class="sec">{{ oferta().company }}@if (oferta().location) { · {{ oferta().location }} }</p>
        </div>
        <button class="icono-btn" type="button" (click)="cerrar.emit()" aria-label="Cerrar">
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>

      <div class="panel-cuerpo">
        <div class="chips">
          <span class="chip estado-chip estado-{{ oferta().estado }}"><span class="punto"></span>{{ etiquetas[oferta().estado] }}</span>
          @if (oferta().score !== null) { <span class="chip">Encaje <b class="importe">{{ oferta().score }}</b>/100</span> }
          @if (oferta().sueldo; as s) {
            <span class="chip" [class.chip-ok]="s.tipo === 'oferta'">
              <span class="material-symbols-outlined">payments</span>{{ s.texto }}@if (s.tipo === 'estimado') { <i>est.</i> }
            </span>
          }
        </div>
        @if (oferta().sueldo?.tipo === 'estimado') {
          <p class="aviso sec">El anuncio no publica sueldo. Estimación para {{ oferta().sueldo?.puesto }} (junior, España, bruto al año).</p>
        }
        @if (oferta().reason) { <p class="razon-det">{{ oferta().reason }}</p> }

        <h3 class="sub">Descripción</h3>
        @if (cargando()) { <p class="sec">Cargando...</p> }
        @else { <p class="descripcion">{{ texto() }}</p> }
      </div>

      <footer class="panel-pie">
        @if (descartando()) {
          <label class="sec" for="motivo">¿Por qué la descartas?</label>
          <select id="motivo" #sel [value]="oferta().motivo_sugerido ?? ''">
            <option value="">Sin motivo</option>
            @for (m of motivos; track m[0]) { <option [value]="m[0]">{{ m[1] }}</option> }
          </select>
          <div class="fila">
            <button class="btn btn-sec" type="button" (click)="descartando.set(false)">Cancelar</button>
            <button class="btn btn-prim" type="button" (click)="mover('descartada', sel.value)">Descartar</button>
          </div>
        } @else {
          <div class="fila">
            <a class="btn btn-sec" [href]="oferta().url" target="_blank" rel="noopener">
              <span class="material-symbols-outlined">open_in_new</span>Ver anuncio
            </a>
            <button class="btn btn-sec" type="button" [disabled]="guardando()" (click)="mover('interesa')">Me interesa</button>
            <button class="btn btn-prim" type="button" [disabled]="guardando()" (click)="mover('aplicada')">Aplicada</button>
            <button class="btn btn-ghost" type="button" [disabled]="guardando()" (click)="descartando.set(true)">Descartar</button>
          </div>
        }
        @if (error()) { <p class="error">{{ error() }}</p> }
      </footer>
    </section>
  `,
})
export class OfertaDetalle implements OnInit {
  private api = inject(Api);
  oferta = input.required<Oferta>();
  cerrar = output<void>();
  cambiada = output<void>();

  protected etiquetas = ETIQUETAS;
  protected motivos = Object.entries(MOTIVOS);
  protected texto = signal('');
  protected cargando = signal(true);
  protected descartando = signal(false);
  protected guardando = signal(false);
  protected error = signal('');

  ngOnInit(): void {
    this.api.oferta(this.oferta().id).subscribe({
      next: (o) => { this.texto.set(limpiar(o.description ?? '')); this.cargando.set(false); },
      error: () => { this.texto.set('No se pudo cargar la descripción.'); this.cargando.set(false); },
    });
  }

  protected mover(estado: string, motivo?: string): void {
    this.guardando.set(true);
    this.error.set('');
    this.api.cambiarEstado(this.oferta().id, estado, motivo).subscribe({
      next: () => { this.guardando.set(false); this.cambiada.emit(); },
      error: () => { this.guardando.set(false); this.error.set('No se pudo cambiar el estado.'); },
    });
  }
}

/** La descripción llega como HTML escapado dos veces: se decodifica y se quitan las etiquetas. */
function limpiar(raw: string): string {
  const el = document.createElement('textarea');
  const dec = (s: string) => { el.innerHTML = s; return el.value; };
  return dec(dec(raw)).replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}
