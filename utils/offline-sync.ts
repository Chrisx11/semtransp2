// Utilitário para sincronização offline/online de dados pendentes
// Salva dados no localStorage sob chaves distintas

// Incluir tipos para Ordens de Serviço e Atualização de KM

export type OrdemServicoPendente = {
  tipo: 'ordem-servico',
  data: any // usar o mesmo tipo do payload usado no Supabase
}

export type AtualizacaoKmPendente = {
  tipo: 'atualizacao-km',
  data: any // incluir ID do veículo e novo KM
}

type Pendencia = OrdemServicoPendente | AtualizacaoKmPendente;

const STORAGE_KEY = 'pendencias_offline';

export function addPending(pendencia: Pendencia) {
  const pendentes = getPendings();
  pendentes.push(pendencia);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pendentes));
}

export function getPendings(): Pendencia[] {
  const v = localStorage.getItem(STORAGE_KEY);
  if (!v) return [];
  try {
    return JSON.parse(v) as Pendencia[];
  } catch {
    return [];
  }
}

export function clearPendings() {
  localStorage.removeItem(STORAGE_KEY);
}

// Função principal de sincronização (deve ser chamada quando ficar online)
export async function syncPendings(supabaseHandlers: {
  ordemServico: (payload: any) => Promise<any>,
  atualizarKm: (payload: any) => Promise<any>,
}) {
  const pendentes = getPendings();
  for(const item of pendentes) {
    try {
      if(item.tipo === 'ordem-servico') {
        await supabaseHandlers.ordemServico(item.data);
      } else if(item.tipo === 'atualizacao-km') {
        await supabaseHandlers.atualizarKm(item.data);
      }
    } catch {
      // Alguma falha, para sincronização e mantém pendente
      return false;
    }
  }
  clearPendings();
  return true;
}
