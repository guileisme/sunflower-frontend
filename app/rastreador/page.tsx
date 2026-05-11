"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Sun,
  Crosshair,
  Zap,
  Wifi,
  WifiOff,
  Trophy,
  RotateCcw,
  Activity,
  ChevronRight,
  ArrowLeft,
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
        <circle
          cx="65"
          cy="65"
          r="60"
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="4 4"
          fill="none"
        />
        <circle
          cx="65"
          cy="65"
          r="40"
          stroke="#f3f4f6"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="65"
          cy="65"
          r="20"
          stroke="#f3f4f6"
          strokeWidth="1"
          fill="none"
        />
        {/* Eixos */}
        <line
          x1="65"
          y1="5"
          x2="65"
          y2="125"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        <line
          x1="5"
          y1="65"
          x2="125"
          y2="65"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        {/* Cardinais */}
        <text
          x="65"
          y="10"
          textAnchor="middle"
          fontSize="11"
          fontWeight="900"
          fill="#15803d"
        >
          N
        </text>
        <text
          x="65"
          y="128"
          textAnchor="middle"
          fontSize="10"
          fontWeight="800"
          fill="#6b6a64"
        >
          S
        </text>
        <text
          x="6"
          y="69"
          textAnchor="start"
          fontSize="10"
          fontWeight="800"
          fill="#6b6a64"
        >
          O
        </text>
        <text
          x="124"
          y="69"
          textAnchor="end"
          fontSize="10"
          fontWeight="800"
          fill="#6b6a64"
        >
          L
        </text>
        {/* Ponteiro azimutal */}
        <line
          x1="65"
          y1="65"
          x2={px}
          y2={py}
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle
          cx={px}
          cy={py}
          r="6"
          fill={color}
          stroke="white"
          strokeWidth="2"
        />
        <circle
          cx="65"
          cy="65"
          r="5"
          fill="#3B6D11"
          stroke="white"
          strokeWidth="2"
        />
      </svg>

      {/* Ângulos */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="bg-[#f9f9f7] border border-black/5 p-2.5 rounded-xl text-center shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#6b6a64] tracking-widest mb-0.5">
            Azimutal
          </p>
          <p className="text-lg font-black text-sun-text">{azimute}°</p>
        </div>
        <div className="bg-[#f9f9f7] border border-black/5 p-2.5 rounded-xl text-center shadow-sm">
          <p className="text-[9px] font-black uppercase text-[#6b6a64] tracking-widest mb-0.5">
            Polar
          </p>
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
  const W = 400,
    H = 64;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * (H - 4)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-16"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15803d" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="#15803d"
        strokeWidth="2.5"
        strokeLinejoin="round"
        points={pts}
      />
      <polygon fill="url(#sg)" points={`0,${H} ${pts} ${W},${H}`} />
    </svg>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function RastreadorPage() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [data, setData] = useState<SolarData | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

            // Processa linhas completas
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
                  return next.length > HISTORY_MAX
                    ? next.slice(-HISTORY_MAX)
                    : next;
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

  // ── Reset do melhor ângulo (reinicia buscando maior tensão) ───────────────
  // (No Arduino, o reset é feito via botão HW; aqui apenas limpa o histórico local)
  const resetHistory = useCallback(() => {
    setHistory([]);
    setData(null);
    addLog("🔄 Histórico local limpo — rastreador continua no Arduino.");
  }, [addLog]);

  // Tensão em Volts formatada
  const fmtV = (mv: number) => (mv / 1000).toFixed(3) + " V";

  // Percentual da tensão máxima observada (5 V)
  const pct = data
    ? Math.min((data.tensao_mv / 5000) * 100, 100).toFixed(1)
    : "0.0";
  const melhorPct = data
    ? Math.min((data.melhor_tensao_mv / 5000) * 100, 100).toFixed(1)
    : "0.0";

  return (
    <main className="w-full p-4 md:p-6 lg:p-8 space-y-5 bg-[#eeede8] min-h-screen text-sun-text font-sans">
      {/* ── Topbar ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/10 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-sun-green-600 rounded-full flex items-center justify-center text-sun-amber-400 shrink-0 shadow-md border border-black/5">
            <Crosshair size={36} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none mb-1.5">
              Rastreador Solar
            </h1>
            <p className="text-[10px] font-bold text-[#6b6a64] uppercase tracking-[0.3em] opacity-80">
              Telemetria em tempo real · Arduino via Web Serial
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Status */}
          <div
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-sm border ${connected ? "bg-green-50 border-green-200" : "bg-white border-black/10"}`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-300"}`}
            />
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">
              {connected ? "Conectado" : "Desconectado"}
            </span>
          </div>

          {/* Botão conectar/desconectar */}
          {!connected ? (
            <button
              onClick={connect}
              disabled={connecting}
              className="flex items-center gap-2 bg-sun-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wifi size={16} />
              <span className="text-[11px] font-black uppercase tracking-[0.15em]">
                {connecting ? "Conectando..." : "Conectar Arduino"}
              </span>
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-full shadow-md transition-all hover:-translate-y-0.5"
            >
              <WifiOff size={16} />
              <span className="text-[11px] font-black uppercase tracking-[0.15em]">
                Desconectar
              </span>
            </button>
          )}

          {/* Reset histórico */}
          <button
            onClick={resetHistory}
            className="flex items-center gap-2 bg-white border border-black/10 px-5 py-2.5 rounded-full shadow-sm hover:bg-gray-50 transition-all"
          >
            <RotateCcw size={14} className="text-[#6b6a64]" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-sun-text">
              Resetar
            </span>
          </button>

          {/* Voltar */}
          <Link
            href="/"
            className="flex items-center gap-2 bg-white border border-black/10 px-5 py-2.5 rounded-full shadow-sm hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={14} className="text-[#6b6a64]" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-sun-text">
              Dashboard
            </span>
          </Link>
        </div>
      </header>

      {/* Erro */}
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
            <h2 className="text-xl font-black text-sun-text">
              Aguardando conexão
            </h2>
            <p className="text-sm font-bold text-[#6b6a64] max-w-md">
              Conecte o Arduino ao computador via USB, grave o firmware{" "}
              <code className="bg-[#eeede8] px-1.5 py-0.5 rounded font-mono text-xs">
                projeto-rastreador-solar.ino
              </code>{" "}
              e clique em <strong>Conectar Arduino</strong>.<br />
              <br />O rastreador irá buscar automaticamente o ângulo com maior
              tensão na placa solar e exibir os dados aqui em tempo real.
            </p>
            <div className="flex flex-col items-start gap-2 bg-[#eeede8] px-6 py-4 rounded-xl text-left text-sm font-bold text-[#4a4944]">
              <span>
                1. Grave o{" "}
                <code className="font-mono bg-white px-1 py-0.5 rounded text-xs">
                  projeto-rastreador-solar.ino
                </code>{" "}
                no Arduino
              </span>
              <span>2. Conecte o USB ao computador</span>
              <span>
                3. Clique em{" "}
                <strong className="text-sun-green-600">Conectar Arduino</strong>{" "}
                acima
              </span>
              <span>
                4. Selecione a porta serial do Arduino (ex: COM3 ou
                /dev/ttyUSB0)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Painel principal (quando há dados) ── */}
      {data && (
        <>
          {/* ── KPIs de Tensão ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-black/5 p-5 rounded-xl shadow-sm flex flex-col justify-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#6b6a64] mb-1">
                Tensão Atual
              </p>
              <h3 className="text-3xl font-black text-sun-text">
                {fmtV(data.tensao_mv)}
              </h3>
              <p className="text-[13px] font-extrabold text-[#15803d] mt-1">
                {pct}% do pico
              </p>
            </div>
            <div className="bg-white border border-green-200 p-5 rounded-xl shadow-sm flex flex-col justify-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#6b6a64] mb-1">
                🏆 Melhor Tensão
              </p>
              <h3 className="text-3xl font-black text-[#15803d]">
                {fmtV(data.melhor_tensao_mv)}
              </h3>
              <p className="text-[13px] font-extrabold text-[#15803d] mt-1">
                {melhorPct}% de 5 V
              </p>
            </div>
            <div className="bg-white border border-black/5 p-5 rounded-xl shadow-sm flex flex-col justify-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#6b6a64] mb-1">
                Azimute Atual
              </p>
              <h3 className="text-3xl font-black text-sun-text">
                {data.azimute}°
              </h3>
              <p className="text-[13px] font-extrabold text-[#15803d] mt-1">
                Polar: {data.polar}°
              </p>
            </div>
            <div className="bg-white border border-amber-200 p-5 rounded-xl shadow-sm flex flex-col justify-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#6b6a64] mb-1">
                🎯 Melhor Ângulo
              </p>
              <h3 className="text-3xl font-black text-amber-600">
                {data.melhor_azimute}°
              </h3>
              <p className="text-[13px] font-extrabold text-amber-600 mt-1">
                Polar: {data.melhor_polar}°
              </p>
            </div>
          </div>

          {/* ── Bússolas + Destaque do Melhor Ângulo ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Bússola atual */}
            <Card className="border-black/5 shadow-sm rounded-xl bg-white">
              <CardContent className="p-6 flex flex-col items-center gap-2">
                <h3 className="text-[11px] uppercase font-black text-sun-text tracking-[0.2em] self-start flex items-center gap-2">
                  <Activity size={15} className="text-sun-amber-400" /> Posição
                  Atual
                </h3>
                <Bussola
                  azimute={data.azimute}
                  polar={data.polar}
                  label="Rastreador agora"
                  color="#EF9F27"
                />
              </CardContent>
            </Card>

            {/* Card destaque do melhor ângulo */}
            <Card className="border-green-200 shadow-md rounded-xl bg-linear-to-br from-green-50 to-white overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center gap-4 h-full justify-center text-center">
                <div className="w-16 h-16 bg-sun-green-600 rounded-full flex items-center justify-center text-sun-amber-400 shadow-lg">
                  <Trophy size={36} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1">
                    Melhor posição detectada
                  </p>
                  <p className="text-5xl font-black text-[#15803d] leading-none">
                    {fmtV(data.melhor_tensao_mv)}
                  </p>
                  <p className="text-[13px] font-bold text-[#6b6a64] mt-2">
                    na placa solar
                  </p>
                </div>
                <div className="bg-white border border-green-200 rounded-2xl px-6 py-4 w-full shadow-sm">
                  <div className="flex justify-around">
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#6b6a64] tracking-widest">
                        Azimutal
                      </p>
                      <p className="text-3xl font-black text-amber-500">
                        {data.melhor_azimute}°
                      </p>
                    </div>
                    <div className="w-px bg-black/5" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#6b6a64] tracking-widest">
                        Polar
                      </p>
                      <p className="text-3xl font-black text-amber-500">
                        {data.melhor_polar}°
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-[#6b6a64]">
                  Oriente seu painel fixo para esses ângulos para máxima
                  captação.
                </p>
              </CardContent>
            </Card>

            {/* Bússola do melhor ângulo */}
            <Card className="border-amber-200/60 shadow-sm rounded-xl bg-white">
              <CardContent className="p-6 flex flex-col items-center gap-2">
                <h3 className="text-[11px] uppercase font-black text-sun-text tracking-[0.2em] self-start flex items-center gap-2">
                  <Trophy size={15} className="text-amber-500" /> Melhor Ângulo
                </h3>
                <Bussola
                  azimute={data.melhor_azimute}
                  polar={data.melhor_polar}
                  label="Maior tensão registrada"
                  color="#F59E0B"
                />
              </CardContent>
            </Card>
          </div>

          {/* ── Histórico de Tensão ── */}
          <Card className="border-black/5 shadow-sm rounded-xl bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] uppercase font-black text-sun-text tracking-[0.2em] flex items-center gap-2">
                  <Zap size={15} className="text-sun-green-600" /> Histórico de
                  Tensão (últimos {HISTORY_MAX} leituras)
                </h3>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#15803d] bg-green-50 px-4 py-1.5 rounded-full border border-green-200">
                  Ao vivo
                </span>
              </div>
              <Sparkline data={history} />
            </CardContent>
          </Card>

          {/* ── LDRs ── */}
          <Card className="border-black/5 shadow-sm rounded-xl bg-white">
            <CardContent className="p-6">
              <h3 className="text-[11px] uppercase font-black text-sun-text tracking-[0.2em] mb-4">
                Leituras LDR (0 – 1023)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "↖ Cima Esq", val: data.ldr_cima_esq },
                  { label: "↗ Cima Dir", val: data.ldr_cima_dir },
                  { label: "↙ Baixo Esq", val: data.ldr_baixo_esq },
                  { label: "↘ Baixo Dir", val: data.ldr_baixo_dir },
                ].map((ldr) => (
                  <div
                    key={ldr.label}
                    className="bg-[#f9f9f7] border border-black/5 p-4 rounded-xl"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6b6a64] mb-1">
                      {ldr.label}
                    </p>
                    <p className="text-2xl font-black text-sun-text">
                      {ldr.val}
                    </p>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sun-green-600 transition-all duration-300"
                        style={{ width: `${(ldr.val / 1023) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Log Serial ── */}
          <Card className="border-black/5 shadow-sm rounded-xl bg-white">
            <CardContent className="p-6">
              <h3 className="text-[11px] uppercase font-black text-sun-text tracking-[0.2em] mb-3">
                Log de Conexão
              </h3>
              <div className="bg-sun-text rounded-xl p-4 font-mono text-[11px] text-green-400 space-y-1 min-h-20">
                {log.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
                {connected && data && (
                  <div className="text-green-300">
                    {">"} Azm: {data.azimute}° | Pol: {data.polar}° | Tensão:{" "}
                    {fmtV(data.tensao_mv)} | Melhor: Azm {data.melhor_azimute}°
                    Pol {data.melhor_polar}° @ {fmtV(data.melhor_tensao_mv)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
