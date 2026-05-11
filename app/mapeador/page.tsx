"use client";

import React from 'react';
import Link from 'next/link';
import { Home } from "lucide-react";

export default function MapeadorPage() {
  return (
    <main className="w-full bg-[#eeede8] min-h-screen font-sans">
      {/* Topbar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/10 pb-5 gap-4 p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-sun-green-600 rounded-full flex items-center justify-center text-sun-amber-400 shrink-0 shadow-md border border-black/5">
            <Home size={40} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none mb-1.5">Mapeador</h1>
            <p className="text-[10px] font-bold text-[#6b6a64] uppercase tracking-[0.3em] opacity-80">
              Calcule a Área Útil e Estime Placas Solares
            </p>
          </div>
        </div>
        <Link href="/" className="text-[11px] font-black uppercase tracking-[0.15em] text-sun-green-600 hover:text-sun-green-700">
          ← Voltar ao Dashboard
        </Link>
      </header>

      {/* Mapa em iframe (carregamento ultra-rápido) */}
      <iframe
        src="/roof-mapper.html"
        style={{
          width: '100%',
          height: 'calc(100vh - 120px)',
          border: 'none',
          display: 'block'
        }}
        title="Mapeador Interativo"
      />
    </main>
  );
}