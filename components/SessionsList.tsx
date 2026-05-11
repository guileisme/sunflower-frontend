"use client";

import { MapPin, Calendar, TrendingUp, ChevronRight } from "lucide-react";

export interface Session {
  id: string;
  region: string;
  state: string;
  date: string;
  viability: number;
  irradiation: number;
  status: 'excellent' | 'good' | 'moderate' | 'poor';
  temperature?: number;
  cloudiness?: number;
  wind?: number;
}

interface SessionsListProps {
  sessions: Session[];
  onSelectSession?: (session: Session) => void;
  selectedIds?: string[];
}

export function SessionsList({ sessions, onSelectSession, selectedIds = [] }: SessionsListProps) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'excellent': return 'bg-green-100 text-[#15803d] border-green-200';
      case 'good': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'moderate': return 'Moderado';
      case 'poor': return 'Baixo';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const isSelected = selectedIds.includes(session.id);
        
        return (
          <div
            key={session.id}
            onClick={() => onSelectSession?.(session)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-green-50 border-sun-green-600 shadow-md ring-1 ring-sun-green-600'
                : 'bg-white border-black/5 shadow-sm hover:shadow-md hover:border-black/10'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              
              {/* Coluna Esquerda - Informações Principais */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="shrink-0 mt-0.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${isSelected ? 'bg-sun-green-600 text-white' : 'bg-[#eeede8] text-sun-green-600'}`}>
                    <MapPin size={20} />
                  </div>
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-black text-sun-text text-sm truncate">{session.region}</h3>
                    <span className="text-[9px] font-bold text-[#6b6a64] bg-[#eeede8] px-1.5 py-0.5 rounded uppercase shrink-0">
                      {session.state}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#6b6a64] font-medium">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Calendar size={12} />
                      {session.date}
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <TrendingUp size={12} />
                      Irradiação: {session.irradiation} kWh/m²
                    </span>
                  </div>
                </div>
              </div>

              {/* Coluna Direita - Viabilidade e Status (Empilhados) */}
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <div className="flex flex-col items-end gap-1.5">
                  <div className="text-right">
                    <div className={`text-xl font-black leading-none ${isSelected ? 'text-sun-green-600' : 'text-[#15803d]'}`}>
                      {session.viability}%
                    </div>
                    <p className="text-[8px] font-bold text-[#6b6a64] uppercase tracking-wider mt-1 leading-none">
                      Viabilidade
                    </p>
                  </div>

                  <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border whitespace-nowrap text-center ${getStatusColor(session.status)}`}>
                    {getStatusLabel(session.status)}
                  </div>
                </div>

                <ChevronRight size={18} className="text-[#6b6a64] shrink-0 ml-1" />
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="bg-sun-green-600 h-full transition-all duration-700 ease-out"
                style={{ width: `${session.viability}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}