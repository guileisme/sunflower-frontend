"use client";

import React, { useState } from 'react';
import { MapPin, Calendar, TrendingUp, ChevronRight } from "lucide-react";

export interface Session {
  id: string;
  region: string;
  state: string;
  date: string;
  viability: number;
  irradiation: number;
  status: 'excellent' | 'good' | 'moderate' | 'poor';
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
    <div className="space-y-2">
      {sessions.map((session) => {
        const isSelected = selectedIds.includes(session.id);
        
        return (
          <div
            key={session.id}
            onClick={() => onSelectSession?.(session)}
            className={`p-4 rounded-lg border transition-all cursor-pointer ${
              isSelected
                ? 'bg-green-50 border-green-300 shadow-md'
                : 'bg-white border-black/5 shadow-sm hover:shadow-md hover:border-black/10'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Coluna Esquerda - Informações Principais */}
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-sun-green-600 rounded-full flex items-center justify-center text-white shadow-md">
                    <MapPin size={24} />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-sun-text text-base">{session.region}</h3>
                    <span className="text-xs font-bold text-[#6b6a64] bg-[#eeede8] px-2 py-0.5 rounded">
                      {session.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#6b6a64]">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {session.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} />
                      Irradiação: {session.irradiation} kWh/m²
                    </span>
                  </div>
                </div>
              </div>

              {/* Coluna Direita - Viabilidade e Status */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="text-2xl font-black text-[#15803d] leading-none">
                    {session.viability}%
                  </div>
                  <p className="text-[10px] font-bold text-[#6b6a64] uppercase tracking-wider mt-1">
                    Viabilidade
                  </p>
                </div>

                <div className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(session.status)}`}>
                  {getStatusLabel(session.status)}
                </div>

                <ChevronRight size={20} className="text-[#6b6a64]" />
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="bg-sun-green-600 h-full transition-all"
                style={{ width: `${session.viability}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}