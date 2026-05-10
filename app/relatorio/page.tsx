"use client";

import React, { useEffect, useState } from 'react';
import { 
  Printer, MapPin, Zap, Activity, Sun, BarChart3, Crosshair, 
  Cloud, ShieldCheck, Thermometer, Wind 
} from 'lucide-react';
import { EnergyChart } from "@/components/EnergyChart";
import { DayCurveChart } from "@/components/DayCurveChart";
import { AngularPerformancePanel } from "@/components/AngularPerformancePanel";

// Função auxiliar para renderizar os ícones com cores dinâmicas no relatório
const renderFactorIcon = (IconComponent: React.ElementType, color: string, bgColor: string, borderColor: string) => (
  <div className={`w-12 h-12 ${bgColor} ${borderColor} rounded-xl flex items-center justify-center ${color} border shrink-0`}>
    <IconComponent size={24} strokeWidth={2.5} />
  </div>
);

export default function RelatorioTecnico() {
  const [dataEmissao, setDataEmissao] = useState("");

  useEffect(() => {
    const hoje = new Date();
    setDataEmissao(new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(hoje));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Definição dos fatores ambientais
  const fatores = [
    { name: "Irradiação global", val: "Alta", icon: Sun, color: "text-sun-green-600", bgColor: "bg-green-100/50", borderColor: "border-green-200", barBg: "bg-green-100", barFill: "bg-sun-green-600", width: "w-[90%]" },
    { name: "Nebulosidade", val: "Baixa", icon: Cloud, color: "text-blue-600", bgColor: "bg-blue-100/50", borderColor: "border-blue-200", barBg: "bg-blue-100", barFill: "bg-blue-600", width: "w-[15%]" },
    { name: "Sombreamento", val: "Mínimo", icon: ShieldCheck, color: "text-emerald-600", bgColor: "bg-emerald-100/50", borderColor: "border-emerald-200", barBg: "bg-emerald-100", barFill: "bg-emerald-600", width: "w-[8%]" },
    { name: "Temperatura", val: "32°C", icon: Thermometer, color: "text-orange-600", bgColor: "bg-orange-100/50", borderColor: "border-orange-200", barBg: "bg-orange-100", barFill: "bg-orange-600", width: "w-[72%]" },
    { name: "Vento", val: "12 km/h", icon: Wind, color: "text-teal-600", bgColor: "bg-teal-100/50", borderColor: "border-teal-200", barBg: "bg-teal-100", barFill: "bg-teal-600", width: "w-[30%]" },
    { name: "ROI estimado", val: "4.2 anos", icon: Activity, color: "text-indigo-600", bgColor: "bg-indigo-100/50", borderColor: "border-indigo-200", barBg: "bg-indigo-100", barFill: "bg-indigo-600", width: "w-[85%]" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 py-10 flex justify-center text-slate-800 font-sans print:p-0 print:bg-white">
      
      {/* Botão de Imprimir */}
      <button 
        onClick={handlePrint}
        className="group print:hidden fixed top-6 right-6 bg-sun-text hover:bg-black text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20 hover:ring-2 hover:ring-offset-2 hover:ring-sun-text/60 active:scale-95 active:translate-y-0 font-black uppercase tracking-widest text-xs z-50"
      >
        <Printer size={18} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:text-sun-amber-400" />
        Salvar como PDF
      </button>

      {/* Contêiner da Página A4 */}
      <div className="bg-white w-full max-w-[21cm] shadow-2xl print:shadow-none p-12 md:p-16 flex flex-col relative border border-slate-200 print:border-none">
        
        {/* ── CABEÇALHO DO DOSSIÊ ── */}
        <header className="border-b-2 border-slate-200 pb-8 mb-8 flex justify-between items-end">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-sun-green-600 rounded-full flex items-center justify-center text-sun-amber-400 shrink-0 print:bg-green-700">
              <Sun size={32} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sunflower</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Dossiê Técnico de Viabilidade</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Documento Oficial</p>
            <p className="text-sm font-bold text-slate-800">ID: SF-2026-0424-PE</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Emitido em: {dataEmissao}</p>
          </div>
        </header>

        {/* ── SEÇÃO 1: DADOS DO LOCAL ── */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="text-xs font-black text-[#15803d] uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <MapPin size={16} /> 01. Coordenadas e Localização
          </h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Local</p>
              <p className="text-lg font-black text-slate-800">Belo Jardim, PE - Brasil</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Classificação Climática</p>
              <p className="text-lg font-black text-slate-800">Semiárido Nordestino</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Coordenadas</p>
              <p className="text-sm font-bold text-slate-600">Lat: -8.33° / Lon: -36.42°</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Altitude</p>
              <p className="text-sm font-bold text-slate-600">768 metros</p>
            </div>
          </div>
        </section>

        {/* ── SEÇÃO 2: VEREDITO ── */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="text-xs font-black text-[#15803d] uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <Zap size={16} /> 02. Índice de Viabilidade (Score)
          </h2>
          <div className="flex items-center gap-8 bg-green-50/50 border border-green-100 p-6 rounded-xl">
            <div className="text-center shrink-0">
              <span className="text-7xl font-black text-[#15803d] leading-none">84</span>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d]/70 mt-2">Score / 100</p>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Ótimo para instalação solar</h3>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                As medições locais indicam um P90 altamente favorável. A região apresenta alta irradiação e baixa nebulosidade, com eficiência superior garantida pelo rastreamento biaxial monitorado.
              </p>
            </div>
          </div>
        </section>

        {/* ── SEÇÃO 3: MÉTRICAS CHAVE ── */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="text-xs font-black text-[#15803d] uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <Activity size={16} /> 03. Resumo de Captação
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-slate-200 p-4 rounded-lg">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Energia Média Diária</p>
              <p className="text-2xl font-black text-slate-800 mt-1">6.4 <span className="text-sm">kWh/m²</span></p>
            </div>
            <div className="border border-slate-200 p-4 rounded-lg">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Horas de Sol Pleno</p>
              <p className="text-2xl font-black text-slate-800 mt-1">9.1 <span className="text-sm">h/dia</span></p>
            </div>
            <div className="border border-slate-200 p-4 rounded-lg">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Eficiência de Rastreio</p>
              <p className="text-2xl font-black text-slate-800 mt-1">94% <span className="text-sm">Biaxial</span></p>
            </div>
          </div>
        </section>

        {/* ── SEÇÃO 4: FATORES DE ANÁLISE (NOVO) ── */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="text-xs font-black text-[#15803d] uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <Cloud size={16} /> 04. Fatores Ambientais e Climáticos
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {fatores.map((f, i) => (
              <div key={i} className="bg-white border border-slate-200 p-3 rounded-lg flex items-center gap-3">
                {renderFactorIcon(f.icon, f.color, f.bgColor, f.borderColor)}
                <div className="flex-1 overflow-hidden">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-0.5 truncate">{f.name}</p>
                  <p className={`text-lg font-black mb-1.5 leading-none ${f.color}`}>{f.val}</p>
                  <div className={`h-1.5 ${f.barBg} rounded-full overflow-hidden`}>
                    <div className={`h-full ${f.barFill} ${f.width}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SEÇÃO 5: GRÁFICOS DE DESEMPENHO ── */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="text-xs font-black text-[#15803d] uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <BarChart3 size={16} /> 05. Análise Gráfica de Captação
          </h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="border border-slate-200 p-6 rounded-xl">
              <h3 className="text-[11px] uppercase font-black text-slate-800 tracking-[0.2em] mb-4">
                Irradiação ao longo do dia (W/m²)
              </h3>
              <div className="h-48 print:h-56">
                <DayCurveChart />
              </div>
            </div>

            <div className="border border-slate-200 p-6 rounded-xl print:break-inside-avoid mt-4">
              <h3 className="text-[11px] uppercase font-black text-slate-800 tracking-[0.2em] mb-4">
                Histórico de Produção de Energia (kWh)
              </h3>
              <div className="h-48 print:h-56">
                <EnergyChart />
              </div>
            </div>
          </div>
        </section>

        {/* ── SEÇÃO 6: AUDITORIA ANGULAR ── */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="text-xs font-black text-[#15803d] uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <Crosshair size={16} /> 06. Auditoria de Rastreamento
          </h2>
          <div className="border border-slate-200 p-6 rounded-xl">
             <div className="scale-95 origin-top-left w-[105%] print:shadow-none">
               <AngularPerformancePanel />
             </div>
          </div>
        </section>

        {/* ── RODAPÉ ── */}
        <footer className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-400 print:break-inside-avoid">
          <p>Relatório gerado automaticamente por Sunflower IoT Platform</p>
          <p>Documento gerado para fins de validação e estudos preliminares.</p>
        </footer>

      </div>
    </div>
  );
}