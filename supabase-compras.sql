-- Tabela de pedidos de compra
CREATE TABLE IF NOT EXISTS compras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL,
  status VARCHAR(20) NOT NULL DEFAULT 'pedido',
  fornecedor TEXT,
  nota_fornecedor TEXT,
  observacoes TEXT,
  itens JSONB NOT NULL DEFAULT '[]',
  data_pedido TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_entrega TIMESTAMPTZ,
  data_pagamento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados podem fazer tudo
CREATE POLICY "Acesso total para autenticados" ON compras
  FOR ALL USING (true) WITH CHECK (true);
