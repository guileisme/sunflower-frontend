"use client";

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import {
  Zap, Clock, FileText, LayoutDashboard, Crosshair, 
  MapPin, Globe, TableProperties, Calculator, MoreHorizontal
} from "lucide-react";
import RoofMapper from "@/components/RoofMapper";

// ─── Subcomponente de Navegação ──────────────────────────────────────────────
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
export default function MapeadorPage() {
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

  return (
    <main className="w-full bg-[#eeede8] min-h-screen font-sans pb-10 overflow-x-hidden">
      
      {/* ── NAVBAR RESPONSIVA REFORMULADA ── */}
      <div className="relative z-50 p-3 sm:p-4 md:p-6 lg:p-8 pb-4 sm:pb-6">
        <nav className="w-full">
          <div className="max-w-full mx-auto bg-white/90 backdrop-blur-md border border-white shadow-xl rounded-3xl p-2 md:p-3 flex flex-col xl:flex-row justify-between gap-3">
            
            {/* LINHA 1 (Logo + Dossiê) */}
            <div className="flex items-center justify-between w-full xl:w-auto px-2 md:px-4 md:border-r border-black/5">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 bg-sun-green-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                  <MapPin size={20} className="text-sun-amber-400" />
                </div>
                <div className="leading-none">
                  <h1 className="text-sm sm:text-lg font-black text-sun-text tracking-tighter uppercase">Mapeador</h1>
                  <p className="text-[8px] sm:text-[9px] font-bold text-sun-green-600 tracking-widest uppercase">Área e Telhados</p>
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
                <NavLink href="/mapeador" icon={MapPin} label="Mapa" active />
                
                <div className="hidden md:flex items-center gap-1">
                  <NavLink href="/rastreador" icon={Crosshair} label="Rastreio" />
                  <NavLink href="/regions" icon={Globe} label="Regiões" />
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
                          <NavLink href="/regions" icon={Globe} label="Regiões" />
                          <NavLink href="/simulador/economia" icon={TableProperties} label="ROI" />
                          <NavLink href="/calculadora" icon={Calculator} label="Calculadora" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Status Live Mobile */}
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

      {/* ── CONTEÚDO PRINCIPAL (Mapeador de Telhado) ── */}
      <div className="relative z-10 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <RoofMapper />
      </div>

    </main>
  );
}