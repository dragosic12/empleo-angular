import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { Api } from './api';
import { Carta } from './carta';
import { Encaje } from './encaje';
import { ETIQUETAS, MOTIVOS, Oferta, OfertaRef } from './models';

@Component({
  selector: 'app-oferta-detalle',
  imports: [Carta, Encaje],
  template: `
    <div class="fondo" (click)="cerrar.emit()"></div>
    <section class="panel" role="dialog" aria-modal="true" [attr.aria-label]="o().title">
      <header class="panel-cab">
        <div class="min0">
          <h2>{{ o().title }}</h2>
          <p class="sec">{{ o().company }}@if (o().location) { · {{ o().location }} }</p>
        </div>
        <button class="icono-btn" type="button" (click)="cerrar.emit()" aria-label="Cerrar">
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>

      <div class="panel-cuerpo">
        <div class="chips">
          @if (o().estado; as e) { <span class="chip estado-chip estado-{{ e }}"><span class="punto"></span>{{ etiquetas[e] }}</span> }
          @if (o().score != null) { <span class="chip">Encaje <b class="importe">{{ o().score }}</b>/100</span> }
          @if (o().sueldo; as s) {
            <span class="chip" [class.chip-ok]="s.tipo === 'oferta'">
              <span class="material-symbols-outlined">payments</span>{{ s.texto }}@if (s.tipo === 'estimado') { <i>est.</i> }
            </span>
          }
        </div>
        @if (o().sueldo?.tipo === 'estimado') {
          <p class="aviso sec">El anuncio no publica sueldo. Estimación para {{ o().sueldo?.puesto }} (junior, España, bruto al año).</p>
        }
        @if (o().reason) { <p class="razon-det">{{ o().reason }}</p> }

        @if (detalle(); as d) {
          <h3 class="sub">Carta de presentación</h3>
          <app-carta [ofertaId]="d.id" [info]="d.carta ?? { estado: 'ninguno', idioma_sugerido: 'es' }" [textoCompleto]="d.texto?.completa ?? true" />
          <app-encaje [oferta]="d" (recargar)="cargar()" />
        }

        <h3 class="sub">Descripción</h3>
        @if (errorCarga()) { <p class="error">No se pudo cargar la oferta.</p> }
        @else if (!detalle()) { <p class="sec">Cargando...</p> }
        @else { <p class="descripcion">{{ texto() }}</p> }
      </div>

      <footer class="panel-pie">
        @if (descartando()) {
          <label class="sec" for="motivo">¿Por qué la descartas?</label>
          <select id="motivo" #sel [value]="o().motivo_sugerido ?? ''">
            <option value="">Sin motivo</option>
            @for (m of motivos; track m[0]) { <option [value]="m[0]">{{ m[1] }}</option> }
          </select>
          <div class="fila">
            <button class="btn btn-sec" type="button" (click)="descartando.set(false)">Cancelar</button>
            <button class="btn btn-prim" type="button" (click)="mover('descartada', sel.value)">Descartar</button>
          </div>
        } @else {
          <div class="fila">
            @if (o().url) {
              <a class="btn btn-sec" [href]="o().url" target="_blank" rel="noopener">
                <span class="material-symbols-outlined">open_in_new</span>Ver anuncio
              </a>
            }
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
  oferta = input.required<OfertaRef>();
  cerrar = output<void>();
  cambiada = output<void>();

  protected etiquetas = ETIQUETAS;
  protected motivos = Object.entries(MOTIVOS);
  /** Ficha completa del servidor; mientras llega se pinta lo que trae la lista. */
  protected detalle = signal<Oferta | null>(null);
  protected o = computed<OfertaRef>(() => this.detalle() ?? this.oferta());
  protected texto = computed(() => limpiar(this.detalle()?.description ?? ''));
  protected errorCarga = signal(false);
  protected descartando = signal(false);
  protected guardando = signal(false);
  protected error = signal('');
  private textoPedido = false;

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.api.oferta(this.oferta().id).subscribe({
      next: (o) => { this.detalle.set(o); this.errorCarga.set(false); this.traerTextoSiFalta(o); },
      error: () => this.errorCarga.set(true),
    });
  }

  /** La primera vez que se abre una oferta que solo tiene resumen, el servidor descarga la descripción completa. */
  private traerTextoSiFalta(o: Oferta): void {
    const t = o.texto;
    if (!t || t.completa || t.intentada || t.bloqueada || this.textoPedido) return;
    this.textoPedido = true;
    this.api.traerTexto(o.id).subscribe({ next: () => this.cargar(), error: () => this.cargar() });
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

/** La descripción puede llegar como HTML escapado dos veces: se decodifica y se quitan las etiquetas. */
function limpiar(raw: string): string {
  const el = document.createElement('textarea');
  const dec = (s: string) => { el.innerHTML = s; return el.value; };
  return dec(dec(raw)).replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}
