"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Crosshair, Zap, Wifi, WifiOff, Trophy, RotateCcw,
  Activity, LayoutDashboard, MapPin, Globe, TableProperties,
  Calculator, FileText, Clock, MoreHorizontal
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface SolarData {
  azimute: number;
  polar: number;
  tensao_mv: number;
  melhor_azimute: number;
  melhor_polar: number;
  melhor_tensao_mv: number;
  ldr_cima_esq: number;
  ldr_cima_dir: number;
  ldr_baixo_esq: number;
  ldr_baixo_dir: number;
  timestamp: number;
}

const HISTORY_MAX = 60; // pontos no histórico de tensão

// ─── Bússola SVG ──────────────────────────────────────────────────────────────
function Bussola({
  azimute,
  polar,
  label,
  color,
}: {
  azimute: number;
  polar: number;
  label: string;
  color: string;
}) {
  const rad = ((azimute - 90) * Math.PI) / 180;
  const px = 65 + 46 * Math.cos(rad);
  const py = 65 + 46 * Math.sin(rad);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#6b6a64]">
        {label}
      </p>
      <svg width="140" height="140" viewBox="0 0 130 130">
        {/* Círculos de fundo */}
        <circle cx="65" cy="65" r="60" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" fill="none" />
        <circle cx="65" cy="65" r="40" stroke="#f3f4f6" strokeWidth="1" fill="none" />
        <circle cx="65" cy="65" r="20" stroke="#f3f4f6" strokeWidth="1" fill="none" />
        {/* Eixos */}
        <line x1="65" y1="5" x2="65" y2="125" stroke="#e5e7eb" strokeWidth="1" />
        <line x1="5" y1="65" x2="125" y2="65" stroke="#e5e7eb" strokeWidth="1" />
        {/* Cardinais */}
        <text x="65" y="10" textAnchor="middle" fontSize="11" fontWeight="900" fill="#15803d">N</text>
        <text x="65" y="128" textAnchor="middle" fontSize="10" fontWeight="800" fill="#6b6a64">S</text>
        <text x="6" y="69" textAnchor="start" fontSize="10" fontWeight="800" fill="#6b6a64">O</text>
        <text x="124" y="69" textAnchor="end" fontSize="10" fontWeight="800" fill="#6b6a64">L</text>
        {/* Ponteiro azimutal */}
        <line x1="65" y1="65" x2={px} y2={py} stroke={color} strokeWidth="4" strokeLinecap="round" />
        <circle cx={px} cy={py} r="6" fill={color} stroke="white" strokeWidth="2" />
        <circle cx="65" cy="65" r="5" fill="#3B6D11" stroke="white" strokeWidth="2" />
      </svg>

      {/* Ângulos */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="bg-[#f9f9f7] border border-black/5 p-2.5 rounded-xl text-center shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#6b6a64] tracking-widest mb-0.5">Azimutal</p>
          <p className="text-lg font-black text-sun-text">{azimute}°</p>
        </div>
        <div className="bg-[#f9f9f7] border border-black/5 p-2.5 rounded-xl text-center shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#6b6a64] tracking-widest mb-0.5">Polar</p>
          <p className="text-lg font-black text-sun-text">{polar}°</p>
        </div>
      </div>
    </div>
  );
}

// ─── Mini spark-line SVG ──────────────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2)
    return (
      <div className="h-16 flex items-center justify-center text-xs text-[#6b6a64]">
        Aguardando dados...
      </div>
    );

  const max = Math.max(...data, 1);
  const W = 400, H = 64;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * (H - 4)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15803d" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinejoin="round" points={pts} />
      <polygon fill="url(#sg)" points={`0,${H} ${pts} ${W},${H}`} />
    </svg>
  );
}

