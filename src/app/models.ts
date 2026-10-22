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
  description?: string;
}

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
