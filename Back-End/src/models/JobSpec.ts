export type JobSpec = {
  escolaridade:
    | 'fundamental'
    | 'medio'
    | 'tecnologo'
    | 'superior'
    | 'pos'
    | 'mestrado'
    | 'doutorado'
    | 'indiferente';
  conhecimentosObrigatorios: string[];
  conhecimentosDesejados?: string[];
  tempoExperienciaMinAnos?: number; // mínimo de anos totais
  observacoes?: string;
  cargo?: string; // título da vaga (opcional)
};
