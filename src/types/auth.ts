export type PerfilUsuarioEnum =
  | 'SOLICITANTE'
  | 'PATRIMONIO'
  | 'ORIGEM'
  | 'DESTINO'
  | 'LOGISTICA';

export interface UserSession {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  perfil: PerfilUsuarioEnum;
  unidadeId: string;
  unidadeNome?: string;
  unidadeSigla?: string | null;
}
