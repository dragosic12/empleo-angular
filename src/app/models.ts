export type Estado = 'nueva' | 'interesa' | 'aplicada' | 'descartada' | 'respondida' | 'entrevista' | 'oferta' | 'rechazada';

export interface Sueldo {
  texto: string;
  tipo: 'oferta' | 'estimado';
  puesto?: string;
  min: number;
  max: number;
}

export interface Oferta {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  score: number | null;
  reason: string;
  url: string;
  estado: Estado;
  updated: string | null;
  nota: string;
  motivo: string;
  motivo_sugerido: string | null;
  exp_anios: number | null;
  exp_nivel: string;
  sueldo: Sueldo | null;
  // solo en la ficha (GET /api/ofertas/{id})
  description?: string;
  texto?: InfoTexto;
  herramientas?: { tienes: string[]; faltan: Herramienta[] };
  plan?: InfoPlan;
  carta?: InfoCarta;
}

/** Lo mínimo para abrir la ficha (desde la pestaña Aprender solo se tiene esto). */
export type OfertaRef = Pick<Oferta, 'id' | 'title' | 'company'> & Partial<Oferta>;

export interface ListaOfertas {
  total: number;
  fuentes: string[];
  ofertas: Oferta[];
}

export interface Resumen {
  kpis: {
    total: number;
    por_estado: Record<string, number>;
    tasa_aplicacion: { aplicadas: number; descartadas: number; decididas: number; tasa: number | null };
    score_medio: number | null;
    sin_respuesta: number;
  };
  embudo: { etapa: string; n: number }[];
}

// ─── Aprender: herramientas que piden las ofertas y no están en el CV ───────

export type EstadoAprender = 'aprendiendo' | 'aprendida' | 'ignorar';

export interface Herramienta {
  id: string;
  nombre: string;
  cat: string;
  que: string;
  horas: string;
  recursos: { texto: string; url: string }[];
  proyecto: string;
  estado: EstadoAprender | null;
}

export interface HerramientaRanking extends Herramienta {
  n: number;
  score_medio: number | null;
  ofertas: OfertaRef[];
}

export interface Aprender {
  alcance: 'pendientes' | 'todas';
  ofertas: number;
  con_texto_completo: number;
  faltan: HerramientaRanking[];
  tienes: { id: string; nombre: string; n: number }[];
}

/** De dónde sale la descripción analizada (muchas fuentes solo dan un resumen). */
export interface InfoTexto {
  completa: boolean;
  origen: 'web' | 'pegado' | 'tracker' | 'resumen';
  bloqueada: boolean;
  error: string | null;
  intentada: boolean;
}

export interface PlanEstudio {
  resumen: string;
  huecos: { herramienta: string; prioridad: 'alta' | 'media' | 'baja'; por_que: string; base: string }[];
  plan: { dias: string; objetivo: string; tareas: string[] }[];
  proyecto: { titulo: string; descripcion: string; como_contarlo: string } | null;
  entrevista: { pregunta: string; pista: string }[];
}

export interface InfoPlan {
  estado: 'ninguno' | 'generando' | 'listo';
  plan?: PlanEstudio;
  at?: string;
  texto_completo?: boolean;
  error?: string;
}

export type Idioma = 'es' | 'en';

/** Carta de presentación con IA: carta, asunto del correo y mensaje corto (LinkedIn o formulario). */
export interface InfoCarta {
  estado: 'ninguno' | 'generando' | 'listo';
  idioma_sugerido: Idioma;
  idioma?: Idioma;
  asunto?: string;
  carta?: string;
  mensaje?: string;
  instrucciones?: string;
  at?: string;
  editada?: boolean;
  error?: string;
}

export const ESTADOS_APRENDER: { v: EstadoAprender; texto: string; icono: string }[] = [
  { v: 'aprendiendo', texto: 'Aprendiendo', icono: 'school' },
  { v: 'aprendida', texto: 'Aprendida', icono: 'task_alt' },
  { v: 'ignorar', texto: 'No me interesa', icono: 'visibility_off' },
];

/** "hace 5 min", "hace 3 h", "hace 2 d". */
export function hace(iso?: string | null): string {
  if (!iso) return '';
  const min = (Date.now() - new Date(iso).getTime()) / 60000;
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${Math.round(min)} min`;
  if (min < 1440) return `hace ${Math.round(min / 60)} h`;
  return `hace ${Math.round(min / 1440)} d`;
}

export const MOTIVOS: Record<string, string> = {
  experiencia: 'Pide más experiencia o es senior',
  sin_encaje: 'No encaja conmigo',
  tecnologia: 'Tecnologías que no domino',
  idioma: 'Idioma',
  no_remoto: 'No es remoto',
  sueldo: 'Sueldo',
  empresa: 'Empresa',
  proceso: 'Proceso pesado',
  ya_aplicada: 'Ya aplicada',
  otro: 'Otro',
};

export const ETIQUETAS: Record<string, string> = {
  nueva: 'Nueva', interesa: 'Me interesa', aplicada: 'Aplicada', descartada: 'Descartada',
  respondida: 'Respondida', entrevista: 'Entrevista', oferta: 'Oferta', rechazada: 'Rechazada',
};
