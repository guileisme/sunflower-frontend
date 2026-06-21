"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sun, MapPin, Zap, Cloud, Wind, Thermometer, ShieldCheck,
  Activity, FileText, TableProperties, Crosshair,
  Globe, LayoutDashboard, Clock, Calculator, MoreHorizontal
} from "lucide-react";

import { EnergyChart } from "@/components/EnergyChart";
import { DayCurveChart } from "@/components/DayCurveChart";
import { AngularPerformancePanel } from "@/components/AngularPerformancePanel";

// ─── Subcomponentes de Interface ─────────────────────────────────────────────

function NavLink({ href, icon: Icon, label, active = false, isMobileHidden = false }: { href: string, icon: any, label: string, active?: boolean, isMobileHidden?: boolean }) {
  return (
    <Link href={href} className={`
      flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 group shrink-0
      ${active 
        ? "bg-sun-green-600 text-white shadow-md" 
        : "text-sun-text hover:bg-black/5"}
      ${isMobileHidden ? 'hidden md:flex' : 'flex'}
    `}>
      <Icon size={18} className={`${active ? "text-sun-amber-400" : "text-sun-green-600 group-hover:scale-110"} transition-transform shrink-0`} />
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </Link>
  );
}

const renderFactorIcon = (IconComponent: React.ElementType, color: string, bgColor: string, borderColor: string) => (
  <div className={`w-12 h-12 sm:w-14 sm:h-14 ${bgColor} ${borderColor} rounded-2xl flex items-center justify-center ${color} border shadow-sm shrink-0 transition-all`}>
    <IconComponent size={24} className="sm:size-7.5" strokeWidth={2.5} />
  </div>
);

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function SunflowerDashboard() {
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const updateDateTime = () => {
      const agora = new Date();
      setCurrentDateTime(new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      }).format(agora).replace(",", " •").toUpperCase());
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const fatores = [
    { name: "Irradiação global", val: "Alta", icon: Sun, color: "text-sun-green-600", bgColor: "bg-green-100/50", borderColor: "border-green-200", barBg: "bg-green-100", barFill: "bg-sun-green-600", width: "w-[90%]" },
    { name: "Nebulosidade", val: "Baixa", icon: Cloud, color: "text-blue-600", bgColor: "bg-blue-100/50", borderColor: "border-blue-200", barBg: "bg-blue-100", barFill: "bg-blue-600", width: "w-[15%]" },
    { name: "Sombreamento", val: "Mínimo", icon: ShieldCheck, color: "text-emerald-600", bgColor: "bg-emerald-100/50", borderColor: "border-emerald-200", barBg: "bg-emerald-100", barFill: "bg-emerald-600", width: "w-[8%]" },
    { name: "Temperatura", val: "32°C", icon: Thermometer, color: "text-orange-600", bgColor: "bg-orange-100/50", borderColor: "border-orange-200", barBg: "bg-orange-100", barFill: "bg-orange-600", width: "w-[72%]" },
    { name: "Vento", val: "12 km/h", icon: Wind, color: "text-teal-600", bgColor: "bg-teal-100/50", borderColor: "border-teal-200", barBg: "bg-teal-100", barFill: "bg-teal-600", width: "w-[30%]" },
    { name: "ROI estimado", val: "4.2 anos", icon: Activity, color: "text-indigo-600", bgColor: "bg-indigo-100/50", borderColor: "border-indigo-200", barBg: "bg-indigo-100", barFill: "bg-indigo-600", width: "w-[85%]" },
  ];

  return (
    <main className="w-full p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-5 bg-[#eeede8] min-h-screen text-sun-text font-sans pb-10">
      
      {/* ── NAVBAR RESPONSIVA ── */}
      <nav className="w-full mb-6 md:mb-8">
        <div className="max-w-full mx-auto bg-white/90 backdrop-blur-md border border-white shadow-xl rounded-3xl p-2 flex flex-col xl:flex-row items-center justify-between gap-3 xl:gap-4">
          
          {/* Lado Esquerdo: Identidade Visual */}
          <div className="flex items-center justify-between w-full xl:w-auto px-2 md:px-4 border-b xl:border-b-0 xl:border-r border-black/5 pb-2 xl:pb-0 shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 bg-sun-green-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 transition-transform hover:rotate-0 shrink-0">
                <Zap size={22} className="text-sun-amber-400" fill="currentColor" />
              </div>
              <div className="leading-none">
                <h1 className="text-base sm:text-lg font-black text-sun-text tracking-tighter">SUNFLOWER</h1>
                <p className="text-[8px] sm:text-[9px] font-bold text-sun-green-600 tracking-widest uppercase">Solar Analytics</p>
              </div>
            </div>

            {/* Ação de Relatório (Visível apenas no Mobile ao lado do Logo para poupar espaço) */}
            <Link href="/relatorio" target="_blank" className="flex xl:hidden items-center gap-2 bg-sun-text text-white px-3 py-2 rounded-xl hover:bg-black transition-all shadow-md active:scale-95 group shrink-0">
              <FileText size={14} className="text-sun-amber-400 group-hover:rotate-6 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Dossiê</span>
            </Link>
          </div>

          {/* Centro: Menu de Navegação Híbrido (Mobile = Mais... / Desktop = Completo) */}
          <div className="flex flex-wrap items-center bg-[#eeede8]/60 p-1.5 rounded-2xl gap-1 border border-black/5 w-full xl:w-auto justify-center xl:justify-start">
            <NavLink href="/" icon={LayoutDashboard} label="Painel" active />
            <NavLink href="/calculadora" icon={Calculator} label="Calculadora" />
            
            {/* Opções visíveis apenas em telas médias para cima */}
            <NavLink href="/rastreador" icon={Crosshair} label="Rastreio" isMobileHidden />
            <NavLink href="/mapeador" icon={MapPin} label="Mapa" isMobileHidden />
            <NavLink href="/regions" icon={Globe} label="Regiões" isMobileHidden />
            <NavLink href="/simulador/economia" icon={TableProperties} label="ROI" isMobileHidden />
            
            {/* Menu Dropdown de Opções (Visível APENAS no mobile/tablet) */}
            <div className="relative md:hidden block">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 text-sun-text hover:bg-black/5 ${isMenuOpen ? 'bg-black/5' : ''}`}
              >
                <MoreHorizontal size={18} className="text-sun-green-600 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider">Mais</span>
              </button>
              
              {/* Dropdown Content */}
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-48 bg-white border border-black/5 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right sm:origin-top">
                    <div onClick={() => setIsMenuOpen(false)} className="space-y-1">
                      <NavLink href="/rastreador" icon={Crosshair} label="Rastreio" />
                      <NavLink href="/mapeador" icon={MapPin} label="Mapa" />
                      <NavLink href="/regions" icon={Globe} label="Regiões" />
                      <NavLink href="/simulador/economia" icon={TableProperties} label="ROI" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lado Direito: Ação de Relatório e Status (Desktop) */}
          <div className="flex items-center justify-center md:justify-end gap-2 md:gap-3 pr-2 flex-wrap w-full xl:w-auto mt-2 xl:mt-0">
            <Link href="/relatorio" target="_blank" className="hidden xl:flex items-center gap-2 bg-sun-text text-white px-5 py-2.5 rounded-2xl hover:bg-black transition-all shadow-md active:scale-95 group shrink-0">
              <FileText size={16} className="text-sun-amber-400 group-hover:rotate-6 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Dossiê PDF</span>
            </Link>

            <div className="flex items-center justify-center gap-3 sm:gap-4 px-3 sm:px-4 py-2 bg-white border border-black/5 rounded-2xl shadow-inner w-full sm:w-auto whitespace-nowrap">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-sun-text uppercase tracking-widest">Live</span>
              </div>
              <div className="w-px h-4 bg-black/10 shrink-0" />
              <div className="flex items-center gap-1.5 text-[#6b6a64] shrink-0">
                <Clock size={14} className="shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest">{currentDateTime}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── BARRA DE LOCALIZAÇÃO ── */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 bg-white px-4 py-3 sm:py-4 rounded-2xl border border-black/10 shadow-sm">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-sun-green-600 shrink-0" />
          <span className="font-black text-sun-text text-sm sm:text-base whitespace-nowrap">Belo Jardim, PE, Brasil</span>
        </div>
        
        <div className="hidden md:block text-black/10 font-black">|</div>
        
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 font-black text-[#15803d] text-[11px] sm:text-sm tracking-tight">
          <span>lat -8.33°</span>
          <span className="text-black/10 hidden sm:inline">·</span>
          <span>lon -36.42°</span>
          <span className="text-black/10 hidden sm:inline">·</span>
          <span>alt 768 m</span>
        </div>
        
        <span className="md:ml-auto self-start md:self-center bg-green-100 text-[#15803d] px-3 py-1 sm:px-4 sm:py-1.5 rounded-full font-black text-[9px] sm:text-[11px] uppercase tracking-wider border border-green-200 whitespace-nowrap">
          Semiárido nordestino
        </span>
      </div>

      {/* ── VERDICT CARD ── */}
      <Card className="border-black/10 shadow-md rounded-xl overflow-hidden bg-white">
        <CardContent className="p-5 sm:p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-sun-green-600 rounded-full flex items-center justify-center text-sun-amber-400 shrink-0 shadow-lg">
            <Zap size={40} className="md:size-14" fill="currentColor" />
          </div>
          <div className="flex-1 space-y-2 md:space-y-3 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-black text-sun-text">Ótimo para instalação solar!</h2>
            <p className="text-sm md:text-[16px] font-bold text-[#4a4944] leading-relaxed max-w-2xl">
              Esta região apresenta alta irradiação, baixa nebulosidade e ângulos favoráveis. A instalação de painéis definitivos tem alto retorno potencial no Agreste.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end shrink-0 bg-green-50/50 p-5 md:p-6 rounded-2xl border border-green-100/50 w-full md:w-auto">
            <span className="text-5xl md:text-6xl font-black text-[#15803d] leading-none tracking-tighter">84</span>
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-[#6b6a64] mt-2 md:mt-3">viabilidade / 100</span>
            <div className="w-full md:w-40 h-2 md:h-2.5 mt-3 bg-white rounded-full overflow-hidden shadow-inner border border-black/5">
              <div className="bg-[#15803d] h-full w-[84%]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Energia hoje", val: "6.4", unit: "kWh / m²", delta: "+12% vs. média" },
          { label: "Pico", val: "891", unit: "W/m² às 11h42", delta: "Dia excelente" },
          { label: "Horas sol", val: "9.1", unit: "h estimadas", delta: "Acima da média" },
          { label: "Eficiência", val: "94%", unit: "captação atual", delta: "Rastreio ativo" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-black/5 p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-center">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-[#6b6a64] mb-1 truncate">{kpi.label}</p>
            <h3 className="text-2xl sm:text-3xl font-black text-sun-text">{kpi.val}</h3>
            <p className="text-xs sm:text-[14px] font-extrabold text-[#15803d] mt-1 mb-2 truncate">{kpi.unit}</p>
            <p className="text-[9px] sm:text-[11px] font-bold text-[#15803d] bg-green-100/50 self-start px-2 py-0.5 rounded-md border border-green-200/50 truncate max-w-full">{kpi.delta}</p>
          </div>
        ))}
      </div>

      {/* ── SEÇÃO DE GRÁFICOS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.6fr] gap-4 sm:gap-5">
        <Card className="border-black/5 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
              <h3 className="text-[10px] sm:text-[12px] uppercase font-black text-sun-text tracking-[0.2em] text-center sm:text-left">Produção de Energia</h3>
              <div className="flex flex-wrap justify-center gap-1 border border-black/5 rounded-full p-1 bg-[#eeede8]/50">
                {["Hoje", "Semana", "Mês", "Ano"].map((label, idx) => (
                  <button key={label} className={`text-[9px] sm:text-[11px] px-3 sm:px-5 py-1.5 sm:py-2 rounded-full font-black transition-all uppercase tracking-wider flex-1 sm:flex-none ${idx === 0 ? "bg-sun-green-600 text-white shadow-md" : "text-[#6b6a64] hover:bg-black/5"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full overflow-x-auto min-h-62.5">
              <div className="min-w-100">
                 <EnergyChart />
              </div>
            </div>
          </CardContent>
        </Card>
        <AngularPerformancePanel />
      </div>

      {/* ── FATORES DE VIABILIDADE ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fatores.map((f, i) => (
          <div key={i} className="bg-white border border-black/5 p-3 sm:p-4 rounded-xl shadow-sm flex items-center gap-4 sm:gap-5">
            {renderFactorIcon(f.icon, f.color, f.bgColor, f.borderColor)}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] sm:text-[11px] uppercase font-black tracking-widest text-[#6b6a64] mb-0.5 truncate">{f.name}</p>
              <p className={`text-lg sm:text-xl font-black mb-1.5 sm:mb-2 ${f.color}`}>{f.val}</p>
              <div className={`h-1.5 ${f.barBg} rounded-full overflow-hidden`}>
                <div className={`h-full ${f.barFill} ${f.width}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CURVA DE IRRADIAÇÃO ── */}
      <Card className="border-black/5 shadow-sm rounded-xl bg-white overflow-hidden">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6 sm:mb-8">
            <h3 className="text-[10px] sm:text-[12px] uppercase font-black text-sun-text tracking-[0.2em] text-center sm:text-left">Irradiação ao longo do dia (W/m²)</h3>
            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-[#15803d] bg-green-50 px-3 sm:px-4 py-1.5 rounded-full border border-green-200">Curva de captação — hoje</span>
          </div>
          <div className="w-full overflow-x-auto min-h-62.5">
             <div className="min-w-100">
                <DayCurveChart />
             </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}