import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { OriginZone } from '../types';
import { expandLocationName } from '../constants';
import * as XLSX from 'xlsx';

interface ImportViewProps {
  onProcessData: (newZonesData: OriginZone[]) => void;
  currentZones: OriginZone[];
}

const ImportView: React.FC<ImportViewProps> = ({ onProcessData }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [processedCount, setProcessedCount] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [ignoredDuplicates, setIgnoredDuplicates] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
      fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const isValid = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');

    if (!isValid) {
        setErrorMessage('Formato inválido. Use .XLSX, .XLS ou .CSV');
        setImportStatus('ERROR');
        return;
    }

    setIsProcessing(true);
    setImportStatus('IDLE');
    setErrorMessage('');
    setIgnoredDuplicates(0);

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte para matriz de dados
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        if (!rows || rows.length === 0) {
            throw new Error("A planilha está vazia.");
        }

        const zonesMap = new Map<string, OriginZone>();
        const processedCircuitIds = new Set<string>(); // Para controle de duplicidade
        
        let validRowsCount = 0;
        let duplicatesCount = 0;

        // --- DETECÇÃO DE COLUNAS ---
        // Padrão baseado na imagem:
        // Coluna A (0): Nº Circuito (Chave Única)
        // Coluna B (1): Origem
        // Coluna C (2): Destino
        // Coluna D (3): Programador
        // Coluna F (5): Contrato (Meta)
        // Coluna H (7): Realizado (Assumindo padrão da imagem enviada anteriormente)
        
        let idxCircuito = 0;
        let idxOrigem = 1;
        let idxDestino = 2;
        let idxProgramador = 3;
        let idxMeta = 5; 
        let idxRealizado = 7; 
        
        let startRow = 1;

        // Tenta confirmar o cabeçalho procurando os textos exatos
        let headerFound = false;
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i];
            if (!row) continue;
            
            const rowStr = row.map((cell: any) => String(cell || '').toUpperCase().trim());
            
            const foundOrigem = rowStr.findIndex(c => c === 'ORIGEM');
            const foundDestino = rowStr.findIndex(c => c === 'DESTINO');
            
            // O Circuito geralmente é a primeira coluna ou tem '#' ou 'Nº'
            const foundCircuito = rowStr.findIndex(c => c.includes('CIRCUITO') || c === '#' || c.includes('Nº'));

            if (foundOrigem !== -1 && foundDestino !== -1) {
                idxOrigem = foundOrigem;
                idxDestino = foundDestino;
                if (foundCircuito !== -1) idxCircuito = foundCircuito;
                
                // Busca dinâmica das outras colunas
                const foundMeta = rowStr.findIndex(c => c === 'CONTRATO' || c === 'META');
                const foundProg = rowStr.findIndex(c => c === 'PROGRAMADOR');
                const foundRealizado = rowStr.findIndex(c => c === 'REALIZADO' || c === 'REAL' || c.includes('EXECUTADO'));
                
                if (foundMeta !== -1) idxMeta = foundMeta; 
                if (foundProg !== -1) idxProgramador = foundProg;
                if (foundRealizado !== -1) idxRealizado = foundRealizado;

                startRow = i + 1;
                headerFound = true;
                break;
            }
        }
        
        // --- PROCESSAMENTO ---
        for (let i = startRow; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;

            // 1. Controle de Duplicidade pelo ID do Circuito (Coluna A)
            const rawCircuitId = row[idxCircuito] ? String(row[idxCircuito]).trim() : '';
            
            // Se não tem ID de circuito, ou se já processamos esse ID, ignoramos
            if (!rawCircuitId) continue;
            
            if (processedCircuitIds.has(rawCircuitId)) {
                duplicatesCount++;
                continue; // Pula linha duplicada
            }
            
            // Adiciona ao set de processados
            processedCircuitIds.add(rawCircuitId);

            // 2. Leitura dos Dados
            const rawOrigin = row[idxOrigem] ? String(row[idxOrigem]).trim().toUpperCase() : '';
            const rawDest = row[idxDestino] ? String(row[idxDestino]).trim().toUpperCase() : '';
            
            if (!rawOrigin || !rawDest || rawOrigin.includes('TOTAL')) continue;

            const programmer = (idxProgramador !== -1 && row[idxProgramador]) 
                ? String(row[idxProgramador]).trim() 
                : 'A Definir';

            // Leitura da Meta
            let rawVol = 0;
            if (idxMeta !== -1 && row[idxMeta] !== undefined) {
                 const val = row[idxMeta];
                 if (typeof val === 'number') {
                     rawVol = val;
                 } else if (typeof val === 'string') {
                     const cleanStr = val.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
                     rawVol = parseFloat(cleanStr) || 0;
                 }
            }

            // Leitura do Realizado
            let rawRealized = 0;
            if (idxRealizado !== -1 && row[idxRealizado] !== undefined) {
                 const val = row[idxRealizado];
                 if (typeof val === 'number') {
                     rawRealized = val;
                 } else if (typeof val === 'string') {
                     const cleanStr = val.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
                     rawRealized = parseFloat(cleanStr) || 0;
                 }
            }

            // Identificador da Zona (Estritamente pelo local de carregamento)
            // Se for "FORA DO CIRCUITO X", tentamos limpar para agrupar corretamente
            let zoneId = rawOrigin;
            
            // Normalização básica de IDs para agrupar visualmente
            if (zoneId.includes('FORA DO CIRCUITO')) {
                 // Remove "FORA DO CIRCUITO" para pegar o nome real da região
                 const cleanName = zoneId.replace('FORA DO CIRCUITO', '').trim();
                 if (cleanName) zoneId = cleanName;
            }

            // REGRA: Agrupar PERNAMBUCO e PERNAMBUCO / PARAIBA / ALAGOAS em NORDESTE
            if (zoneId === 'PERNAMBUCO' || zoneId === 'PERNAMBUCO / PARAIBA / ALAGOAS') {
                zoneId = 'NORDESTE';
            }
            
            // Cria ID curto para uso interno (primeiras 3 letras ou mapeamento simples)
            const shortId = zoneId.substring(0, 3).toUpperCase();

            const expandedName = expandLocationName(rawOrigin);
            const expandedDest = expandLocationName(rawDest);

            // Cria a zona se não existir
            // Usamos o nome completo (limpo) como chave para garantir unicidade correta das zonas
            const mapKey = zoneId; 

            if (!zonesMap.has(mapKey)) {
                zonesMap.set(mapKey, {
                    id: shortId + '-' + Math.random().toString(36).substr(2, 4), // ID único interno
                    name: zoneId, // Nome de exibição
                    programmer: programmer !== 'A Definir' ? programmer : 'A Definir',
                    financialRevenue: 0,
                    financialBonus: 0,
                    routes: []
                });
            }

            const zone = zonesMap.get(mapKey)!;

            if (zone.programmer === 'A Definir' && programmer !== 'A Definir') {
                zone.programmer = programmer;
            }

            // Cálculo financeiro estimado inicial com base no realizado importado
            // Assumindo valores padrão para cálculo inicial
            zone.financialRevenue += (rawRealized * 1500);
            zone.financialBonus += (rawRealized * 50);

            zone.routes.push({
                id: rawCircuitId, // Usa o ID real do circuito da planilha
                origin: expandedName,
                destination: expandedDest,
                contractedVolume: rawVol,
                realizedVolume: rawRealized // Preenche com o valor lido da planilha
            });

            validRowsCount++;
        }

        if (validRowsCount === 0) {
            throw new Error("Nenhum dado válido encontrado.");
        }

        const newZones = Array.from(zonesMap.values());
        newZones.sort((a, b) => a.name.localeCompare(b.name));

        const totalRoutes = newZones.reduce((acc, z) => acc + z.routes.length, 0);

        setTimeout(() => {
            onProcessData(newZones);
            setProcessedCount(totalRoutes);
            setProcessedRows(validRowsCount);
            setIgnoredDuplicates(duplicatesCount);
            setImportStatus('SUCCESS');
            setIsProcessing(false);
        }, 800);

    } catch (err: any) {
        console.error(err);
        setErrorMessage('Erro ao ler planilha: ' + (err.message || 'Verifique o formato do arquivo.'));
        setImportStatus('ERROR');
        setIsProcessing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-8 pb-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Importação de Contratos</h2>
        <p className="text-piano-muted max-w-lg mx-auto">
            Carregue a planilha de <strong>Metas de Contrato</strong>. O sistema filtra duplicatas e importa o volume realizado atual.
        </p>
      </div>

      {/* Upload Area */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
            relative border border-dashed rounded p-12 text-center transition-all duration-300
            flex flex-col items-center justify-center gap-4 cursor-pointer bg-piano-800
            ${isDragging 
                ? 'border-cyan-500 bg-cyan-900/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                : 'border-piano-700 hover:border-cyan-500/50 hover:bg-piano-800/80'}
        `}
      >
        <div className="bg-piano-900 p-4 rounded-full border border-piano-700">
            <UploadCloud size={48} className={isDragging ? 'text-cyan-400' : 'text-piano-muted'} />
        </div>
        
        <div className="space-y-1">
            <p className="text-lg font-medium text-white">
                Arraste o arquivo Excel (.xlsx) aqui
            </p>
            <p className="text-sm text-piano-muted">
                O sistema lê: Origem, Destino, Meta e <strong>Realizado</strong>.
            </p>
        </div>

        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls"
            onChange={handleFileSelect}
        />

        <button 
            onClick={triggerFileSelect}
            disabled={isProcessing}
            className="mt-4 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded transition-colors shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isProcessing ? 'Processando...' : 'Selecionar Arquivo'}
        </button>

        {isProcessing && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center rounded z-10">
                <RefreshCw size={48} className="text-cyan-500 animate-spin mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">Lendo Planilha</h3>
                <p className="text-sm text-piano-muted">Mapeando metas e realizados...</p>
            </div>
        )}
      </div>

      {/* Status Feedback */}
      {importStatus === 'SUCCESS' && (
        <div className="bg-cyan-900/10 border border-cyan-500/30 rounded p-6 flex items-start gap-4 animate-in slide-in-from-bottom-4">
            <div className="bg-cyan-900/20 p-2 rounded text-cyan-400 shrink-0">
                <CheckCircle size={24} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-cyan-400">Importação Realizada com Sucesso</h3>
                <p className="text-piano-text mt-1 text-sm">
                    Planilha processada. Foram identificados <strong>{processedRows} circuitos únicos</strong> com dados de realizado preenchidos.
                </p>
                {ignoredDuplicates > 0 && (
                     <p className="text-xs text-orange-400 mt-1 font-bold">
                        {ignoredDuplicates} linhas duplicadas foram ignoradas automaticamente.
                    </p>
                )}
                <p className="text-xs text-piano-muted mt-2">
                    Vá para a "Visão Geral" para acompanhar o desempenho.
                </p>
            </div>
        </div>
      )}

      {importStatus === 'ERROR' && (
        <div className="bg-red-900/10 border border-red-500/30 rounded p-6 flex items-start gap-4 animate-in slide-in-from-bottom-4">
            <div className="bg-red-900/20 p-2 rounded text-red-400 shrink-0">
                <AlertCircle size={24} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-red-400">Falha ao Ler Arquivo</h3>
                <p className="text-piano-text mt-1 text-sm">
                    {errorMessage}
                </p>
            </div>
        </div>
      )}

      {/* File Format Hint */}
      <div className="bg-piano-800 p-6 rounded border border-piano-700">
        <h4 className="flex items-center gap-2 text-white font-semibold mb-6">
            <FileSpreadsheet size={18} className="text-cyan-500"/> Colunas Mapeadas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 font-mono text-xs">
            <div className="p-3 bg-black/40 rounded border border-piano-700 border-t-2 border-t-yellow-500">
                <span className="block text-[10px] text-piano-600 mb-1">COLUNA A</span>
                <span className="text-white">Nº Circuito</span>
            </div>
            <div className="p-3 bg-black/40 rounded border border-piano-700 border-t-2 border-t-purple-500">
                <span className="block text-[10px] text-piano-600 mb-1">COLUNA B</span>
                <span className="text-white font-bold">ORIGEM</span>
            </div>
            <div className="p-3 bg-black/40 rounded border border-piano-700 border-t-2 border-t-cyan-500">
                <span className="block text-[10px] text-piano-600 mb-1">COLUNA C</span>
                <span className="text-white font-bold">DESTINO</span>
            </div>
            <div className="p-3 bg-black/40 rounded border border-piano-700 border-t-2 border-t-green-500">
                <span className="block text-[10px] text-piano-600 mb-1">COLUNA F</span>
                <span className="text-white font-bold">META</span>
            </div>
             <div className="p-3 bg-black/40 rounded border border-piano-700 border-t-2 border-t-blue-500">
                <span className="block text-[10px] text-piano-600 mb-1">COLUNA H</span>
                <span className="text-white font-bold">REALIZADO</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImportView;