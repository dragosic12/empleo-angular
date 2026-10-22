# Empleo Angular

Panel web para seguir mi búsqueda de empleo, hecho con **Angular 20**. Es el cliente de una API propia (FastAPI) que recoge ofertas de varias fuentes (Adzuna, InfoJobs, LinkedIn, Tecnoempleo...), las puntúa contra mi CV con IA y guarda en qué punto está cada candidatura.

Funciona en producción en mi servidor casero, detrás de nginx con autenticación.

## Qué hace

- **Ofertas**: listado en tarjetas con el encaje (0-100), el estado y el sueldo. Búsqueda con debounce, filtros por estado y fuente, y orden por encaje o por fecha.
- **Sueldo**: si el anuncio publica un rango, se muestra tal cual; si no, una estimación orientativa por tipo de puesto, marcada como "est.".
- **Ficha de la oferta**: descripción completa, motivo del encaje, enlace al anuncio y cambio de estado (me interesa, aplicada o descartada con motivo).
- **Resumen**: KPIs (ofertas vistas, encaje medio, aplicadas, sin respuesta), embudo de la búsqueda y reparto por estado.
- **Tema claro y oscuro** (recuerda la elección o sigue al sistema) y diseño adaptado a móvil: barra lateral en escritorio y barra inferior en móvil.

## Tecnología

- Angular 20 con **componentes standalone** y **zoneless** (sin zone.js).
- Estado con **signals** (`signal`, `input`, `output`) y nueva sintaxis de plantillas (`@if`, `@for`).
- **Router** con rutas de carga diferida (`loadComponent`) y `HashLocation`, para no depender de reglas de fallback en el servidor.
- **HttpClient** con `withFetch()` y un **interceptor funcional** que añade la cabecera que la API exige en las escrituras.
- **RxJS** para la búsqueda: `Subject` + `debounceTime` + `switchMap` (cancela la petición anterior) y `takeUntilDestroyed`.
- TypeScript estricto y CSS propio con variables (tokens de color para los dos temas), sin librerías de componentes.

## Estructura

```
src/app/
  app.ts / app.html      Shell: barra lateral, barra inferior móvil y cambio de tema
  app.config.ts          Providers: router, HttpClient e interceptor
  app.routes.ts          Rutas con carga diferida
  api.ts                 Servicio de acceso a la API
  models.ts              Tipos (Oferta, Sueldo, Resumen) y etiquetas
  tema.ts                Servicio del tema claro/oscuro
  ofertas.ts             Página de ofertas: filtros, pestañas y rejilla
  oferta-card.ts         Tarjeta de oferta
  oferta-detalle.ts      Panel lateral con la ficha y las acciones
  resumen.ts             Página de resumen
src/styles.css           Tokens de diseño y estilos
```

## API que consume

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/ofertas?estado=&q=&fuente=&orden=` | Listado filtrado |
| GET | `/api/ofertas/{id}` | Ficha con la descripción |
| POST | `/api/ofertas/{id}/estado` | Cambiar estado (`{ estado, motivo }`) |
| GET | `/api/resumen` | KPIs y embudo |

La URL de la API se calcula respecto a la ruta de la app (`../api/`), así que el mismo build funciona colgado de cualquier subruta.

## Desarrollo

Requiere Node 22.12 o superior.

```bash
npm install
npm start          # http://localhost:4200, con proxy de /api a http://localhost:4120
npm run build      # build de producción en dist/empleo-angular/browser
```

El build de producción usa `baseHref` `/empleo/angular/` (en `angular.json`), que es donde se sirve en el servidor.
