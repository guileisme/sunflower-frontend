"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, SlidersHorizontal, X, Satellite, Loader2 } from "lucide-react";
import { SessionsList, type Session } from "@/components/SessionsList";
import { RegionComparison } from "@/components/RegionComparison";

export default function RegionsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [satelliteSearch, setSatelliteSearch] = useState("");
  const [isSearchingSatellite, setIsSearchingSatellite] = useState(false);

  // Dados de exemplo - em produção as novas buscas são adicionadas a esta lista
  const [allSessions, setAllSessions] = useState<Session[]>([
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
  ]);

  const handleSatelliteSearch = async () => {
    if (!satelliteSearch.trim()) return;
    
    setIsSearchingSatellite(true);
    try {
      // 1. Geocoding via Nominatim 
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(satelliteSearch)}&format=json&limit=1&email=contato@sunflowersolar.com`);
      const geoData = await geoRes.json();
      
      if (!geoData || geoData.length === 0) {
        alert("Endereço não encontrado.");
        setIsSearchingSatellite(false);
        return;
      }
      
      const { lat, lon, display_name } = geoData[0];
      const addressParts = display_name.split(", ");
      const region = addressParts[0];
      const state = addressParts.length > 2 ? addressParts[addressParts.length - 2] : "BR";

      // 2. Weather & Solar via Open-Meteo
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,cloud_cover,wind_speed_10m&daily=shortwave_radiation_sum&timezone=auto`);
      const weatherData = await weatherRes.json();
      
      const current = weatherData.current || {};
      const daily = weatherData.daily || {};
      
      const temperature = current.temperature_2m || 30;
      const cloudiness = current.cloud_cover || 20;
      const wind = current.wind_speed_10m || 10;
      
      let irradiation = 5.5; 
      if (daily.shortwave_radiation_sum && daily.shortwave_radiation_sum.length > 0) {
        // MJ/m² to kWh/m² conversion
        irradiation = Number((daily.shortwave_radiation_sum[0] / 3.6).toFixed(1));
      }
      
      let viability = 70;
      let status: Session['status'] = 'good';
      
      if (irradiation > 6.5) { viability = Math.floor(Math.random() * 10) + 90; status = 'excellent'; }
      else if (irradiation > 5.0) { viability = Math.floor(Math.random() * 15) + 75; status = 'good'; }
      else if (irradiation > 4.0) { viability = Math.floor(Math.random() * 15) + 60; status = 'moderate'; }
      else { viability = Math.floor(Math.random() * 20) + 40; status = 'poor'; }

      const newSession: Session = {
        id: Date.now().toString(),
        region,
        state,
        date: new Date().toLocaleDateString('pt-BR'),
        viability,
        irradiation,
        status,
        temperature,
        cloudiness,
        wind
      };

      setAllSessions(prev => [newSession, ...prev]);
      setSatelliteSearch("");
      
    } catch (error) {
      console.error(error);
      alert("Erro ao buscar dados do satélite. Tente novamente mais tarde.");
    } finally {
      setIsSearchingSatellite(false);
    }
  };

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
    <main className="w-full p-4 md:p-6 lg:p-8 space-y-5 bg-[#eeede8] min-h-screen text-sun-text font-sans pb-10">
      
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white px-4 py-3.5 rounded-2xl border border-black/10 shadow-sm flex items-center gap-3">
          <Search size={20} className="text-sun-green-600" />
          <input 
            type="text" 
            placeholder="Filtrar regiões na lista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none font-medium text-sun-text placeholder:text-[#6b6a64]"
          />
          <button className="flex items-center gap-2 bg-green-100 text-[#15803d] px-4 py-1.5 rounded-full font-black text-[11px] uppercase tracking-wider border border-green-200 hover:bg-green-200 transition-colors">
            <SlidersHorizontal size={16} />
            Filtros
          </button>
        </div>
        
        <div className="bg-white px-4 py-3.5 rounded-2xl border border-black/10 shadow-sm flex items-center gap-3">
          <Satellite size={20} className="text-blue-600" />
          <input 
            type="text" 
            placeholder="Buscar CEP ou Cidade para nova análise..."
            value={satelliteSearch}
            onChange={(e) => setSatelliteSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSatelliteSearch()}
            className="flex-1 bg-transparent outline-none font-medium text-sun-text placeholder:text-[#6b6a64]"
          />
          <button 
            onClick={handleSatelliteSearch}
            disabled={isSearchingSatellite}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50"
          >
            {isSearchingSatellite ? <Loader2 className="animate-spin" size={14} /> : 'Via Satélite'}
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-5 items-start">
        
        {/* Coluna Esquerda - Lista de Sessões */}
        <div className="md:sticky md:top-8 z-10">
          <Card className="border-black/10 shadow-md rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-sun-text">
                  Sessões de Análise
                </h2>
                {selectedSessions.length > 0 && (
                  <button
                    onClick={handleClearSelection}
                    className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors"
                  >
                    <X size={12} /> Limpar
                  </button>
                )}
              </div>
              
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
        <div className="w-full">
          {selectedSessions.length === 2 ? (
            <RegionComparison
              region1={selectedRegions[0] ? {
                id: selectedRegions[0].id,
                name: selectedRegions[0].region,
                state: selectedRegions[0].state,
                date: selectedRegions[0].date,
                viability: selectedRegions[0].viability,
                irradiation: selectedRegions[0].irradiation,
                temperature: selectedRegions[0].temperature ?? 32,
                cloudiness: selectedRegions[0].cloudiness ?? 15,
                wind: selectedRegions[0].wind ?? 12,
                roi: '4.2 anos'
              } : undefined}
              region2={selectedRegions[1] ? {
                id: selectedRegions[1].id,
                name: selectedRegions[1].region,
                state: selectedRegions[1].state,
                date: selectedRegions[1].date,
                viability: selectedRegions[1].viability,
                irradiation: selectedRegions[1].irradiation,
                temperature: selectedRegions[1].temperature ?? 30,
                cloudiness: selectedRegions[1].cloudiness ?? 22,
                wind: selectedRegions[1].wind ?? 14,
                roi: '4.8 anos'
              } : undefined}
            />
          ) : (
            <Card className="border-black/10 shadow-md rounded-2xl bg-white h-full min-h-125 flex items-center justify-center border-dashed border-2">
              <div className="text-center p-10">
                <div className="w-20 h-20 bg-[#f9f9f7] rounded-full flex items-center justify-center mx-auto mb-6">
                   <SlidersHorizontal size={40} className="text-[#6b6a64] opacity-20" />
                </div>
                <h3 className="text-xl font-black text-sun-text mb-2">Modo Comparativo</h3>
                <p className="text-xs font-bold text-[#6b6a64] uppercase tracking-[0.2em] max-w-70 mx-auto leading-relaxed">
                  Selecione exatamente <span className="text-sun-green-600 underline">duas cidades</span> na lista ao lado para cruzar os dados técnicos.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Resumo de Estatísticas */}
      <Card className="border-black/10 shadow-md rounded-2xl bg-white">
        <CardContent className="p-6">
          <h2 className="text-lg font-black text-sun-text mb-4">Resumo de Regiões Analisadas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#eeede8] p-5 rounded-xl border border-black/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1">Total de Regiões</p>
              <p className="text-3xl font-black text-sun-text">{allSessions.length}</p>
            </div>
            <div className="bg-[#eeede8] p-5 rounded-xl border border-black/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1">Viabilidade Média</p>
              <p className="text-3xl font-black text-[#15803d]">
                {Math.round(allSessions.reduce((sum, s) => sum + s.viability, 0) / allSessions.length)}%
              </p>
            </div>
            <div className="bg-[#eeede8] p-5 rounded-xl border border-black/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1">Melhor Viabilidade</p>
              <p className="text-3xl font-black text-sun-green-600">
                {Math.max(...allSessions.map(s => s.viability))}%
              </p>
            </div>
            <div className="bg-[#eeede8] p-5 rounded-xl border border-black/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1">Irradiação Média</p>
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