// ─── NavLink (Padrão Ouro) ────────────────────────────────────────────────────
function NavLink({ href, icon: Icon, label, active = false, isMobileHidden = false }: { href: string; icon: any; label: string; active?: boolean; isMobileHidden?: boolean }) {
  return (
    <Link href={href} className={`
      flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 group flex-1 md:flex-initial
      ${active ? "bg-sun-green-600 text-white shadow-md" : "text-sun-text hover:bg-black/5"}
      ${isMobileHidden ? 'hidden md:flex' : 'flex'}
    `}>
      <Icon size={16} className={`${active ? "text-sun-amber-400" : "text-sun-green-600 group-hover:scale-110"} transition-transform flex-shrink-0 sm:w-[18px] sm:h-[18px]`} />
      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap">{label}</span>
    </Link>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function RastreadorPage() {
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [data, setData] = useState<SolarData | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

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

  // Adiciona linha ao log (últimas 8)
  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-7), msg]);
  }, []);

  // ── Conectar via Web Serial API ───────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!("serial" in navigator)) {
      setError("Web Serial API não suportada. Use Chrome ou Edge.");
      return;
    }
    try {
      setConnecting(true);
      setError(null);

      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;

      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      readerRef.current = reader;

      setConnected(true);
      addLog("✅ Porta serial conectada — aguardando dados do Arduino...");

      let buffer = "";

      // Loop de leitura
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;

            let newline: number;
            while ((newline = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, newline).trim();
              buffer = buffer.slice(newline + 1);

              if (!line.startsWith("{")) continue;

              try {
                const parsed = JSON.parse(line) as Omit<SolarData, "timestamp">;
                const entry: SolarData = { ...parsed, timestamp: Date.now() };
                setData(entry);
                setHistory((prev) => {
                  const next = [...prev, parsed.tensao_mv];
                  return next.length > HISTORY_MAX ? next.slice(-HISTORY_MAX) : next;
                });
              } catch {
                // linha malformada — ignora
              }
            }
          }
        } catch {
          addLog("🔌 Leitura encerrada.");
        } finally {
          setConnected(false);
        }
      })();
    } catch (e: any) {
      setError(e?.message ?? "Falha ao abrir porta serial.");
      setConnecting(false);
    } finally {
      setConnecting(false);
    }
  }, [addLog]);

  // ── Desconectar ───────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    try {
      await readerRef.current?.cancel();
      await portRef.current?.close();
    } catch {}
    setConnected(false);
    addLog("🔌 Desconectado.");
  }, [addLog]);

  // ── Reset do melhor ângulo ────────────────────────────────────────────────
  const resetHistory = useCallback(() => {
    setHistory([]);
    setData(null);
    addLog("🔄 Histórico local limpo — rastreador continua no Arduino.");
  }, [addLog]);

  // Auxiliares visuais
  const fmtV = (mv: number) => (mv / 1000).toFixed(3) + " V";
  const pct = data ? Math.min((data.tensao_mv / 5000) * 100, 100).toFixed(1) : "0.0";
  const melhorPct = data ? Math.min((data.melhor_tensao_mv / 5000) * 100, 100).toFixed(1) : "0.0";

  return (
    <main className="w-full bg-[#eeede8] min-h-screen text-sun-text font-sans pb-10 overflow-x-hidden">
      
      {/* ── NAVBAR RESPONSIVA (Padrão Ouro) ── */}
      <div className="relative z-50 p-3 sm:p-4 md:p-6 lg:p-8 pb-4 sm:pb-6">
        <nav className="w-full">
          <div className="max-w-full mx-auto bg-white/90 backdrop-blur-md border border-white shadow-xl rounded-3xl p-2 md:p-3 flex flex-col xl:flex-row justify-between gap-3">
            
            {/* LINHA 1 (Mobile) / Lado Esquerdo (Desktop) */}
            <div className="flex items-center justify-between w-full xl:w-auto px-2 md:px-4 md:border-r border-black/5">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 bg-sun-green-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 shrink-0">
                  <Crosshair size={20} className="text-sun-amber-400" />
                </div>
                <div className="leading-none">
                  <h1 className="text-sm sm:text-lg font-black text-sun-text tracking-tighter uppercase">Rastreador</h1>
                  <p className="text-[8px] sm:text-[9px] font-bold text-sun-green-600 tracking-widest uppercase">Telemetria Hardware</p>
                </div>
              </div>
              
              <Link href="/relatorio" target="_blank" className="flex xl:hidden items-center gap-1.5 bg-[#1a1a1a] text-white px-3 py-2 rounded-xl shadow-md active:scale-95 shrink-0">
                <FileText size={14} className="text-sun-amber-400" />
                <span className="text-[9px] font-black uppercase tracking-widest">Dossiê</span>
              </Link>
            </div>

            {/* LINHA 2 e 3 (Mobile) / Centro (Desktop) */}
            <div className="flex flex-col xl:flex-row w-full xl:w-auto flex-1 items-center justify-between xl:justify-start gap-2 px-1">
              
              <div className="flex w-full xl:w-auto items-center bg-[#eeede8]/60 p-1.5 rounded-2xl gap-1 border border-black/5 justify-center md:justify-start relative">
                <NavLink href="/" icon={LayoutDashboard} label="Painel" />
                <NavLink href="/rastreador" icon={Crosshair} label="Rastreio" active />
                
                {/* Ocultos no mobile */}
                <NavLink href="/mapeador" icon={MapPin} label="Mapa" isMobileHidden />
                <NavLink href="/regions" icon={Globe} label="Regiões" isMobileHidden />
                <NavLink href="/simulador/economia" icon={TableProperties} label="ROI" isMobileHidden />
                <NavLink href="/calculadora" icon={Calculator} label="Calculadora" isMobileHidden />
                
                {/* Dropdown Mobile ("Mais...") */}
                <div className="md:hidden flex-1 flex justify-center relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl w-full transition-all duration-200 text-sun-text hover:bg-black/5 ${isMenuOpen ? 'bg-black/5' : ''}`}
                  >
                    <MoreHorizontal size={16} className="text-sun-green-600 flex-shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Mais</span>
                  </button>
                  
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                      <div className="absolute top-full right-0 mt-3 w-48 bg-white border border-black/10 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top">
                        <div className="flex flex-col gap-1" onClick={() => setIsMenuOpen(false)}>
                          <NavLink href="/mapeador" icon={MapPin} label="Mapa" />
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
              <div className="xl:hidden flex w-full sm:w-auto items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-white border border-black/5 rounded-2xl shadow-inner shrink-0 mt-1 xl:mt-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] sm:text-[10px] font-black text-sun-text uppercase tracking-widest hidden sm:inline">Live</span>
                </div>
                <div className="w-px h-3.5 bg-black/10 hidden sm:block" />
                <div className="flex items-center gap-1.5 text-[#6b6a64]">
                  <Clock size={12} className="sm:size-[14px]" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{currentDateTime}</span>
                </div>
              </div>
            </div>

            {/* Ações Direitas Exclusivas Desktop */}
            <div className="hidden xl:flex items-center justify-end gap-3 pr-2 w-auto">
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

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-5">
        
        {/* BARRA DE CONTROLE DO HARDWARE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-4 py-4 rounded-2xl border border-black/10 shadow-sm gap-4">
          <div>
            <h2 className="text-sm font-black text-sun-text uppercase tracking-wider">Controle do Arduino</h2>
            <p className="text-[10px] font-bold text-[#6b6a64] uppercase tracking-widest mt-0.5">Interface Web Serial API</p>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
            {/* Status Visual */}
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full shadow-sm border ${connected ? "bg-green-50 border-green-200" : "bg-[#f9f9f7] border-black/10"}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-300"}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-sun-text">
                {connected ? "Conectado" : "Desconectado"}
              </span>
            </div>

            {/* Botão Conectar/Desconectar */}
            {!connected ? (
              <button
                onClick={connect}
                disabled={connecting}
                className="flex items-center gap-2 bg-sun-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wifi size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                  {connecting ? "Conectando..." : "Conectar Arduino"}
                </span>
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full shadow-md transition-all hover:-translate-y-0.5"
              >
                <WifiOff size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                  Desconectar
                </span>
              </button>
            )}

            {/* Reset */}
            <button
              onClick={resetHistory}
              className="flex items-center gap-2 bg-white border border-black/10 px-4 py-2 rounded-full shadow-sm hover:bg-gray-50 transition-all"
            >
              <RotateCcw size={14} className="text-[#6b6a64]" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-sun-text">
                Resetar Dados
              </span>
            </button>
          </div>
        </div>

        {/* Erro Geral */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm font-bold">
            ⚠️ {error}
          </div>
        )}

        {/* ── Instrução quando desconectado ── */}
        {!connected && !data && (
          <Card className="border-black/5 shadow-sm rounded-xl bg-white">
            <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 bg-[#eeede8] rounded-full flex items-center justify-center">
                <Wifi size={40} className="text-[#6b6a64]" />
              </div>
              <h2 className="text-xl font-black text-sun-text">Aguardando conexão</h2>
              <p className="text-sm font-bold text-[#6b6a64] max-w-md">
                Conecte o Arduino ao computador via USB, grave o firmware <code className="bg-[#eeede8] px-1.5 py-0.5 rounded font-mono text-xs">projeto-rastreador-solar.ino</code> e clique em <strong>Conectar Arduino</strong> na barra acima.
              </p>
              <div className="flex flex-col items-start gap-2 bg-[#eeede8] px-6 py-4 rounded-xl text-left text-sm font-bold text-[#4a4944] mt-2">
                <span>1. Grave o código base no Arduino via IDE</span>
                <span>2. Mantenha o cabo USB conectado ao computador</span>
                <span>3. Clique no botão verde de Conexão</span>
                <span>4. Permita o acesso à porta serial (ex: COM3, /dev/ttyUSB0) no prompt do navegador</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Painel principal (quando há dados) ── */}
        {data && (
          <div className="space-y-5 animate-in fade-in duration-500">
            
            {/* ── KPIs de Tensão ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border border-black/5 p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-center">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#6b6a64] mb-1">Tensão Atual</p>
                <h3 className="text-2xl sm:text-3xl font-black text-sun-text">{fmtV(data.tensao_mv)}</h3>
                <p className="text-xs sm:text-[13px] font-extrabold text-[#15803d] mt-1">{pct}% do pico</p>
              </div>
              <div className="bg-white border border-green-200 p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-center">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#6b6a64] mb-1">🏆 Melhor Tensão</p>
                <h3 className="text-2xl sm:text-3xl font-black text-[#15803d]">{fmtV(data.melhor_tensao_mv)}</h3>
                <p className="text-xs sm:text-[13px] font-extrabold text-[#15803d] mt-1">{melhorPct}% de 5 V</p>
              </div>
              <div className="bg-white border border-black/5 p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-center">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#6b6a64] mb-1">Azimute Atual</p>
                <h3 className="text-2xl sm:text-3xl font-black text-sun-text">{data.azimute}°</h3>
                <p className="text-xs sm:text-[13px] font-extrabold text-[#15803d] mt-1">Polar: {data.polar}°</p>
              </div>
              <div className="bg-white border border-amber-200 p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-center">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#6b6a64] mb-1">🎯 Melhor Ângulo</p>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-600">{data.melhor_azimute}°</h3>
                <p className="text-xs sm:text-[13px] font-extrabold text-amber-600 mt-1">Polar: {data.melhor_polar}°</p>
              </div>
            </div>

            {/* ── Bússolas + Destaque do Melhor Ângulo ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Bússola atual */}
              <Card className="border-black/5 shadow-sm rounded-xl bg-white">
                <CardContent className="p-6 flex flex-col items-center gap-2">
                  <h3 className="text-[11px] uppercase font-black text-sun-text tracking-[0.2em] self-start flex items-center gap-2">
                    <Activity size={15} className="text-sun-amber-400" /> Posição Atual
                  </h3>
                  <Bussola azimute={data.azimute} polar={data.polar} label="Rastreador agora" color="#EF9F27" />
                </CardContent>
              </Card>

              {/* Card destaque do melhor ângulo */}
              <Card className="border-green-200 shadow-md rounded-xl bg-linear-to-br from-green-50 to-white overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center gap-4 h-full justify-center text-center">
                  <div className="w-16 h-16 bg-sun-green-600 rounded-full flex items-center justify-center text-sun-amber-400 shadow-lg">
                    <Trophy size={36} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1">Melhor posição detectada</p>
                    <p className="text-5xl font-black text-[#15803d] leading-none">{fmtV(data.melhor_tensao_mv)}</p>
                    <p className="text-[13px] font-bold text-[#6b6a64] mt-2">na placa solar</p>
                  </div>
                  <div className="bg-white border border-green-200 rounded-2xl px-6 py-4 w-full shadow-sm">
                    <div className="flex justify-around">
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#6b6a64] tracking-widest">Azimutal</p>
                        <p className="text-3xl font-black text-amber-500">{data.melhor_azimute}°</p>
                      </div>
                      <div className="w-px bg-black/5" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#6b6a64] tracking-widest">Polar</p>
                        <p className="text-3xl font-black text-amber-500">{data.melhor_polar}°</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bússola do melhor ângulo */}
              <Card className="border-amber-200/60 shadow-sm rounded-xl bg-white">
                <CardContent className="p-6 flex flex-col items-center gap-2">
                  <h3 className="text-[11px] uppercase font-black text-sun-text tracking-[0.2em] self-start flex items-center gap-2">
                    <Trophy size={15} className="text-amber-500" /> Melhor Ângulo
                  </h3>
                  <Bussola azimute={data.melhor_azimute} polar={data.melhor_polar} label="Maior tensão registrada" color="#F59E0B" />
                </CardContent>
              </Card>
            </div>

            {/* ── Histórico e LDRs Lado a Lado ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Histórico */}
              <Card className="border-black/5 shadow-sm rounded-xl bg-white h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] uppercase font-black text-sun-text tracking-[0.2em] flex items-center gap-2">
                      <Zap size={15} className="text-sun-green-600" /> Histórico de Tensão
                    </h3>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#15803d] bg-green-50 px-3 py-1 rounded-full border border-green-200">
                      Ao vivo
                    </span>
                  </div>
                  <Sparkline data={history} />
                </CardContent>
              </Card>

              {/* Leituras LDR */}
              <Card className="border-black/5 shadow-sm rounded-xl bg-white h-full">
                <CardContent className="p-6">
                  <h3 className="text-[11px] uppercase font-black text-sun-text tracking-[0.2em] mb-4">
                    Sensores LDR (0 – 1023)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "↖ Cima Esq", val: data.ldr_cima_esq },
                      { label: "↗ Cima Dir", val: data.ldr_cima_dir },
                      { label: "↙ Baixo Esq", val: data.ldr_baixo_esq },
                      { label: "↘ Baixo Dir", val: data.ldr_baixo_dir },
                    ].map((ldr) => (
                      <div key={ldr.label} className="bg-[#f9f9f7] border border-black/5 p-3 sm:p-4 rounded-xl">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1 truncate">{ldr.label}</p>
                        <p className="text-lg sm:text-xl font-black text-sun-text">{ldr.val}</p>
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-sun-green-600 transition-all duration-300" style={{ width: `${(ldr.val / 1023) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Log Serial ── */}
            <Card className="border-black/5 shadow-sm rounded-xl bg-white">
              <CardContent className="p-6">
                <h3 className="text-[11px] uppercase font-black text-sun-text tracking-[0.2em] mb-3">
                  Log de Conexão
                </h3>
                <div className="bg-[#0f1419] rounded-xl p-4 font-mono text-[10px] sm:text-[11px] text-green-400 space-y-1 min-h-20 overflow-x-auto">
                  {log.map((l, i) => (
                    <div key={i} className="whitespace-nowrap">{l}</div>
                  ))}
                  {connected && data && (
                    <div className="text-green-300 whitespace-nowrap mt-2 pt-2 border-t border-gray-700/50">
                      {">"} Azm: {data.azimute}° | Pol: {data.polar}° | Tensão: {fmtV(data.tensao_mv)} | Melhor: Azm {data.melhor_azimute}° Pol {data.melhor_polar}° @ {fmtV(data.melhor_tensao_mv)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </main>
  );
}