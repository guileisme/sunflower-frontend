"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sun, MapPin, Zap, Cloud, Wind, Thermometer, ShieldCheck, Activity, Calculator, FileText 
} from "lucide-react";

import { EnergyChart } from "@/components/EnergyChart";
import { DayCurveChart } from "@/components/DayCurveChart";
import { AngularPerformancePanel } from "@/components/AngularPerformancePanel"; 

// Função auxiliar para renderizar os ícones com cores dinâmicas
const renderFactorIcon = (IconComponent: React.ElementType, color: string, bgColor: string, borderColor: string) => (
  <div className={`w-14 h-14 ${bgColor} ${borderColor} rounded-2xl flex items-center justify-center ${color} border shadow-sm shrink-0 transition-all`}>
    <IconComponent size={30} strokeWidth={2.5} />
  </div>
);

export default function SunflowerDashboard() {
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const agora = new Date();
      const formatada = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(agora);
      setCurrentDateTime(formatada.replaceAll(" de ", ". ").replace(",", " ·"));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fatores = [
    { 
      name: "Irradiação global", val: "Alta", icon: Sun, 
      color: "text-sun-green-600", bgColor: "bg-green-100/50", borderColor: "border-green-200", 
      barBg: "bg-green-100", barFill: "bg-sun-green-600", width: "w-[90%]" 
    },
    { 
      name: "Nebulosidade", val: "Baixa", icon: Cloud, 
      color: "text-blue-600", bgColor: "bg-blue-100/50", borderColor: "border-blue-200", 
      barBg: "bg-blue-100", barFill: "bg-blue-600", width: "w-[15%]" 
    },
    { 
      name: "Sombreamento", val: "Mínimo", icon: ShieldCheck, 
      color: "text-emerald-600", bgColor: "bg-emerald-100/50", borderColor: "border-emerald-200", 
      barBg: "bg-emerald-100", barFill: "bg-emerald-600", width: "w-[8%]" 
    },
    { 
      name: "Temperatura", val: "32°C", icon: Thermometer, 
      color: "text-orange-600", bgColor: "bg-orange-100/50", borderColor: "border-orange-200", 
      barBg: "bg-orange-100", barFill: "bg-orange-600", width: "w-[72%]" 
    },
    { 
      name: "Vento", val: "12 km/h", icon: Wind, 
      color: "text-teal-600", bgColor: "bg-teal-100/50", borderColor: "border-teal-200", 
      barBg: "bg-teal-100", barFill: "bg-teal-600", width: "w-[30%]" 
    },
    { 
      name: "ROI estimado", val: "4.2 anos", icon: Activity, 
      color: "text-indigo-600", bgColor: "bg-indigo-100/50", borderColor: "border-indigo-200", 
      barBg: "bg-indigo-100", barFill: "bg-indigo-600", width: "w-[85%]" 
    },
  ];

  return (
    <main className="w-full p-4 md:p-6 lg:p-8 space-y-5 bg-[#eeede8] min-h-screen text-sun-text font-sans">
      
      {/* ── Topbar ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/10 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-sun-green-600 rounded-full flex items-center justify-center text-sun-amber-400 shrink-0 shadow-md border border-black/5">
            <Sun size={40} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none mb-1.5">Sunflower</h1>
            <p className="text-[10px] font-bold text-[#6b6a64] uppercase tracking-[0.3em] opacity-80">
              Análise de Viabilidade Solar
            </p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-3">
          
          {/* Botão Gerar Dossiê PDF */}
            <Link 
            href="/relatorio" 
            target="_blank" 
            className="group relative flex items-center gap-2 bg-sun-text hover:bg-black text-white px-5 py-2.5 rounded-full shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 hover:ring-2 hover:ring-offset-2 hover:ring-sun-text/60 active:scale-95 active:translate-y-0"
          >
            <FileText size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:text-sun-amber-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">Gerar Dossiê PDF</span>
          </Link>

          {/* Botão do Simulador ROI */}
          <Link 
            href="/simulador/economia" 
            className="group relative flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/20 hover:ring-2 hover:ring-offset-2 hover:ring-indigo-600/60 active:scale-95 active:translate-y-0"
          >
            <Calculator size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:text-sun-amber-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">Simulador ROI</span>
          </Link>

          {/* Botão Central de Regiões */}
          <Link 
            href="/regions" 
            className="group relative flex items-center gap-2.5 bg-white border border-black/10 px-5 py-2.5 rounded-full shadow-sm hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 hover:ring-2 hover:ring-offset-2 hover:ring-slate-200 active:scale-95 active:translate-y-0"
          >
            <MapPin size={16} className="text-sun-green-600 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:text-sun-amber-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-sun-text">Central de Regiões</span>
          </Link>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2.5 bg-white border border-black/10 px-5 py-2.5 rounded-full shadow-sm">
            <div className="w-2.5 h-2.5 bg-sun-green-context rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-sun-text">Coletando dados</span>
          </div>
          
          {/* Relógio Real-time */}
          <div className="bg-white border border-black/10 px-5 py-2.5 rounded-full shadow-sm min-w-50 text-center">
            <span className="text-[11px] font-black text-sun-text/80 tracking-wide uppercase">{currentDateTime || "Sincronizando..."}</span>
          </div>
        </div>
      </header>

      {/* ── Location Bar ── */}
      <div className="flex items-center gap-2 bg-white px-4 py-3.5 rounded-lg border border-black/10 shadow-sm">
        <MapPin size={22} className="text-sun-green-600" />
        <span className="font-black text-sun-text text-base">Belo Jardim, PE, Brasil</span>
        <span className="text-black/10 mx-2 font-black">|</span> 
        <span className="font-black text-[#15803d] text-sm tracking-tight">
          lat -8.33° <span className="text-black/10 mx-1.5">·</span> lon -36.42° <span className="text-black/10 mx-1.5">·</span> alt 768 m
        </span>
        <span className="ml-auto bg-green-100 text-[#15803d] px-4 py-1.5 rounded-full font-black text-[11px] uppercase tracking-wider border border-green-200">
          Semiárido nordestino
        </span>
      </div>

      {/* ── Verdict Card ── */}
      <Card className="border-black/10 shadow-md rounded-xl overflow-hidden bg-white">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 bg-sun-green-600 rounded-full flex items-center justify-center text-sun-amber-400 shrink-0 shadow-lg">
             <Zap size={56} fill="currentColor" />
          </div>
          <div className="flex-1 space-y-3 text-center md:text-left">
            <h2 className="text-2xl font-black text-sun-text">Ótimo para instalação solar!</h2>
            <p className="text-[16px] font-bold text-[#4a4944] leading-relaxed max-w-2xl">
              Esta região apresenta alta irradiação, baixa nebulosidade e ângulos favoráveis. A instalação de painéis definitivos tem alto retorno potencial no Agreste.
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0 bg-green-50/50 p-6 rounded-2xl border border-green-100/50">
            <span className="text-6xl font-black text-[#15803d] leading-none tracking-tighter">84</span>
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6b6a64] mt-3">viabilidade / 100</span>
            <div className="w-40 h-2.5 mt-3 bg-white rounded-full overflow-hidden shadow-inner border border-black/5">
              <div className="bg-[#15803d] h-full w-[84%]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Energia captada hoje", val: "6.4", unit: "kWh / m²", delta: "+12% vs. média local" },
          { label: "Irradiação pico", val: "891", unit: "W/m² às 11h42", delta: "Alta — dia excelente" },
          { label: "Horas de sol pleno", val: "9.1", unit: "h estimadas hoje", delta: "Acima da média nacional" },
          { label: "Eficiência de rastreio", val: "94%", unit: "captação atual", delta: "Rastreio biaxial ativo" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-black/5 p-5 rounded-xl shadow-sm flex flex-col justify-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#6b6a64] mb-1">{kpi.label}</p>
            <h3 className="text-3xl font-black text-sun-text">{kpi.val}</h3>
            <p className="text-[14px] font-extrabold text-[#15803d] mt-1 mb-2">{kpi.unit}</p>
            <p className="text-[11px] font-bold text-[#15803d] bg-green-100/50 self-start px-2 py-0.5 rounded-md border border-green-200/50">{kpi.delta}</p>
          </div>
        ))}
      </div>

      {/* ── Main Charts Grid (Seção de Auditoria Técnica) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-5">
        <Card className="border-black/5 shadow-sm rounded-xl bg-white">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[12px] uppercase font-black text-sun-text tracking-[0.2em]">Produção de Energia</h3>
              <div className="flex gap-1 border border-black/5 rounded-full p-1 bg-[#eeede8]/50">
                {["Hoje", "Semana", "Mês", "Ano"].map((label, idx) => (
                  <button key={label} className={`text-[11px] px-5 py-2 rounded-full font-black transition-all uppercase tracking-wider ${idx === 0 ? 'bg-sun-green-600 text-white shadow-md' : 'text-[#6b6a64] hover:bg-black/5'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <EnergyChart />
          </CardContent>
        </Card>

        {/* Painel de Auditoria Angular ocupando o lugar da bússola */}
        <AngularPerformancePanel />
      </div>

      {/* ── Fatores de Viabilidade ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {fatores.map((f, i) => (
          <div key={i} className="bg-white border border-black/5 p-4 rounded-xl shadow-sm flex items-center gap-5">
            {renderFactorIcon(f.icon, f.color, f.bgColor, f.borderColor)}
            <div className="flex-1">
              <p className="text-[11px] uppercase font-black tracking-widest text-[#6b6a64] mb-0.5">{f.name}</p>
              <p className={`text-xl font-black mb-2 ${f.color}`}>{f.val}</p>
              <div className={`h-1.5 ${f.barBg} rounded-full overflow-hidden`}>
                <div className={`h-full ${f.barFill} ${f.width}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Curva de Irradiação ── */}
      <Card className="border-black/5 shadow-sm rounded-xl bg-white">
        <CardContent className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[12px] uppercase font-black text-sun-text tracking-[0.2em]">Irradiação ao longo do dia (W/m²)</h3>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#15803d] bg-green-50 px-4 py-1.5 rounded-full border border-green-200">Curva de captação — hoje</span>
          </div>
          <DayCurveChart />
        </CardContent>
      </Card>

    </main>
  );
}