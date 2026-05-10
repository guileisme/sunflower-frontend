"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { SessionsList, type Session } from "@/components/SessionsList";
import { RegionComparison } from "@/components/RegionComparison";

export default function RegionsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  // Dados de exemplo - em produção viriam de uma API
  const allSessions: Session[] = [
    {
      id: '1',
      region: 'Belo Jardim',
      state: 'PE',
      date: '18/04/2026',
      viability: 84,
      irradiation: 6.4,
      status: 'excellent'
    },
    {
      id: '2',
      region: 'Caruaru',
      state: 'PE',
      date: '18/04/2026',
      viability: 78,
      irradiation: 5.9,
      status: 'good'
    },
    {
      id: '3',
      region: 'Garanhuns',
      state: 'PE',
      date: '17/04/2026',
      viability: 72,
      irradiation: 5.5,
      status: 'good'
    },
    {
      id: '4',
      region: 'Petrolina',
      state: 'PE',
      date: '17/04/2026',
      viability: 91,
      irradiation: 7.2,
      status: 'excellent'
    },
    {
      id: '5',
      region: 'Recife',
      state: 'PE',
      date: '16/04/2026',
      viability: 65,
      irradiation: 4.8,
      status: 'moderate'
    },
    {
      id: '6',
      region: 'Salgueiro',
      state: 'PE',
      date: '16/04/2026',
      viability: 88,
      irradiation: 6.9,
      status: 'excellent'
    },
  ];

  // Filtrar sessões baseado na busca
  const filteredSessions = allSessions.filter(session =>
    session.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obter as regiões selecionadas
  const selectedRegions = allSessions.filter(s => selectedSessions.includes(s.id));

  const handleSelectSession = (session: Session) => {
    if (selectedSessions.includes(session.id)) {
      setSelectedSessions(selectedSessions.filter(id => id !== session.id));
    } else if (selectedSessions.length < 2) {
      setSelectedSessions([...selectedSessions, session.id]);
    }
  };

  const handleClearSelection = () => {
    setSelectedSessions([]);
  };

  return (
    <main className="w-full p-4 md:p-6 lg:p-8 space-y-5 bg-[#eeede8] min-h-screen text-sun-text font-sans">
      {/* Topbar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/10 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-sun-green-600 rounded-full flex items-center justify-center text-sun-amber-400 shrink-0 shadow-md border border-black/5">
            <MapPin size={40} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none mb-1.5">Central de Regiões</h1>
            <p className="text-[10px] font-bold text-[#6b6a64] uppercase tracking-[0.3em] opacity-80">
              Comparativo de Potencial Solar
            </p>
          </div>
        </div>
        <Link href="/" className="text-[11px] font-black uppercase tracking-[0.15em] text-sun-green-600 hover:text-sun-green-700">
          ← Voltar ao Dashboard
        </Link>
      </header>

      {/* Seção de Filtros e Busca */}
      <div className="bg-white px-4 py-3.5 rounded-lg border border-black/10 shadow-sm flex items-center gap-3">
        <Search size={20} className="text-sun-green-600" />
        <input 
          type="text" 
          placeholder="Buscar por região ou estado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent outline-none font-medium text-sun-text placeholder:text-[#6b6a64]"
        />
        <button className="flex items-center gap-2 bg-green-100 text-[#15803d] px-4 py-1.5 rounded-full font-black text-[11px] uppercase tracking-wider border border-green-200 hover:bg-green-200 transition-colors">
          <SlidersHorizontal size={16} />
          Filtros
        </button>
      </div>

      {/* Informação de Seleção */}
      {selectedSessions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <p className="font-bold text-[#15803d]">
            {selectedSessions.length} região(ões) selecionada(s) para comparação
          </p>
          <button
            onClick={handleClearSelection}
            className="flex items-center gap-2 bg-white text-[#15803d] px-3 py-1 rounded-full text-xs font-bold border border-green-200 hover:bg-green-100 transition-colors"
          >
            <X size={14} />
            Limpar
          </button>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-5">
        {/* Coluna Esquerda - Lista de Sessões */}
        <div>
          <Card className="border-black/10 shadow-md rounded-xl overflow-hidden bg-white">
            <CardContent className="p-6">
              <h2 className="text-lg font-black text-sun-text mb-4">
                Sessões de Análise
              </h2>
              <p className="text-xs text-[#6b6a64] mb-4 font-bold">
                Clique em duas regiões para comparar
              </p>
              <SessionsList
                sessions={filteredSessions}
                onSelectSession={handleSelectSession}
                selectedIds={selectedSessions}
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Comparação */}
        <div>
          {selectedSessions.length === 2 ? (
            <RegionComparison
              region1={selectedRegions[0] ? {
                id: selectedRegions[0].id,
                name: selectedRegions[0].region,
                state: selectedRegions[0].state,
                date: selectedRegions[0].date,
                viability: selectedRegions[0].viability,
                irradiation: selectedRegions[0].irradiation,
                temperature: 32,
                cloudiness: 15,
                wind: 12,
                roi: '4.2 anos'
              } : undefined}
              region2={selectedRegions[1] ? {
                id: selectedRegions[1].id,
                name: selectedRegions[1].region,
                state: selectedRegions[1].state,
                date: selectedRegions[1].date,
                viability: selectedRegions[1].viability,
                irradiation: selectedRegions[1].irradiation,
                temperature: 30,
                cloudiness: 22,
                wind: 14,
                roi: '4.8 anos'
              } : undefined}
            />
          ) : (
            <Card className="border-black/10 shadow-md rounded-xl overflow-hidden bg-white h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin size={32} className="text-sun-green-600" />
                  </div>
                  <h3 className="text-lg font-black text-sun-text mb-2">Selecione duas regiões</h3>
                  <p className="text-[#6b6a64] font-bold max-w-xs">
                    Clique em duas sessões de análise na lista ao lado para visualizar a comparação de potencial solar.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Resumo de Estatísticas */}
      <Card className="border-black/10 shadow-md rounded-xl bg-white">
        <CardContent className="p-6">
          <h2 className="text-lg font-black text-sun-text mb-4">Resumo de Regiões Analisadas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#eeede8] p-4 rounded-lg border border-black/5">
              <p className="text-xs font-bold uppercase text-[#6b6a64] mb-1">Total de Regiões</p>
              <p className="text-3xl font-black text-sun-text">{allSessions.length}</p>
            </div>
            <div className="bg-[#eeede8] p-4 rounded-lg border border-black/5">
              <p className="text-xs font-bold uppercase text-[#6b6a64] mb-1">Viabilidade Média</p>
              <p className="text-3xl font-black text-[#15803d]">
                {Math.round(allSessions.reduce((sum, s) => sum + s.viability, 0) / allSessions.length)}%
              </p>
            </div>
            <div className="bg-[#eeede8] p-4 rounded-lg border border-black/5">
              <p className="text-xs font-bold uppercase text-[#6b6a64] mb-1">Melhor Viabilidade</p>
              <p className="text-3xl font-black text-sun-green-600">
                {Math.max(...allSessions.map(s => s.viability))}%
              </p>
            </div>
            <div className="bg-[#eeede8] p-4 rounded-lg border border-black/5">
              <p className="text-xs font-bold uppercase text-[#6b6a64] mb-1">Irradiação Média</p>
              <p className="text-3xl font-black text-sun-green-600">
                {(allSessions.reduce((sum, s) => sum + s.irradiation, 0) / allSessions.length).toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}