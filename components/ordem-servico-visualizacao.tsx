"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Printer,
  FileEdit,
  Clock,
  Car,
  User,
  Wrench,
  AlertTriangle,
  PenToolIcon as Tools,
  History,
} from "lucide-react"
import type { OrdemServico } from "@/services/ordem-servico-service"
import { Timeline } from "@/components/timeline"
import { pdf } from '@react-pdf/renderer';
import { OrdemServicoPDF } from './OrdemServicoPDF';
import { getVeiculoByIdSupabase } from "@/services/veiculo-service"

// Componente para exibir a prioridade com a cor apropriada
const PrioridadeBadge = ({ prioridade }: { prioridade: string }) => {
  let badgeClasses = ""
  switch (prioridade) {
    case "Baixa":
      badgeClasses = "bg-[#3B82F6] text-white hover:bg-[#2563EB]" // Azul
      break
    case "Média":
      badgeClasses = "bg-[#FACC15] text-black hover:bg-[#EAB308]" // Amarelo
      break
    case "Alta":
      badgeClasses = "bg-[#F97316] text-white hover:bg-[#EA580C]" // Laranja
      break
    case "Urgente":
      badgeClasses = "bg-[#EF4444] text-white hover:bg-[#DC2626]" // Vermelho
      break
    default:
      badgeClasses = "bg-gray-500 text-white hover:bg-gray-500/80" // Cinza
  }
  return <Badge className={badgeClasses}>{prioridade}</Badge>
}

// Componente para exibir o status com a cor apropriada
const StatusBadge = ({ status }: { status: string }) => {
  let variant: "default" | "outline" | "secondary" | "destructive" = "default"

  switch (status) {
    case "Em Aberto":
      variant = "outline"
      break
    case "Em andamento":
    case "Finalizado":
      variant = "default"
      break
    case "Em Análise":
    case "Aguardando peças":
    case "Aguardando compras":
    case "Aguardando aprovação":
      variant = "secondary"
      break
    case "Aguardando Mecânico":
      variant = "destructive"
      break
    default:
      variant = "default"
  }

  return <Badge variant={variant}>{status}</Badge>
}

interface OrdemServicoVisualizacaoProps {
  ordem: OrdemServico
  onBack: () => void
  onEdit: () => void
}

