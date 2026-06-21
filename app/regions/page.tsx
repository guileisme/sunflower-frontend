"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, Search, SlidersHorizontal, X, Satellite, Loader2,
  LayoutDashboard, Globe, Crosshair, TableProperties, Calculator, FileText, Clock, MoreHorizontal
} from "lucide-react";
import { SessionsList, type Session } from "@/components/SessionsList";
import { RegionComparison } from "@/components/RegionComparison";

// ─── Subcomponente de Navegação Híbrida ──────────────────────────────────────
function NavLink({ href, icon: Icon, label, active = false, isMobileHidden = false }: { href: string; icon: any; label: string; active?: boolean; isMobileHidden?: boolean }) {
  return (
    <Link href={href} className={`
      flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 group flex-1 md:flex-initial
      ${active
        ? "bg-sun-green-600 text-white shadow-md"
        : "text-sun-text hover:bg-black/5"}
      ${isMobileHidden ? 'hidden md:flex' : 'flex'}
    `}>
      <Icon size={16} className={`${active ? "text-sun-amber-400" : "text-sun-green-600 group-hover:scale-110"} transition-transform flex-shrink-0 sm:w-[18px] sm:h-[18px]`} />
      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap">{label}</span>
    </Link>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function RegionsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [satelliteSearch, setSatelliteSearch] = useState("");
  const [isSearchingSatellite, setIsSearchingSatellite] = useState(false);
  
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Relógio ao vivo - PADRÃO: 17 DE JUN. • 17:31
  useEffect(() => {
    const updateDateTime = () => {
      const agora = new Date();
      const diaMes = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(agora);
      const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(agora);
      
      setCurrentDateTime(`${diaMes} • ${hora}`.toUpperCase());
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

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
    <main className="w-full min-h-screen bg-[#eeede8] text-sun-text font-sans pb-10 overflow-x-hidden">
      
      {/* ── NAVBAR RESPONSIVA REFORMULADA ── */}
      <div className="relative z-50 p-3 sm:p-4 md:p-6 lg:p-8 pb-4 sm:pb-6">
        <nav className="w-full">
          <div className="max-w-full mx-auto bg-white/90 backdrop-blur-md border border-white shadow-xl rounded-3xl p-2 md:p-3 flex flex-col xl:flex-row justify-between gap-3">
            
            {/* LINHA 1 (Logo + Dossiê) */}
            <div className="flex items-center justify-between w-full xl:w-auto px-2 md:px-4 md:border-r border-black/5">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 bg-sun-green-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                  <Globe size={20} className="text-sun-amber-400" />
                </div>
                <div className="leading-none">
                  <h1 className="text-sm sm:text-lg font-black text-sun-text tracking-tighter uppercase">Regiões</h1>
                  <p className="text-[8px] sm:text-[9px] font-bold text-sun-green-600 tracking-widest uppercase">Comparativo Solar</p>
                </div>
              </div>
              
              <Link href="/relatorio" target="_blank" className="flex xl:hidden items-center gap-1.5 bg-[#1a1a1a] text-white px-3 py-2 rounded-xl shadow-md active:scale-95 shrink-0">
                <FileText size={14} className="text-sun-amber-400" />
                <span className="text-[9px] font-black uppercase tracking-widest">Dossiê</span>
              </Link>
            </div>

            {/* LINHA 2 e 3 (Menus + Relógio) */}
            <div className="flex flex-col xl:flex-row w-full xl:w-auto flex-1 items-center justify-between xl:justify-start gap-2 px-1">
              
              <div className="flex w-full xl:w-auto items-center bg-[#eeede8]/60 p-1.5 rounded-2xl gap-1 border border-black/5 justify-center md:justify-start relative">
                <NavLink href="/" icon={LayoutDashboard} label="Painel" />
                <NavLink href="/regions" icon={Globe} label="Regiões" active />
                
                <div className="hidden md:flex items-center gap-1">
                  <NavLink href="/rastreador" icon={Crosshair} label="Rastreio" />
                  <NavLink href="/mapeador" icon={MapPin} label="Mapa" />
                  <NavLink href="/simulador/economia" icon={TableProperties} label="ROI" />
                  <NavLink href="/calculadora" icon={Calculator} label="Calculadora" />
                </div>
                
                <div className="md:hidden flex-1 flex justify-center relative">
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl w-full text-sun-text hover:bg-black/5">
                    <MoreHorizontal size={16} className="text-sun-green-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Mais</span>
                  </button>
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                      <div className="absolute top-full right-0 mt-3 w-48 bg-white border border-black/10 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col gap-1" onClick={() => setIsMenuOpen(false)}>
                          <NavLink href="/rastreador" icon={Crosshair} label="Rastreio" />
                          <NavLink href="/mapeador" icon={MapPin} label="Mapa" />
                          <NavLink href="/simulador/economia" icon={TableProperties} label="ROI" />
                          <NavLink href="/calculadora" icon={Calculator} label="Calculadora" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Status Live Mobile - Centralizado */}
              <div className="xl:hidden flex w-full sm:w-auto items-center justify-center gap-3 px-4 py-2 bg-white border border-black/5 rounded-2xl shadow-inner mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-sun-text uppercase tracking-widest">Live</span>
                </div>
                <div className="w-px h-3.5 bg-black/10" />
                <div className="flex items-center gap-1.5 text-[#6b6a64]">
                  <Clock size={12} />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{currentDateTime}</span>
                </div>
              </div>
            </div>

            {/* Desktop Full Menu */}
            <div className="hidden xl:flex items-center justify-end gap-3 pr-2">
              <Link href="/relatorio" target="_blank" className="flex items-center gap-2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-2xl hover:bg-black transition-all shadow-md group shrink-0">
                <FileText size={16} className="text-sun-amber-400 group-hover:rotate-6 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Dossiê PDF</span>
              </Link>
              <div className="flex items-center gap-4 px-4 py-2.5 bg-white border border-black/5 rounded-2xl shadow-inner shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-sun-text uppercase tracking-widest">Live</span>
                </div>
                <div className="w-px h-4 bg-black/10" />
                <div className="flex items-center gap-2 text-[#6b6a64]">
                  <Clock size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{currentDateTime}</span>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Container de conteúdo com padding adaptado */}
      <div className="relative z-10 px-3 sm:px-4 md:px-6 lg:px-8 space-y-4 sm:space-y-5">
        
        {/* Seção de Filtros e Busca */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl border border-black/10 shadow-sm flex items-center gap-2 sm:gap-3">
            <Search size={18} className="text-sun-green-600 shrink-0" />
            <input 
              type="text" 
              placeholder="Filtrar regiões na lista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-0 bg-transparent outline-none font-medium text-sm sm:text-base text-sun-text placeholder:text-[#6b6a64]"
            />
            <button className="flex items-center gap-1 sm:gap-2 bg-green-100 text-[#15803d] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-black text-[9px] sm:text-[11px] uppercase tracking-wider border border-green-200 hover:bg-green-200 transition-colors shrink-0 whitespace-nowrap">
              <SlidersHorizontal size={14} className="sm:w-4 sm:h-4" />
              Filtros
            </button>
          </div>
          
          <div className="bg-white px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl border border-black/10 shadow-sm flex items-center gap-2 sm:gap-3">
            <Satellite size={18} className="text-blue-600 shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar CEP ou Cidade para nova análise..."
              value={satelliteSearch}
              onChange={(e) => setSatelliteSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSatelliteSearch()}
              className="flex-1 min-w-0 bg-transparent outline-none font-medium text-sm sm:text-base text-sun-text placeholder:text-[#6b6a64]"
            />
            <button 
              onClick={handleSatelliteSearch}
              disabled={isSearchingSatellite}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              {isSearchingSatellite ? <Loader2 className="animate-spin" size={14} /> : 'Via Satélite'}
            </button>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-4 sm:gap-5 items-start">
          
          {/* Coluna Esquerda - Lista de Sessões */}
          <div className="md:sticky md:top-8 z-10">
            <Card className="border-black/10 shadow-md rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg font-black text-sun-text">
                    Sessões de Análise
                  </h2>
                  {selectedSessions.length > 0 && (
                    <button
                      onClick={handleClearSelection}
                      className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors shrink-0"
                    >
                      <X size={12} /> Limpar
                    </button>
                  )}
                </div>
                
                <p className="text-[11px] sm:text-xs text-[#6b6a64] mb-4 font-bold">
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
              <Card className="border-black/10 shadow-md rounded-2xl bg-white h-full min-h-[400px] md:min-h-[500px] flex items-center justify-center border-dashed border-2">
                <div className="text-center p-6 sm:p-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#f9f9f7] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                     <SlidersHorizontal className="w-8 h-8 sm:w-10 sm:h-10 text-[#6b6a64] opacity-20" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-sun-text mb-2">Modo Comparativo</h3>
                  <p className="text-[10px] sm:text-xs font-bold text-[#6b6a64] uppercase tracking-[0.2em] max-w-[280px] mx-auto leading-relaxed">
                    Selecione exatamente <span className="text-sun-green-600 underline">duas cidades</span> na lista ao lado para cruzar os dados técnicos.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Resumo de Estatísticas */}
        <Card className="border-black/10 shadow-md rounded-2xl bg-white">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-black text-sun-text mb-4">Resumo de Regiões Analisadas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-[#eeede8] p-4 sm:p-5 rounded-xl border border-black/5">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1">Total de Regiões</p>
                <p className="text-2xl sm:text-3xl font-black text-sun-text">{allSessions.length}</p>
              </div>
              <div className="bg-[#eeede8] p-4 sm:p-5 rounded-xl border border-black/5">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1">Viabilidade Média</p>
                <p className="text-2xl sm:text-3xl font-black text-[#15803d]">
                  {Math.round(allSessions.reduce((sum, s) => sum + s.viability, 0) / (allSessions.length || 1))}%
                </p>
              </div>
              <div className="bg-[#eeede8] p-4 sm:p-5 rounded-xl border border-black/5">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1">Melhor Viabilidade</p>
                <p className="text-2xl sm:text-3xl font-black text-sun-green-600">
                  {Math.max(0, ...allSessions.map(s => s.viability))}%
                </p>
              </div>
              <div className="bg-[#eeede8] p-4 sm:p-5 rounded-xl border border-black/5">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1">Irradiação Média</p>
                <p className="text-2xl sm:text-3xl font-black text-sun-green-600">
                  {(allSessions.reduce((sum, s) => sum + s.irradiation, 0) / (allSessions.length || 1)).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}