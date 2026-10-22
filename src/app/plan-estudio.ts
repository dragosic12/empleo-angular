import { Component, DestroyRef, effect, inject, input, linkedSignal } from '@angular/core';
import { Subscription, switchMap, takeWhile, timer } from 'rxjs';
import { Api } from './api';
import { InfoPlan, hace } from './models';

/**
 * Plan de estudio con IA para una oferta. Claude tarda 30-90 s en el servidor, así que se lanza la petición
 * y se consulta cada 3 s hasta que está listo. El plan queda guardado y no se regenera solo.
 */
@Component({
  selector: 'app-plan-estudio',
  template: `
    @switch (estado().estado) {
      @case ('generando') {
        <div class="plan-caja generando">
          <span class="material-symbols-outlined girando icono-prim">progress_activity</span>
          <div>
            <p class="texto-s"><b>Claude está preparando tu plan</b></p>
            <p class="sec texto-xs">Tarda entre 30 y 90 segundos. Puedes cerrar la ficha: el plan se guarda.</p>
          </div>
        </div>
      }
      @case ('listo') {
        @if (estado().plan; as p) {
          <section class="plan">
            <div class="plan-cab">
              <span class="material-symbols-outlined icono-prim">auto_awesome</span>
              <h4>Tu plan de estudio</h4>
              <span class="sec texto-xs">{{ hace(estado().at) }}</span>
            </div>
            @if (p.resumen) { <p class="texto-s">{{ p.resumen }}</p> }
            @if (!estado().texto_completo) { <p class="sec texto-xs">Hecho solo con el resumen del anuncio.</p> }

            @if (p.huecos.length) {
              <p class="etq">Qué te falta, por importancia</p>
              <ul class="lista-limpia">
                @for (h of p.huecos; track h.herramienta) {
                  <li class="texto-s">
                    <span class="prio prio-{{ h.prioridad }}">{{ h.prioridad }}</span>
                    <b>{{ h.herramienta }}</b>: <span class="sec">{{ h.por_que }}</span>
                    @if (h.base) { <br><span class="sec texto-xs">Partes de: {{ h.base }}</span> }
                  </li>
                }
              </ul>
            }

            <p class="etq">Plan</p>
            <ol class="lista-limpia">
              @for (b of p.plan; track b.dias) {
                <li class="bloque-plan">
                  <p><span class="importe">{{ b.dias }}</span> · <b>{{ b.objetivo }}</b></p>
                  <ul>@for (t of b.tareas; track t) { <li>{{ t }}</li> }</ul>
                </li>
              }
            </ol>

            @if (p.proyecto; as pr) {
              <div class="bloque-plan">
                <p><b>Mini-proyecto: {{ pr.titulo }}</b></p>
                <p class="sec">{{ pr.descripcion }}</p>
                @if (pr.como_contarlo) {
                  <p class="separado"><b>Cuando lo termines, puedes contarlo así:</b> <span class="sec">«{{ pr.como_contarlo }}»</span></p>
                }
              </div>
            }

            @if (p.entrevista.length) {
              <details>
                <summary>Preguntas probables en la entrevista ({{ p.entrevista.length }})</summary>
                <ul class="lista-limpia separado">
                  @for (q of p.entrevista; track q.pregunta) {
                    <li class="texto-s"><b>{{ q.pregunta }}</b><br><span class="sec">{{ q.pista }}</span></li>
                  }
                </ul>
              </details>
            }
            @if (estado().error) { <p class="error">{{ estado().error }}</p> }
            <div><button type="button" class="btn btn-sec" (click)="pedir()"><span class="material-symbols-outlined">refresh</span>Rehacer el plan</button></div>
          </section>
        }
      }
      @default {
        <div class="plan-caja intro">
          <span class="material-symbols-outlined icono-prim">auto_awesome</span>
          <div class="pila min0">
            <p class="texto-s"><b>Plan de estudio con IA</b></p>
            <p class="sec texto-xs">
              Claude lee la oferta entera y tu CV y te propone qué aprender y en qué orden (1-2 semanas),
              un mini-proyecto y preguntas probables de entrevista. Tarda 30-90 s.
            </p>
            @if (!textoCompleto()) {
              <p class="aviso-texto texto-xs">Solo hay un resumen de la oferta: el plan será más fiable si antes pegas el texto completo.</p>
            }
            @if (estado().error) { <p class="error">{{ estado().error }}</p> }
            <div><button type="button" class="btn btn-prim" (click)="pedir()"><span class="material-symbols-outlined">auto_awesome</span>Preparar mi plan</button></div>
          </div>
        </div>
      }
    }
  `,
})
export class PlanEstudio {
  private api = inject(Api);
  ofertaId = input.required<string>();
  info = input.required<InfoPlan>();
  textoCompleto = input(true);

  /** Parte del plan que trae la ficha y se actualiza con la petición y las consultas. */
  protected estado = linkedSignal(() => this.info());
  protected hace = hace;
  private sondeo?: Subscription;

  constructor() {
    effect(() => { if (this.estado().estado === 'generando') this.esperar(); });
    inject(DestroyRef).onDestroy(() => this.sondeo?.unsubscribe());
  }

  protected pedir(): void {
    this.api.pedirPlan(this.ofertaId()).subscribe({
      next: (i) => this.estado.set(i),
      error: () => this.estado.update((e) => ({ ...e, error: 'No se pudo pedir el plan.' })),
    });
  }

  private esperar(): void {
    if (this.sondeo && !this.sondeo.closed) return;
    this.sondeo = timer(3000, 3000)
      .pipe(switchMap(() => this.api.verPlan(this.ofertaId())), takeWhile((i) => i.estado === 'generando', true))
      .subscribe({
        next: (i) => this.estado.set(i),
        error: () => this.estado.update((e) => ({ ...e, estado: 'ninguno', error: 'Se perdió la conexión mientras se preparaba el plan.' })),
      });
  }
}
