import React, { useRef, useState } from 'react';
import { FileText, Trash2, CheckSquare, Square, AlertCircle, Upload, Search, Filter, Truck } from 'lucide-react';
import { PdfDocument } from '../types';

interface PdfManagerProps {
  documents: PdfDocument[];
  onUpload: (files: FileList) => void;
  onDelete: (ids: string[]) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: (select: boolean) => void;
}

const PdfManager: React.FC<PdfManagerProps> = ({ 
  documents, 
  onUpload, 
  onDelete,
  onToggleSelect,
  onSelectAll
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterText, setFilterText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

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
      onUpload(e.dataTransfer.files);
    }
  };

  const handleDeleteSelected = () => {
    const selectedIds = documents.filter(d => d.selected).map(d => d.id);
    if (selectedIds.length > 0) {
      if (window.confirm(`Deseja excluir ${selectedIds.length} comprovantes? O volume realizado será descontado.`)) {
        onDelete(selectedIds);
      }
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(filterText.toLowerCase()) ||
    doc.extractionId.toLowerCase().includes(filterText.toLowerCase()) ||
    doc.extractedOriginCity.toLowerCase().includes(filterText.toLowerCase())
  );

  const duplicateCount = documents.filter(d => d.isDuplicate).length;
  // Carregamentos válidos = PDFs mapeados que NÃO são duplicatas
  const validLoads = documents.filter(d => d.mappedZoneId && !d.isDuplicate).length;
  const totalUploads = documents.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-piano-800 p-4 rounded border border-piano-700">
           <div className="flex items-center gap-2 mb-1">
               <FileText size={16} className="text-piano-muted"/>
               <p className="text-[10px] text-piano-muted uppercase font-bold">Total PDFs Importados</p>
           </div>
           <h3 className="text-3xl font-bold text-white">{totalUploads}</h3>
        </div>
        
        <div className="bg-piano-800 p-4 rounded border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
           <div className="flex items-center gap-2 mb-1">
               <Truck size={16} className="text-cyan-400"/>
               <p className="text-[10px] text-cyan-400 uppercase font-bold">Carregamentos Válidos</p>
           </div>
           <h3 className="text-3xl font-bold text-cyan-400">{validLoads}</h3>
           <p className="text-[10px] text-piano-muted mt-1">+1 Volume Realizado por PDF</p>
        </div>

        <div className={`p-4 rounded border ${duplicateCount > 0 ? 'bg-red-950/20 border-red-900' : 'bg-piano-800 border-piano-700'}`}>
           <div className="flex items-center gap-2 mb-1">
               <AlertCircle size={16} className={duplicateCount > 0 ? 'text-red-500' : 'text-piano-muted'}/>
               <p className={`text-[10px] uppercase font-bold ${duplicateCount > 0 ? 'text-red-400' : 'text-piano-muted'}`}>Duplicidades</p>
           </div>
           <h3 className={`text-3xl font-bold ${duplicateCount > 0 ? 'text-red-500' : 'text-white'}`}>{duplicateCount}</h3>
        </div>
        
         <div className="bg-piano-800 p-4 rounded border border-piano-700 flex items-center justify-center">
            <button 
                onClick={handleDeleteSelected}
                disabled={!documents.some(d => d.selected)}
                className="w-full h-full flex items-center justify-center gap-2 bg-red-950/30 hover:bg-red-900/50 text-red-500 border border-red-900 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold uppercase text-xs"
            >
                <Trash2 size={16} /> Excluir Selecionados
            </button>
        </div>
      </div>

      {/* Upload & Filters */}
      <div className="flex flex-col md:flex-row gap-4 h-32 shrink-0">
        {/* Drop Zone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-all
            ${isDragging ? 'border-cyan-500 bg-cyan-900/10' : 'border-piano-700 bg-piano-800 hover:border-cyan-500/50'}
          `}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                multiple 
                accept=".pdf" 
                className="hidden" 
                onChange={(e) => e.target.files && onUpload(e.target.files)}
            />
            <Upload size={24} className={isDragging ? 'text-cyan-400' : 'text-piano-muted'} />
            <p className="text-sm font-medium text-white mt-2">Clique ou arraste PDFs aqui</p>
            <p className="text-[10px] text-piano-muted">O sistema lê origem, destino e nº do circuito.</p>
        </div>

        {/* Filter */}
        <div className="w-full md:w-1/3 bg-piano-800 border border-piano-700 rounded p-4 flex flex-col justify-center gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-piano-600" size={16} />
                <input 
                    type="text" 
                    placeholder="Filtrar por ID ou Cidade..." 
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full bg-piano-900 border border-piano-700 rounded pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
             </div>
             <div className="flex justify-between items-center text-xs">
                 <button 
                    onClick={() => onSelectAll(true)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wide"
                 >
                    Selecionar Tudo
                 </button>
                  <button 
                    onClick={() => onSelectAll(false)}
                    className="text-piano-muted hover:text-white uppercase tracking-wide"
                 >
                    Limpar Seleção
                 </button>
             </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 bg-piano-800 border border-piano-700 rounded overflow-hidden flex flex-col">
        <div className="px-4 py-3 bg-piano-900 border-b border-piano-700 grid grid-cols-12 gap-2 text-[10px] font-bold text-piano-muted uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-3">Arquivo / ID Circuito</div>
            <div className="col-span-3">Origem (OCR)</div>
            <div className="col-span-2">Destino (OCR)</div>
            <div className="col-span-2">Zona Atribuída</div>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-piano-700">
            {filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-piano-muted">
                    <Filter size={32} className="mb-2 opacity-50"/>
                    <p>Nenhum documento encontrado.</p>
                </div>
            ) : (
                filteredDocs.map(doc => (
                    <div 
                        key={doc.id} 
                        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs transition-colors group 
                            ${doc.isDuplicate ? 'bg-red-950/10 hover:bg-red-950/20' : 'hover:bg-piano-700/30'}
                            ${doc.selected ? 'bg-cyan-900/10' : ''}
                        `}
                    >
                        <div className="col-span-1 text-center flex justify-center">
                            <button onClick={() => onToggleSelect(doc.id)} className="text-piano-500 hover:text-cyan-400">
                                {doc.selected ? <CheckSquare size={16} className="text-cyan-500" /> : <Square size={16} />}
                            </button>
                        </div>
                        
                        <div className="col-span-1">
                             <FileText size={16} className={doc.isDuplicate ? 'text-red-500' : 'text-piano-500'} />
                        </div>

                        <div className="col-span-3 overflow-hidden">
                            <div className={`font-bold truncate ${doc.isDuplicate ? 'text-red-400' : 'text-white'}`}>{doc.fileName}</div>
                            <div className="text-[10px] text-piano-muted flex items-center gap-1">
                                ID: {doc.extractionId}
                                {doc.isDuplicate && <span className="bg-red-900 text-red-200 px-1 rounded text-[9px] font-bold">DUPLICADO</span>}
                            </div>
                        </div>

                        <div className="col-span-3">
                            <div className="text-piano-text font-medium">{doc.extractedOriginCity}</div>
                            <div className="text-[10px] text-piano-muted">{doc.extractedOriginState}</div>
                        </div>
                        
                         <div className="col-span-2">
                            <div className="text-piano-text">{doc.extractedDestination}</div>
                        </div>

                        <div className="col-span-2">
                             {doc.mappedZoneId ? (
                                 <span className="inline-block px-2 py-1 bg-piano-900 border border-piano-700 rounded text-[10px] font-bold text-cyan-500">
                                     {doc.mappedZoneId}
                                 </span>
                             ) : (
                                 <span className="text-[10px] text-red-500 flex items-center gap-1">
                                     <AlertCircle size={10} /> Não mapeado
                                 </span>
                             )}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default PdfManager;