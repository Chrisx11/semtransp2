import { Page, Text, View, Document, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer';

// Tipos para evitar linter errors
interface HistoricoEvento {
  id?: string | number;
  data: string;
  tipo: string;
  status: string;
  observacao?: string;
}

interface OrdemServicoPDFProps {
  ordem: {
    numero: string;
    veiculoInfo: string;
    kmAtual: string;
    solicitanteInfo: string;
    mecanicoInfo: string;
    data: string;
    status: string;
    prioridade: string;
    defeitosRelatados?: string;
    pecasServicos?: string;
    observacao2?: string;
    historico?: HistoricoEvento[];
  };
}

// Definição das cores principais
const colors = {
  primary: '#3b82f6', // Azul principal
  secondary: '#6366f1', // Roxo
  success: '#10b981', // Verde
  warning: '#f59e0b', // Amarelo
  danger: '#ef4444', // Vermelho
  dark: '#1e293b', // Cinza escuro
  light: '#f8fafc', // Cinza claro
  muted: '#94a3b8', // Cinza médio
  border: '#e2e8f0', // Borda
  background: '#ffffff', // Fundo
  text: '#0f172a', // Texto
}

// Ícones em SVG paths para usar no PDF
const icons = {
  car: "M135.2 117.4L109.1 192H402.9l-26.1-74.6C372.3 104.6 360.2 96 346.6 96H165.4c-13.6 0-25.7 8.6-30.2 21.4zM39.6 196.8L74.8 96.3C88.3 57.8 124.6 32 165.4 32H346.6c40.8 0 77.1 25.8 90.6 64.3l35.2 100.5c23.2 9.6 39.6 32.5 39.6 59.2V400c0 26.5-21.5 48-48 48h-16c-26.5 0-48-21.5-48-48v-16H112v16c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V256c0-26.7 16.4-49.6 39.6-59.2zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm288 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64z",
  wrench: "M352 320c88.4 0 160-71.6 160-160c0-15.3-2.2-30.1-6.2-44.2c-3.1-10.8-16.4-13.2-24.3-5.3l-76.8 76.8c-3 3-7.1 4.7-11.3 4.7H336c-8.8 0-16-7.2-16-16V118.6c0-4.2 1.7-8.3 4.7-11.3l76.8-76.8c7.9-7.9 5.4-21.2-5.3-24.3C382.1 2.2 367.3 0 352 0C263.6 0 192 71.6 192 160c0 19.1 3.4 37.5 9.5 54.5L19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L297.5 310.5c17 6.2 35.4 9.5 54.5 9.5zM80 408a24 24 0 1 1 0 48 24 24 0 1 1 0-48z",
  clipboard: "M384 128v64H192V128H384zm0 96H192v64H384V224zM192 416h64V384H192v32zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zM48 96c0-8.8 7.2-16 16-16H384c8.8 0 16 7.2 16 16V416c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V96z",
  user: "M256 288A144 144 0 1 0 256 0a144 144 0 1 0 0 288zm-94.7 32C72.2 320 0 392.2 0 481.3c0 17 13.8 30.7 30.7 30.7H481.3c17 0 30.7-13.8 30.7-30.7C512 392.2 439.8 320 350.7 320H161.3z",
  calendar: "M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H384V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm128 80v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H144c-8.8 0-16 7.2-16 16z",
  gauge: "M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM288 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM256 416c35.3 0 64-28.7 64-64c0-17.4-6.9-33.1-18.1-44.6L366 161.7c5.3-12.1-.2-26.3-12.3-31.6s-26.3 .2-31.6 12.3L257.9 288c-.6 0-1.3 0-1.9 0c-35.3 0-64 28.7-64 64s28.7 64 64 64zM176 144a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM96 288a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm352-32a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z",
  tools: "M481.2 0c-11.4 0-22.2 5.1-29.5 13.9l-35 41.9H0v42.7l91.8 216.4c2.1 5 7 8.3 12.5 8.3H304c8.5 0 16.2-5.2 19.2-13.1l26.2-69H240V202.7h146.6l30.4-80.8c4.2-11.2 12.3-13.8 15.5-14.8l64.3-182c1.8-5.1-.4-10.8-5.3-13.1C488.8 .7 485 0 481.2 0zM208 240a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM256 384a64 64 0 1 0 0 128 64 64 0 1 0 0-128z",
  clock: "M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z",
  flag: "M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32V64 368 480c0 17.7 14.3 32 32 32s32-14.3 32-32V352l64.3-16.1c41.1-10.3 84.6-5.5 122.5 13.4c44.2 22.1 95.5 24.8 141.7 7.4l34.7-13c12.5-4.7 20.8-16.6 20.8-30V66.1c0-23-24.2-38-44.8-27.7l-9.6 4.8c-46.3 23.2-100.8 23.2-147.1 0c-35.1-17.6-75.4-22-113.5-12.5L64 48V32z",
};

const styles = StyleSheet.create({
  page: { 
    padding: 32, 
    fontSize: 12, 
    fontFamily: 'Helvetica',
    backgroundColor: colors.background 
  },
  // Cabeçalho com fundo azul
  header: { 
    backgroundColor: colors.primary, 
    padding: 16, 
    marginBottom: 20, 
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerContent: {
    flex: 1,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 4, 
    color: colors.light 
  },
  subtitle: { 
    fontSize: 12, 
    marginBottom: 2, 
    color: colors.light,
    opacity: 0.8
  },
  logoContainer: {
    backgroundColor: colors.light,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  section: { 
    marginBottom: 20, 
    backgroundColor: colors.light, 
    padding: 12, 
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderLeftStyle: 'solid'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: colors.dark,
    marginLeft: 8,
  },
  osCard: {
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'column',
  },
  osCardHeader: {
    flexDirection: 'row',
    backgroundColor: colors.dark,
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 12,
  },
  osNumber: {
    color: colors.light,
    fontWeight: 'bold',
    fontSize: 14,
  },
  osDate: {
    color: colors.light,
    fontSize: 12,
    marginLeft: 'auto',
  },
  osInfoRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  osInfoLabel: {
    color: colors.muted,
    width: 100,
    fontSize: 11,
  },
  osInfoValue: {
    color: colors.dark,
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
    fontSize: 10,
    color: colors.light,
    textAlign: 'center',
    width: 80,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.light,
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    height: '100%',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  infoCardIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  infoCardTitle: {
    fontWeight: 'bold',
    fontSize: 12,
    color: colors.dark,
    marginLeft: 6,
  },
  infoCardContent: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 1.4,
  },
  historyItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  historyDate: {
    fontSize: 10,
    color: colors.muted,
    width: 70,
  },
  historyType: {
    fontSize: 10,
    color: colors.dark,
    width: 100,
    fontWeight: 'bold',
  },
  historyStatus: {
    fontSize: 10,
    color: colors.text,
    flex: 1,
  },
  historyObservation: {
    fontSize: 10,
    color: colors.text,
    fontStyle: 'italic',
    flex: 1.5,
  },
  footer: { 
    position: 'absolute', 
    bottom: 24, 
    left: 32, 
    right: 32, 
    fontSize: 10, 
    color: colors.muted, 
    textAlign: 'right',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  noteLine: { 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border, 
    height: 22, 
    marginBottom: 2 
  },
});

// Função auxiliar para renderizar os ícones SVG
const SvgIcon = ({ path, width = 16, height = 16, color = colors.primary }: { path: string, width?: number, height?: number, color?: string }) => (
  <Svg width={width} height={height} viewBox="0 0 512 512">
    <Path d={path} fill={color} />
  </Svg>
);

// Função para gerar a cor do status
const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('aberta') || statusLower.includes('nova')) return colors.primary;
  if (statusLower.includes('andamento') || statusLower.includes('aguardando') || statusLower.includes('espera')) return colors.warning;
  if (statusLower.includes('concluída') || statusLower.includes('finalizada') || statusLower.includes('aprovada')) return colors.success;
  if (statusLower.includes('cancelada') || statusLower.includes('rejeitada')) return colors.danger;
  return colors.muted;
};

// Função para gerar a cor da prioridade
const getPriorityColor = (prioridade: string) => {
  const prioridadeLower = prioridade.toLowerCase();
  if (prioridadeLower.includes('alta')) return colors.danger;
  if (prioridadeLower.includes('média')) return colors.warning;
  if (prioridadeLower.includes('baixa')) return colors.success;
  return colors.muted;
};

export function OrdemServicoPDF({ ordem }: OrdemServicoPDFProps) {
  // Determinar cores para status e prioridade
  const statusColor = getStatusColor(ordem.status);
  const priorityColor = getPriorityColor(ordem.prioridade);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Ordem de Serviço #{ordem.numero}</Text>
            <Text style={styles.subtitle}>Sistema Integrado de Gestão de Frotas</Text>
          </View>
          <View style={styles.logoContainer}>
            <SvgIcon path={icons.car} width={35} height={35} color={colors.primary} />
          </View>
        </View>

        {/* Seção principal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SvgIcon path={icons.clipboard} width={18} height={18} />
            <Text style={styles.sectionTitle}>Detalhes da Ordem de Serviço</Text>
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
            {/* Coluna esquerda */}
            <View style={{ width: '50%', paddingRight: 10 }}>
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <SvgIcon path={icons.car} width={14} height={14} />
                  <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: 'bold', color: colors.dark }}>Veículo</Text>
                </View>
                <Text style={{ fontSize: 12, marginLeft: 20 }}>
                  {typeof ordem.veiculoInfo === 'string' 
                    ? ordem.veiculoInfo.replace(/\bMarca:.*?(,|$)/i, '').trim().replace(/^,|,$/, '') 
                    : ordem.veiculoInfo}
                </Text>
              </View>
              
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <SvgIcon path={icons.gauge} width={14} height={14} />
                  <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: 'bold', color: colors.dark }}>Km Atual</Text>
                </View>
                <Text style={{ fontSize: 12, marginLeft: 20 }}>{ordem.kmAtual}</Text>
              </View>
              
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <SvgIcon path={icons.user} width={14} height={14} />
                  <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: 'bold', color: colors.dark }}>Solicitante</Text>
                </View>
                <Text style={{ fontSize: 12, marginLeft: 20 }}>
                  {typeof ordem.solicitanteInfo === 'string' 
                    ? ordem.solicitanteInfo.replace(/\s*-\s*.*$/, '').replace(/\s*\(.*?\)/, '').trim() 
                    : ordem.solicitanteInfo}
                </Text>
              </View>
            </View>
            
            {/* Coluna direita */}
            <View style={{ width: '50%' }}>
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <SvgIcon path={icons.wrench} width={14} height={14} />
                  <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: 'bold', color: colors.dark }}>Mecânico</Text>
                </View>
                <Text style={{ fontSize: 12, marginLeft: 20 }}>
                  {typeof ordem.mecanicoInfo === 'string' 
                    ? ordem.mecanicoInfo.replace(/\s*-\s*.*$/, '').replace(/\s*\(.*?\)/, '').trim() 
                    : ordem.mecanicoInfo}
                </Text>
              </View>
              
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <SvgIcon path={icons.calendar} width={14} height={14} />
                  <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: 'bold', color: colors.dark }}>Data</Text>
                </View>
                <Text style={{ fontSize: 12, marginLeft: 20 }}>{ordem.data}</Text>
              </View>
              
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <View style={{ width: '50%' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <SvgIcon path={icons.clipboard} width={14} height={14} />
                    <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: 'bold', color: colors.dark }}>Status</Text>
                  </View>
                  <View style={{ 
                    backgroundColor: statusColor, 
                    paddingVertical: 2, 
                    paddingHorizontal: 8, 
                    borderRadius: 4, 
                    alignSelf: 'flex-start', 
                    marginLeft: 20 
                  }}>
                    <Text style={{ color: 'white', fontSize: 11 }}>{ordem.status}</Text>
                  </View>
                </View>
                <View style={{ width: '50%' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <SvgIcon path={icons.clock} width={14} height={14} />
                    <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: 'bold', color: colors.dark }}>Prioridade</Text>
                  </View>
                  <View style={{ 
                    backgroundColor: priorityColor, 
                    paddingVertical: 2, 
                    paddingHorizontal: 8, 
                    borderRadius: 4, 
                    alignSelf: 'flex-start', 
                    marginLeft: 20 
                  }}>
                    <Text style={{ color: 'white', fontSize: 11 }}>{ordem.prioridade}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Defeitos Relatados */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SvgIcon path={icons.clipboard} width={18} height={18} />
            <Text style={styles.sectionTitle}>Defeitos Relatados</Text>
          </View>
          <Text style={{ fontSize: 12, lineHeight: 1.5 }}>
            {ordem.defeitosRelatados || "Nenhum defeito relatado."}
          </Text>
        </View>

        {/* Peças e Serviços */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SvgIcon path={icons.tools} width={18} height={18} />
            <Text style={styles.sectionTitle}>Peças e Serviços</Text>
          </View>
          <Text style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 15 }}>
            {ordem.pecasServicos || "Nenhuma peça ou serviço registrado."}
          </Text>
          
          {/* Campo para anotações */}
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 5 }}>Anotações adicionais:</Text>
            {[...Array(6)].map((_, idx) => (
              <View key={idx} style={styles.noteLine} />
            ))}
          </View>
        </View>
        
        {/* Observações Registradas */}
        {ordem.observacao2 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SvgIcon path={icons.clipboard} width={18} height={18} />
              <Text style={styles.sectionTitle}>Observações Registradas</Text>
            </View>
            <Text style={{ fontSize: 12, lineHeight: 1.5 }}>
              {ordem.observacao2}
            </Text>
          </View>
        )}
        
        {/* Histórico */}
        {ordem.historico && ordem.historico.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SvgIcon path={icons.clock} width={18} height={18} />
              <Text style={styles.sectionTitle}>Histórico de Alterações</Text>
            </View>
            {ordem.historico.map((evento, idx) => (
              <View key={evento.id || idx} style={{ 
                flexDirection: 'row', 
                borderBottomWidth: 1, 
                borderBottomColor: colors.border, 
                paddingVertical: 4,
                marginBottom: idx === ordem.historico!.length - 1 ? 0 : 4
              }}>
                <Text style={{ width: 80, fontSize: 10, color: colors.muted }}>
                  {new Date(evento.data).toLocaleDateString('pt-BR')}
                </Text>
                <Text style={{ width: 80, fontSize: 10, fontWeight: 'bold', color: colors.dark }}>
                  {evento.tipo}
                </Text>
                <Text style={{ width: 80, fontSize: 10, color: colors.dark }}>
                  {evento.status}
                </Text>
                {evento.observacao && (
                  <Text style={{ flex: 1, fontSize: 10, fontStyle: 'italic', color: colors.muted }}>
                    {evento.observacao}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Rodapé */}
        <Text style={styles.footer}>
          Relatório gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </Text>
      </Page>
    </Document>
  );
}