export function OrdemServicoVisualizacao({ ordem, onBack, onEdit }: OrdemServicoVisualizacaoProps) {
  const [activeTab, setActiveTab] = useState("informacoes")
  const [veiculoAno, setVeiculoAno] = useState<number | null>(null)
  const router = useRouter()

  // Buscar o ano do veículo ao montar
  useEffect(() => {
    async function fetchAno() {
      if (ordem.veiculoId) {
        const veiculo = await getVeiculoByIdSupabase(ordem.veiculoId)
        setVeiculoAno(veiculo?.ano || null)
      }
    }
    fetchAno()
  }, [ordem.veiculoId])

  const handleDownloadPDF = async () => {
    const blob = await pdf(<OrdemServicoPDF ordem={ordem} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordem-servico-${ordem.numero}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 print:space-y-2">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button size="sm" onClick={onEdit}>
            <FileEdit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Informações Principais */}
      <Card className="border-none shadow-md bg-background dark:bg-gray-900 print:shadow-none print:border">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl text-foreground">Ordem de Serviço: {ordem.numero}</CardTitle>
              <div className="text-muted-foreground flex items-center mt-1">
                <Clock className="h-4 w-4 mr-1" />
                Data: {ordem.data}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center">
                <span className="mr-2 text-sm font-medium">Status:</span>
                <StatusBadge status={ordem.status} />
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-sm font-medium">Prioridade:</span>
                <PrioridadeBadge prioridade={ordem.prioridade} />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo Detalhado */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="detalhes">Detalhes Técnicos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Aba de Informações */}
        <TabsContent value="informacoes" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Informações do Veículo */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Car className="h-5 w-5 mr-2 text-primary" />
                  Veículo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Identificação:</span>
                    <p>{ordem.veiculoInfo}</p>
                  </div>
                  <div>
                    <span className="font-medium">Km Atual:</span>
                    <p>
                      {ordem.kmAtual || "Não informado"}
                      {veiculoAno && (
                        <span className="ml-2 text-muted-foreground">• Ano: {veiculoAno}</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Solicitante */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Identificação:</span>
                    <p>{ordem.solicitanteInfo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Mecânico */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Wrench className="h-5 w-5 mr-2 text-primary" />
                  Mecânico Responsável
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Identificação:</span>
                    <p>{ordem.mecanicoInfo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datas e Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  Datas e Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Data de Abertura:</span>
                    <p>{ordem.data}</p>
                  </div>
                  <div>
                    <span className="font-medium">Última Atualização:</span>
                    <p>{new Date(ordem.updatedAt).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba de Detalhes Técnicos */}
        <TabsContent value="detalhes" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Defeitos Relatados */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
                  Defeitos Relatados pelo Condutor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted/30 rounded-md whitespace-pre-wrap min-h-[100px]">
                  {ordem.defeitosRelatados || "Nenhum defeito relatado."}
                </div>
              </CardContent>
            </Card>

            {/* Peças e Serviços */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Tools className="h-5 w-5 mr-2 text-primary" />
                  Relação de Peças e/ou Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted/30 rounded-md whitespace-pre-wrap min-h-[100px]">
                  {ordem.pecasServicos || "Nenhuma peça ou serviço registrado."}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba de Histórico */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          {/* Card de Observações */}
          {ordem.observacao2 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
                  Observações Registradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted/30 rounded-md whitespace-pre-wrap">
                  {ordem.observacao2}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <History className="h-5 w-5 mr-2 text-primary" />
                Histórico de Alterações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordem.historico && ordem.historico.length > 0 ? (
                <Timeline eventos={ordem.historico} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">Sem histórico disponível</h3>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    Não há registros de alterações para esta ordem de serviço.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Versão para impressão - sempre visível na impressão */}
      <div className="hidden print:block print:p-0 print:m-0 print:mt-2 print:ml-2 print:text-left">
        {/* Dados principais em tabela */}
        <div className="mb-2 print:mb-2">
          <div className="text-lg font-bold mb-1 print:mb-1">Ordem de Serviço: {ordem.numero}</div>
          <table className="w-auto text-sm border-none print:border-none">
            <tbody>
              <tr><td className="font-semibold pr-2 py-0 align-top">Veículo</td><td className="py-0">{ordem.veiculoInfo}</td></tr>
              <tr><td className="font-semibold pr-2 py-0 align-top">Km Atual</td><td className="py-0">{ordem.kmAtual || "Não informado"}</td></tr>
              <tr><td className="font-semibold pr-2 py-0 align-top">Solicitante</td><td className="py-0">{ordem.solicitanteInfo}</td></tr>
              <tr><td className="font-semibold pr-2 py-0 align-top">Mecânico Responsável</td><td className="py-0">{ordem.mecanicoInfo}</td></tr>
              <tr><td className="font-semibold pr-2 py-0 align-top">Data de Abertura</td><td className="py-0">{ordem.data}</td></tr>
              <tr><td className="font-semibold pr-2 py-0 align-top">Última Atualização</td><td className="py-0">{new Date(ordem.updatedAt).toLocaleString("pt-BR")}</td></tr>
              <tr><td className="font-semibold pr-2 py-0 align-top">Status</td><td className="py-0">{ordem.status}</td></tr>
              <tr><td className="font-semibold pr-2 py-0 align-top">Prioridade</td><td className="py-0">{ordem.prioridade}</td></tr>
            </tbody>
          </table>
        </div>
        {/* Defeitos Relatados */}
        <div className="mb-2 print:mb-2">
          <div className="font-semibold mb-0">Defeitos Relatados:</div>
          <div className="pl-2 min-h-[120px] print:border-none print:p-0 print:pl-2">{ordem.defeitosRelatados || "Nenhum defeito relatado."}</div>
        </div>
        {/* Peças e Serviços */}
        <div className="mb-2 print:mb-2">
          <div className="font-semibold mb-0">Peças e Serviços:</div>
          {(!ordem.pecasServicos || ordem.pecasServicos.trim() === '' || ordem.pecasServicos.trim() === 'Nenhuma peça ou serviço registrado.') ? (
            <table className="w-full text-sm mt-1 mb-1 border border-black border-collapse">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-1">Peça/Serviço</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx}><td className="border border-black px-2 py-4" style={{height: '32px'}}></td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="pl-2 min-h-[40px] print:border-none print:p-0 print:pl-2">{ordem.pecasServicos}</div>
          )}
        </div>
        {/* Observações Registradas - para impressão */}
        {ordem.observacao2 && (
          <div className="mb-2 print:mb-2">
            <div className="font-semibold mb-0">Observações Registradas:</div>
            <div className="pl-2 min-h-[40px] print:border-none print:p-0 print:pl-2 whitespace-pre-wrap">
              {ordem.observacao2}
            </div>
          </div>
        )}
        {/* Histórico de Alterações */}
        <div className="mb-2 print:mb-2">
          <div className="font-semibold mb-0">Histórico de Alterações:</div>
          <div className="pl-2 min-h-[120px] print:border-none print:p-0 print:pl-2">
            {ordem.historico && ordem.historico.length > 0 ? (
              <ul className="list-disc ml-5">
                {[...ordem.historico]
                  .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                  .map((evento) => {
                    const data = new Date(evento.data)
                    return (
                      <li key={evento.id} className="mb-0">
                        <span className="font-medium">{data.toLocaleDateString("pt-BR")} {data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        {" - "}{evento.tipo}
                        {evento.de !== evento.para && (
                          <span> (De: {evento.de} → Para: {evento.para})</span>
                        )}
                        {" - Status: "}<span>{evento.status}</span>
                        {evento.observacao && <span> - {evento.observacao}</span>}
                      </li>
                    )
                  })}
              </ul>
            ) : (
              <span>Não há registros de alterações para esta ordem de serviço.</span>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            box-shadow: none !important;
            background: #fff !important;
            background-image: url('/fundos/prefeitura-municipal-de-italva.png');
            background-size: 210mm 297mm;
            background-repeat: no-repeat;
            background-position: top left;
          }
          #__next, .print\:block {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            background: transparent !important;
            box-shadow: none !important;
          }
          .print\:block > * {
            margin-top: 40mm !important;
            max-width: 180mm;
            width: 100%;
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  )
}
