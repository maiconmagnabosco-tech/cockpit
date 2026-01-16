

export interface RouteContract {
  id: string;
  origin: string;
  destination: string;
  contractedVolume: number; // Volume Contratado (Meta)
  realizedVolume: number;   // Volume Realizado
}

export interface OriginZone {
  id: string;
  name: string; // e.g., "Goiás", "Paraná"
  programmer: string; // Programador responsável
  financialRevenue: number; // Faturamento estimado
  financialBonus: number;   // Bonificação estimada
  routes: RouteContract[];
}

export interface DashboardData {
  zones: OriginZone[];
}

export enum AppView {
  OVERVIEW = 'OVERVIEW',
  ZONE_DETAIL = 'ZONE_DETAIL',
  IMPORT = 'IMPORT',
  PDF_UPLOAD = 'PDF_UPLOAD'
}

export interface PdfDocument {
  id: string;
  fileName: string;
  extractionId: string;
  extractedOriginCity: string;
  extractedOriginState: string;
  extractedDestination: string;
  mappedZoneId: string | null;
  isDuplicate: boolean;
  selected: boolean;
}

export interface AppNotification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
}
