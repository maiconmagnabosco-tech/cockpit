
import { OriginZone, RouteContract } from './types';

export const COMPLIANCE_THRESHOLD = 0.90; // Meta Bonificação (90%)
export const COMPLIANCE_THRESHOLD_GIF = 0.95; // Meta GIF (95%)
export const ROUTE_MIN_THRESHOLD = 0.40; // Mínimo aceitável por rota individual (40%)
export const MAX_ALLOWED_FAILURES = 2;

// --- DYNAMIC DATE LOGIC ---
export const getDateFactor = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Get total days in current month (day 0 of next month gets last day of current)
  const totalDays = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  
  // Calculate factor (e.g., 15th of 30 days = 0.5)
  // We constrain it to max 1.0 just in case logic runs over
  const factor = Math.min(currentDay / totalDays, 1.0);

  return {
    currentDay,
    totalDays,
    factor,
    formattedDate: now.toLocaleDateString('pt-BR')
  };
};

// --- BRAZILIAN STATE MAPPING LOGIC ---
export const BRAZILIAN_STATES: Record<string, string> = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
  'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
  'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

// Helper function to expand abbreviations in any string
export const expandLocationName = (text: string): string => {
  if (!text) return text;
  let expanded = text;
  Object.keys(BRAZILIAN_STATES).forEach(code => {
    const regex = new RegExp(`\\b${code}\\b`, 'g');
    if (regex.test(expanded)) {
        expanded = expanded.replace(regex, BRAZILIAN_STATES[code].toUpperCase());
    }
  });
  return expanded.toUpperCase();
};

// --- LOGICA DE MAPEAMENTO DE ZONA POR CIDADE/ESTADO (REGRAS ESPECÍFICAS) ---
export const mapCityToZone = (city: string, state: string): string | null => {
  const c = city.toUpperCase().trim();
  const s = state.toUpperCase().trim();

  // PRIORIDADE 1: Cidades Específicas (Triângulo Mineiro e Regiões do Sul)

  // 5. TRIANGULO MINEIRO (Uberlandia e Araguari)
  if ((s === 'MG' || s === 'MINAS GERAIS') && (c === 'UBERLANDIA' || c === 'UBERLÂNDIA' || c === 'ARAGUARI')) {
      return 'TM';
  }

  // 6. LESTE PARANA (Paranagua ou Ponta Grossa)
  if ((s === 'PR' || s === 'PARANÁ') && (c === 'PARANAGUA' || c === 'PARANAGUÁ' || c === 'PONTA GROSSA')) {
      return 'LPR';
  }

  // 7. OESTE PARANA (Londrina ou Toledo)
  if ((s === 'PR' || s === 'PARANÁ') && (c === 'LONDRINA' || c === 'TOLEDO')) {
      return 'OPR';
  }

  // 8. SUDOESTE DO PARANA (Dois Vizinhos ou Francisco Beltrão)
  if ((s === 'PR' || s === 'PARANÁ') && (c === 'DOIS VIZINHOS' || c === 'FRANCISCO BELTRAO' || c === 'FRANCISCO BELTRÃO')) {
      return 'SPR';
  }

  // 9. EXTREMO OESTE SC (Concordia, Chapeco ou Irani)
  if ((s === 'SC' || s === 'SANTA CATARINA') && (c === 'CONCORDIA' || c === 'CONCÓRDIA' || c === 'CHAPECO' || c === 'CHAPECÓ' || c === 'IRANI')) {
      return 'ESC';
  }

  // 10. CENTRAL SC (Videira, Capinzal, Herval do Oeste, Campos Novos)
  if ((s === 'SC' || s === 'SANTA CATARINA') && (c === 'VIDEIRA' || c === 'CAPINZAL' || c === 'HERVAL DO OESTE' || c === 'CAMPOS NOVOS')) {
      return 'CSC';
  }

  // PRIORIDADE 2: Regras Gerais por Estado (se não caiu nas regras de cidade acima)

  // 1. GOIÁS (Tudo que for GO)
  if (s === 'GO' || s === 'GOIÁS') return 'GO';

  // 2. MATO GROSSO (Tudo que for MT)
  if (s === 'MT' || s === 'MATO GROSSO') return 'MT';

  // 3. MATO GROSSO DO SUL (Tudo que for MS)
  if (s === 'MS' || s === 'MATO GROSSO DO SUL') return 'MS';

  // 4. SÃO PAULO (Tudo que for SP)
  if (s === 'SP' || s === 'SÃO PAULO') return 'SP';

  // 11. NORDESTE (Estados Genéricos)
  if (s === 'BA' || s === 'PE' || s === 'CE' || s === 'AL' || s === 'PB' || s === 'RN' || s === 'SE' || s === 'MA' || s === 'PI') return 'NE';

  return null; // Não mapeado
};

// INITIAL DATA EMPTY - SYSTEM STARTS BLANK
export const INITIAL_DATA: OriginZone[] = [];
