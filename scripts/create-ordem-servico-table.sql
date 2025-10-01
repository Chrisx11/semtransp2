-- Criar a tabela ordens_servico caso não exista
CREATE TABLE IF NOT EXISTS ordens_servico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero TEXT NOT NULL,
  data TIMESTAMP WITH TIME ZONE DEFAULT now(),
  veiculoId UUID,
  veiculoInfo TEXT,
  solicitanteId UUID,
  solicitanteInfo TEXT,
  mecanicoId UUID,
  mecanicoInfo TEXT,
  prioridade TEXT,
  status TEXT,
  kmAtual TEXT,
  defeitosRelatados TEXT,
  pecasServicos TEXT,
  observacoesAlmoxarifado TEXT,
  observacoesCompras TEXT,
  observacoesRetorno TEXT,
  historico JSONB DEFAULT '[]'::jsonb,
  ordem_execucao INT DEFAULT 999,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_mecanicoId ON ordens_servico(mecanicoId);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_ordem_execucao ON ordens_servico(ordem_execucao);

-- Comentários explicativos
COMMENT ON COLUMN ordens_servico.id IS 'ID único da ordem de serviço';
COMMENT ON COLUMN ordens_servico.numero IS 'Número de identificação da OS (ex: OS-23001)';
COMMENT ON COLUMN ordens_servico.data IS 'Data de criação da ordem';
COMMENT ON COLUMN ordens_servico.veiculoId IS 'ID do veículo relacionado';
COMMENT ON COLUMN ordens_servico.veiculoInfo IS 'Informações do veículo (placa, modelo)';
COMMENT ON COLUMN ordens_servico.solicitanteId IS 'ID do colaborador solicitante';
COMMENT ON COLUMN ordens_servico.solicitanteInfo IS 'Nome do solicitante';
COMMENT ON COLUMN ordens_servico.mecanicoId IS 'ID do mecânico responsável';
COMMENT ON COLUMN ordens_servico.mecanicoInfo IS 'Nome do mecânico';
COMMENT ON COLUMN ordens_servico.prioridade IS 'Prioridade da OS (Alta, Média, Baixa)';
COMMENT ON COLUMN ordens_servico.status IS 'Status atual da OS (Nova, Em Análise, Fila de Serviço, etc.)';
COMMENT ON COLUMN ordens_servico.kmAtual IS 'Quilometragem atual do veículo';
COMMENT ON COLUMN ordens_servico.defeitosRelatados IS 'Descrição dos defeitos relatados';
COMMENT ON COLUMN ordens_servico.pecasServicos IS 'Peças e serviços necessários';
COMMENT ON COLUMN ordens_servico.observacoesAlmoxarifado IS 'Observações do almoxarifado';
COMMENT ON COLUMN ordens_servico.observacoesCompras IS 'Observações de compras';
COMMENT ON COLUMN ordens_servico.observacoesRetorno IS 'Observações de retorno para oficina';
COMMENT ON COLUMN ordens_servico.historico IS 'Histórico de eventos da OS (formato JSON)';
COMMENT ON COLUMN ordens_servico.ordem_execucao IS 'Ordem de execução para planejamento';
COMMENT ON COLUMN ordens_servico.createdAt IS 'Data de criação do registro';
COMMENT ON COLUMN ordens_servico.updatedAt IS 'Data da última atualização'; 