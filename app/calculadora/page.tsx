"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Settings, Search, ChevronDown, ChevronUp, Play, Save,
  MapPin, Download, Bookmark, ExternalLink, Shield,
  HelpCircle, Zap, Calculator, LayoutDashboard, Crosshair,
  Globe, TableProperties, FileText, Clock
} from "lucide-react";

// ─── Constantes ──────────────────────────────────────────────────────────────

const PVWATTS_API_KEY = "E17ff3qCxPwvb9b4zmVpJXaczB1upKRPHSWEaiZR";
const PVWATTS_API_URL = "https://developer.nrel.gov/api/pvwatts/v8.json";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MONTH_NAMES_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const MODULE_TYPES = [
  { value: 0, label: "Padrão (Cristalino)" },
  { value: 1, label: "Premium (Alta Eficiência)" },
  { value: 2, label: "Filme Fino" },
];

const ARRAY_TYPES = [
  { value: 0, label: "Fixo (rack aberto)" },
  { value: 1, label: "Fixo (montagem no teto)" },
  { value: 2, label: "1-Eixo" },
  { value: 3, label: "1-Eixo Backtracking" },
  { value: 4, label: "2-Eixos" },
];

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface PVWattsOutputs {
  ac_monthly: number[];
  poa_monthly: number[];
  solrad_monthly: number[];
  solrad_annual: number;
  ac_annual: number;
  capacity_factor: number;
  dc_monthly: number[];
}

interface PVWattsStationInfo {
  lat: number;
  lon: number;
  elev: number;
  tz: number;
  location: string;
  city: string;
  state: string;
  solar_resource_file: string;
  weather_data_source: string;
  distance: number;
}

interface PVWattsResponse {
  inputs: Record<string, unknown>;
  errors: string[];
  warnings: string[];
  version: string;
  station_info: PVWattsStationInfo;
  outputs: PVWattsOutputs;
}

interface FormData {
  label: string;
  address: string;
  lat: string;
  lon: string;
  system_capacity: string;
  module_type: number;
  array_type: number;
  losses: string;
  tilt: string;
  azimuth: string;
  dc_ac_ratio: string;
  inv_eff: string;
  gcr: string;
  albedo: string;
  bifacial: string;
  bifaciality: string;
  soiling: string[];
}

// ─── Mapa Leaflet (dinâmico, sem SSR) ────────────────────────────────────────

const MapComponent = dynamic(
  () => import("react-leaflet").then((mod) => {
    const { MapContainer, TileLayer, Marker, useMap, useMapEvents } = mod;

    function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
      const map = useMap();
      useEffect(() => {
        map.setView(center, zoom);
      }, [center, zoom, map]);
      return null;
    }

    function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
      useMapEvents({
        click(e) {
          onClick(e.latlng.lat, e.latlng.lng);
        },
      });
      return null;
    }

    return function LeafletMap({
      center,
      zoom,
      onMapClick,
    }: {
      center: [number, number];
      zoom: number;
      onMapClick: (lat: number, lng: number) => void;
    }) {
      return (
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy;<a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <Marker position={center} />
          <ChangeView center={center} zoom={zoom} />
          <ClickHandler onClick={onMapClick} />
        </MapContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[400px] bg-[#0d1117] rounded-xl flex items-center justify-center text-gray-500">Carregando mapa...</div> }
);

// ─── Tooltip Component ───────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex ml-1.5">
      <button
        type="button"
        className="text-purple-400 hover:text-purple-300 transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.preventDefault(); setShow(!show); }}
      >
        <HelpCircle size={14} />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg shadow-xl border border-gray-700 w-64 z-50 whitespace-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </span>
  );
}

// ─── NavLink (espelho do Dashboard) ──────────────────────────────────────────

function NavLink({ href, icon: Icon, label, active = false }: { href: string; icon: any; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`
      flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 group
      ${active
        ? "bg-sun-green-600 text-white shadow-md"
        : "text-sun-text hover:bg-black/5"}
    `}>
      <Icon size={18} className={`${active ? "text-sun-amber-400" : "text-sun-green-600 group-hover:scale-110"} transition-transform`} />
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </Link>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function CalculadoraPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"novo" | "salvos" | "clientes">("novo");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PVWattsResponse | null>(null);
  const [reverseAddress, setReverseAddress] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([-8.333829, -36.417642]);
  const [mapZoom, setMapZoom] = useState(14);
  const [currentDateTime, setCurrentDateTime] = useState("");

  const [form, setForm] = useState<FormData>({
    label: "",
    address: "",
    lat: "-8.333829",
    lon: "-36.417642",
    system_capacity: "4.0",
    module_type: 0,
    array_type: 1,
    losses: "14.08",
    tilt: "5",
    azimuth: "210",
    dc_ac_ratio: "1.2",
    inv_eff: "96",
    gcr: "0.4",
    albedo: "",
    bifacial: "0",
    bifaciality: "0.7",
    soiling: Array(12).fill("0"),
  });

  const resultRef = useRef<HTMLDivElement>(null);

  // ── DateTime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      setCurrentDateTime(
        new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
        }).format(new Date()).replace(",", " •").toUpperCase()
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateForm = useCallback((key: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateSoiling = useCallback((index: number, value: string) => {
    setForm((prev) => {
      const soiling = [...prev.soiling];
      soiling[index] = value;
      return { ...prev, soiling };
    });
  }, []);

  // ── Geocoding ─────────────────────────────────────────────────────────────
  const geocodeAddress = useCallback(async () => {
    if (!form.address.trim()) return;

    // Verificar se é formato lat,lon
    const latLonMatch = form.address.match(/^(-?\d+\.?\d*)\s*[,;\s]\s*(-?\d+\.?\d*)$/);
    if (latLonMatch) {
      const lat = parseFloat(latLonMatch[1]);
      const lon = parseFloat(latLonMatch[2]);
      updateForm("lat", lat.toString());
      updateForm("lon", lon.toString());
      setMapCenter([lat, lon]);
      setMapZoom(15);
      reverseGeocode(lat, lon);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}&limit=1&countrycodes=br`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        updateForm("lat", lat);
        updateForm("lon", lon);
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setMapZoom(15);
        setReverseAddress(display_name);
      } else {
        setError("Endereço não encontrado. Tente outro endereço ou use coordenadas (lat, lon).");
      }
    } catch {
      setError("Erro ao buscar endereço. Verifique sua conexão.");
    }
  }, [form.address, updateForm]);

  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        setReverseAddress(data.display_name);
      }
    } catch {
      // silêncio
    }
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    updateForm("lat", lat.toFixed(6));
    updateForm("lon", lng.toFixed(6));
    setMapCenter([lat, lng]);
    reverseGeocode(lat, lng);
  }, [updateForm, reverseGeocode]);

  // ── Chamada API PVWatts ───────────────────────────────────────────────────
  const calculate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const params = new URLSearchParams({
      api_key: PVWATTS_API_KEY,
      lat: form.lat,
      lon: form.lon,
      system_capacity: form.system_capacity,
      module_type: form.module_type.toString(),
      losses: form.losses,
      array_type: form.array_type.toString(),
      tilt: form.tilt,
      azimuth: form.azimuth,
      dc_ac_ratio: form.dc_ac_ratio,
      inv_eff: form.inv_eff,
      gcr: form.gcr,
      timeframe: "monthly",
      dataset: "nsrdb",
    });

    // Parâmetros opcionais
    if (form.albedo.trim()) {
      params.set("albedo", form.albedo.trim());
    }

    if (form.bifacial === "1" && form.bifaciality) {
      params.set("bifaciality", form.bifaciality);
    }

    const soilingValues = form.soiling.map((s) => parseFloat(s) || 0);
    if (soilingValues.some((v) => v > 0)) {
      params.set("soiling", soilingValues.join("|"));
    }

    try {
      const res = await fetch(`${PVWATTS_API_URL}?${params.toString()}`);
      const data: PVWattsResponse = await res.json();

      if (data.errors && data.errors.length > 0) {
        setError(`Erro da API PVWatts: ${data.errors.join(", ")}`);
        setLoading(false);
        return;
      }

      setResult(data);
      setApiOnline(true);

      // Scroll para resultados
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Verifique sua conexão";
      setError(`Falha ao conectar com a API PVWatts: ${message}`);
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, [form]);

  // ── Encontrar Instalador ──────────────────────────────────────────────────
  const findInstaller = useCallback(() => {
    const query = encodeURIComponent(`instalador de energia solar perto de ${reverseAddress || form.address || `${form.lat}, ${form.lon}`}`);
    window.open(`https://www.google.com/maps/search/${query}`, "_blank");
  }, [reverseAddress, form.address, form.lat, form.lon]);

  // ── Gerar PDF ─────────────────────────────────────────────────────────────
  const generatePDF = useCallback(() => {
    if (!result) return;

    const moduleLabel = MODULE_TYPES.find((m) => m.value === form.module_type)?.label || "";
    const arrayLabel = ARRAY_TYPES.find((a) => a.value === form.array_type)?.label || "";
    const si = result.station_info;
    const o = result.outputs;

    const monthsHtml = MONTH_NAMES.map((name, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600">${name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${o.solrad_monthly[i].toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700">${Math.round(o.ac_monthly[i]).toLocaleString("pt-BR")}</td>
      </tr>
    `).join("");

    const soilingRow = form.soiling.map((s, i) => `
      <td style="padding:4px 6px;text-align:center;font-size:11px">${MONTH_NAMES_SHORT[i]}<br/><strong>${s}%</strong></td>
    `).join("");

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8"/>
      <title>Relatório PVWatts — Sunflower Solar Analytics</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#1a1a2e; background:#fff; }
        .header { background: linear-gradient(135deg, #1a5d1a 0%, #2d8e2d 100%); color:white; padding:32px 40px; display:flex; justify-content:space-between; align-items:center; }
        .header h1 { font-size:20px; font-weight:900; letter-spacing:2px; }
        .header .subtitle { font-size:11px; opacity:0.8; margin-top:4px; }
        .header .total { text-align:right; }
        .header .total .value { font-size:42px; font-weight:900; }
        .header .total .unit { font-size:14px; opacity:0.9; }
        .content { padding:32px 40px; }
        h2 { font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:2px; color:#1a5d1a; margin:28px 0 14px; border-bottom:2px solid #1a5d1a; padding-bottom:6px; }
        table { width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; }
        th { background:#f0fdf4; padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#4a4a4a; border-bottom:2px solid #1a5d1a; }
        .annual-row { background:#f0fdf4; font-weight:800; }
        .annual-row td { border-top:2px solid #1a5d1a; }
        .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 32px; font-size:13px; }
        .info-grid .label { color:#666; }
        .info-grid .value { font-weight:700; text-align:right; }
        .soiling-grid { display:flex; gap:4px; margin:8px 0; }
        .footer { margin-top:40px; padding:20px 40px; background:#f8f8f8; font-size:11px; color:#888; text-align:center; border-top:1px solid #e2e8f0; }
        @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>⚡ SUNFLOWER SOLAR ANALYTICS</h1>
          <div class="subtitle">Relatório de Produção Fotovoltaica — PVWatts API v8</div>
        </div>
        <div class="total">
          <div class="value">${Math.round(o.ac_annual).toLocaleString("pt-BR")}</div>
          <div class="unit">kWh/Ano*</div>
          <div style="font-size:10px;opacity:0.7;margin-top:4px">* Baseado em dados TMY</div>
        </div>
      </div>

      <div class="content">
        <h2>Resultados Mensais</h2>
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th style="text-align:center">Radiação Solar<br/><span style="font-weight:400">(kWh/m²/dia)</span></th>
              <th style="text-align:right">Energia CA<br/><span style="font-weight:400">(kWh)</span></th>
            </tr>
          </thead>
          <tbody>
            ${monthsHtml}
            <tr class="annual-row">
              <td style="padding:10px 12px">Anual</td>
              <td style="padding:10px 12px;text-align:center">${o.solrad_annual.toFixed(2)}</td>
              <td style="padding:10px 12px;text-align:right">${Math.round(o.ac_annual).toLocaleString("pt-BR")}</td>
            </tr>
          </tbody>
        </table>

        <h2>Localização e Identificação da Estação</h2>
        <div class="info-grid">
          <span class="label">Localização solicitada</span>
          <span class="value">${reverseAddress || form.address || `${form.lat}, ${form.lon}`}</span>
          <span class="label">Estação NSRDB</span>
          <span class="value">${si.city ? si.city + ", " : ""}${si.state}</span>
          <span class="label">Lat NSRDB</span>
          <span class="value">${si.lat.toFixed(4)}°</span>
          <span class="label">Lon NSRDB</span>
          <span class="value">${si.lon.toFixed(4)}°</span>
          <span class="label">Latitude</span>
          <span class="value">${form.lat}°</span>
          <span class="label">Longitude</span>
          <span class="value">${form.lon}°</span>
        </div>

        <h2>Especificações do Sistema Fotovoltaico</h2>
        <div class="info-grid">
          <span class="label">Tamanho CC</span>
          <span class="value">${form.system_capacity} kWp</span>
          <span class="label">Tipo de módulo</span>
          <span class="value">${moduleLabel}</span>
          <span class="label">Tipo de arranjo</span>
          <span class="value">${arrayLabel}</span>
          <span class="label">Perdas do sistema</span>
          <span class="value">${form.losses}%</span>
          <span class="label">Inclinação</span>
          <span class="value">${form.tilt}°</span>
          <span class="label">Azimute</span>
          <span class="value">${form.azimuth}°</span>
          <span class="label">Relação CC para CA</span>
          <span class="value">${form.dc_ac_ratio}</span>
          <span class="label">Eficiência do inversor</span>
          <span class="value">${form.inv_eff}%</span>
          <span class="label">GCR</span>
          <span class="value">${form.gcr}</span>
          <span class="label">Albedo</span>
          <span class="value">${form.albedo || "Do arquivo met."}</span>
          <span class="label">Bifacial</span>
          <span class="value">${form.bifacial === "1" ? `Sim (${form.bifaciality})` : "Não"}</span>
        </div>

        <h2>Perda Mensal de Irradiância — Soiling (%)</h2>
        <table>
          <tr>${soilingRow}</tr>
        </table>

        <h2>Métricas de Desempenho</h2>
        <div class="info-grid">
          <span class="label">Fator de capacidade CC</span>
          <span class="value">${o.capacity_factor.toFixed(1)}%</span>
          <span class="label">Radiação solar anual</span>
          <span class="value">${o.solrad_annual.toFixed(3)} kWh/m²/dia</span>
        </div>
      </div>

      <div class="footer">
        Gerado por Sunflower Solar Analytics • PVWatts API v${result.version || "8"} • ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </body>
    </html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  }, [result, form, reverseAddress]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="w-full min-h-screen bg-[#eeede8] text-sun-text font-sans">
      {/* ── Navbar (mesma do Dashboard) ── */}
      <div className="p-4 md:p-6 lg:p-8 pb-0">
        <nav className="w-full mb-6">
          <div className="max-w-full mx-auto bg-white/90 backdrop-blur-md border border-white shadow-xl rounded-3xl p-2 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 px-4 border-r border-black/5 lg:flex">
              <div className="w-10 h-10 bg-sun-green-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 transition-transform hover:rotate-0">
                <Zap size={22} className="text-sun-amber-400" fill="currentColor" />
              </div>
              <div className="leading-none">
                <h1 className="text-lg font-black text-sun-text tracking-tighter">SUNFLOWER</h1>
                <p className="text-[8px] font-bold text-sun-green-600 tracking-widest uppercase">Solar Analytics</p>
              </div>
            </div>
            <div className="flex items-center bg-[#eeede8]/60 p-1.5 rounded-2xl gap-1 border border-black/5 overflow-x-auto no-scrollbar">
              <NavLink href="/" icon={LayoutDashboard} label="Painel" />
              <NavLink href="/rastreador" icon={Crosshair} label="Rastreio" />
              <NavLink href="/mapeador" icon={MapPin} label="Mapa" />
              <NavLink href="/regions" icon={Globe} label="Regiões" />
              <NavLink href="/simulador/economia" icon={TableProperties} label="ROI" />
              <NavLink href="/calculadora" icon={Calculator} label="Calculadora" active />
            </div>
            <div className="flex items-center gap-3 pr-2">
              <Link href="/relatorio" target="_blank" className="flex items-center gap-2 bg-sun-text text-white px-5 py-2.5 rounded-2xl hover:bg-black transition-all shadow-md active:scale-95 group">
                <FileText size={16} className="text-sun-amber-400 group-hover:rotate-6 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Dossiê PDF</span>
              </Link>
              <div className="flex items-center gap-4 px-4 py-2 bg-white border border-black/5 rounded-2xl shadow-inner">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-sun-text uppercase tracking-widest">Live</span>
                </div>
                <div className="w-px h-4 bg-black/10" />
                <div className="flex items-center gap-2 text-[#6b6a64]">
                  <Clock size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{currentDateTime}</span>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* ── Conteúdo Dark da Calculadora ── */}
      <div className="bg-[#0f1419] min-h-screen rounded-t-3xl">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Settings size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Calculadora PVWatts</h1>
                <p className="text-xs text-gray-400 font-medium">Produção fotovoltaica real via NREL PVWatts API v8</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-[#252b3b] transition-colors">
                <Shield size={14} />
                Admin
              </button>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${apiOnline ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                <div className={`w-2 h-2 rounded-full ${apiOnline ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                API NREL • {apiOnline ? "ONLINE" : "OFFLINE"}
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 border-b border-gray-800">
            <button
              onClick={() => setActiveTab("novo")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === "novo" ? "border-green-400 text-green-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
              <Settings size={14} />
              Novo Cálculo
            </button>
            <button
              onClick={() => setActiveTab("salvos")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === "salvos" ? "border-green-400 text-green-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
              <Bookmark size={14} />
              Cálculos Salvos
              <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[10px] font-black">2</span>
            </button>
            <button
              onClick={() => setActiveTab("clientes")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === "clientes" ? "border-green-400 text-green-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
              <ExternalLink size={14} />
              Clientes Ativos
              <span className="bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-black">0</span>
            </button>
          </div>

          {/* ── Tab Content: Novo Cálculo ── */}
          {activeTab === "novo" && (
            <div className="space-y-6">
              {/* Erro */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-3 rounded-xl text-sm font-bold">
                  ⚠️ {error}
                </div>
              )}

              {/* ── LOCALIZAÇÃO ── */}
              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 space-y-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Localização do Sistema</h2>

                {/* Campo de endereço */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      id="calc-address"
                      type="text"
                      placeholder="Digite um endereço, cidade ou coordenadas (lat, lon)"
                      value={form.address}
                      onChange={(e) => updateForm("address", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && geocodeAddress()}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                    />
                    <p className="text-[11px] text-gray-600 mt-1.5">Digite um endereço, cidade ou coordenadas (lat, lon)</p>
                  </div>
                  <button
                    onClick={geocodeAddress}
                    className="flex items-center gap-2 px-5 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white text-sm font-bold hover:border-green-500 transition-colors shrink-0"
                  >
                    <Search size={16} />
                    Localizar
                  </button>
                </div>

                {/* Lat/Lon */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Latitude</label>
                    <input
                      id="calc-lat"
                      type="text"
                      value={form.lat}
                      onChange={(e) => {
                        updateForm("lat", e.target.value);
                        const lat = parseFloat(e.target.value);
                        const lon = parseFloat(form.lon);
                        if (!isNaN(lat) && !isNaN(lon)) setMapCenter([lat, lon]);
                      }}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Longitude</label>
                    <input
                      id="calc-lon"
                      type="text"
                      value={form.lon}
                      onChange={(e) => {
                        updateForm("lon", e.target.value);
                        const lat = parseFloat(form.lat);
                        const lon = parseFloat(e.target.value);
                        if (!isNaN(lat) && !isNaN(lon)) setMapCenter([lat, lon]);
                      }}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Mapa */}
                <div className="h-[400px] rounded-xl overflow-hidden border border-gray-700">
                  <MapComponent center={mapCenter} zoom={mapZoom} onMapClick={handleMapClick} />
                </div>

                {/* Info abaixo do mapa */}
                {reverseAddress && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <MapPin size={14} className="text-red-400" />
                    <span>{reverseAddress}</span>
                    <span className="text-gray-700">•</span>
                    <span className="text-green-400 font-bold">Lat: {form.lat} · Lon: {form.lon}</span>
                  </div>
                )}
              </div>

              {/* ── INFORMAÇÕES DO SISTEMA ── */}
              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 space-y-5">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Informações do Sistema</h2>

                {/* Linha 1: Label, Capacity, Module */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                      Label / Nome
                      <Tooltip text="Nome de identificação do cálculo para referência futura." />
                    </label>
                    <input
                      id="calc-label"
                      type="text"
                      placeholder="Ex: Residência - R. São Pedro 106"
                      value={form.label}
                      onChange={(e) => updateForm("label", e.target.value)}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                      Tamanho do Sistema CC (kWp)
                      <Tooltip text="Capacidade nominal do sistema fotovoltaico em kW. Faixa: 0.05 a 500000." />
                    </label>
                    <input
                      id="calc-capacity"
                      type="number"
                      step="0.1"
                      min="0.05"
                      max="500000"
                      value={form.system_capacity}
                      onChange={(e) => updateForm("system_capacity", e.target.value)}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                      Tipo de Módulo
                      <Tooltip text="0=Padrão (cristalino), 1=Premium (alta eficiência), 2=Filme fino." />
                    </label>
                    <select
                      id="calc-module-type"
                      value={form.module_type}
                      onChange={(e) => updateForm("module_type", parseInt(e.target.value))}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors appearance-none cursor-pointer"
                    >
                      {MODULE_TYPES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Linha 2: Array Type, Losses, Tilt */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                      Tipo de Arranjo
                      <Tooltip text="Tipo de montagem: 0=Fixo rack aberto, 1=Fixo teto, 2=1-eixo, 3=1-eixo backtracking, 4=2-eixos." />
                    </label>
                    <select
                      id="calc-array-type"
                      value={form.array_type}
                      onChange={(e) => updateForm("array_type", parseInt(e.target.value))}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors appearance-none cursor-pointer"
                    >
                      {ARRAY_TYPES.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                      Perdas do Sistema (%)
                      <Tooltip text="Perdas totais do sistema em percentual. Faixa: -5 a 99." />
                    </label>
                    <input
                      id="calc-losses"
                      type="number"
                      step="0.01"
                      min="-5"
                      max="99"
                      value={form.losses}
                      onChange={(e) => updateForm("losses", e.target.value)}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                      Inclinação da Matriz (°)
                      <Tooltip text="Ângulo de inclinação do painel em graus. Faixa: 0 a 90." />
                    </label>
                    <input
                      id="calc-tilt"
                      type="number"
                      step="0.1"
                      min="0"
                      max="90"
                      value={form.tilt}
                      onChange={(e) => updateForm("tilt", e.target.value)}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Linha 3: Azimuth, DC/AC, Inv Eff */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                      Azimute da Matriz (°)
                      <Tooltip text="Ângulo azimutal do painel em graus. 180°=Sul (hemisfério norte). Faixa: 0 a 359." />
                    </label>
                    <input
                      id="calc-azimuth"
                      type="number"
                      step="1"
                      min="0"
                      max="359"
                      value={form.azimuth}
                      onChange={(e) => updateForm("azimuth", e.target.value)}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                      Rel. CC para CA
                      <Tooltip text="Razão de potência CC para CA (DC to AC ratio). Valor padrão: 1.2. Deve ser positivo." />
                    </label>
                    <input
                      id="calc-dc-ac"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={form.dc_ac_ratio}
                      onChange={(e) => updateForm("dc_ac_ratio", e.target.value)}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                      Eficiência do Inversor (%)
                      <Tooltip text="Eficiência do inversor na potência nominal. Faixa: 90 a 99.5. Padrão: 96." />
                    </label>
                    <input
                      id="calc-inv-eff"
                      type="number"
                      step="0.1"
                      min="90"
                      max="99.5"
                      value={form.inv_eff}
                      onChange={(e) => updateForm("inv_eff", e.target.value)}
                      className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* ── PARÂMETROS AVANÇADOS ── */}
              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#252b3b] transition-colors"
                >
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    <Settings size={14} className="text-purple-400" />
                    Parâmetros Avançados
                  </span>
                  {showAdvanced ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                </button>

                {showAdvanced && (
                  <div className="px-6 pb-6 space-y-5 border-t border-gray-800 pt-5">
                    {/* GCR, Albedo, Bifacial */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                          Taxa de Cobertura do Solo (GCR)
                          <Tooltip text="Ground Coverage Ratio — razão da área do módulo pela área total do solo. Faixa: 0.01 a 0.99. Padrão: 0.4." />
                        </label>
                        <input
                          id="calc-gcr"
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="0.99"
                          value={form.gcr}
                          onChange={(e) => updateForm("gcr", e.target.value)}
                          className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                          Albedo
                          <Tooltip text="Refletância do solo. Valor entre 0 e 1. Deixe vazio para usar o valor do arquivo meteorológico (recomendado)." />
                        </label>
                        <input
                          id="calc-albedo"
                          type="text"
                          placeholder="Do arquivo meteorológico"
                          value={form.albedo}
                          onChange={(e) => updateForm("albedo", e.target.value)}
                          className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                        />
                        <p className="text-[10px] text-gray-600 mt-1">Vazio = valor do arquivo met. (recomendado)</p>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                          Bifacial
                          <Tooltip text="Ativa módulo bifacial. Quando ativo, informe o valor de bifacialidade (razão eficiência traseira/frontal, tipicamente 0.65-0.9)." />
                        </label>
                        <select
                          id="calc-bifacial"
                          value={form.bifacial}
                          onChange={(e) => updateForm("bifacial", e.target.value)}
                          className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors appearance-none cursor-pointer"
                        >
                          <option value="0">Não</option>
                          <option value="1">Sim</option>
                        </select>
                      </div>
                    </div>

                    {/* Bifaciality value (conditionally shown) */}
                    {form.bifacial === "1" && (
                      <div className="max-w-xs">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                          Bifacialidade (0-1)
                          <Tooltip text="Razão entre eficiência traseira e frontal do módulo. Tipicamente 0.65 a 0.9." />
                        </label>
                        <input
                          id="calc-bifaciality"
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={form.bifaciality}
                          onChange={(e) => updateForm("bifaciality", e.target.value)}
                          className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                        />
                      </div>
                    )}

                    {/* Soiling */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center">
                        Perda Mensal de Irradiância — Soiling (%)
                        <Tooltip text="Redução na irradiância solar incidente causada por sujeira ou poeira na superfície do módulo. Faixa: 0 a 100 para cada mês." />
                      </label>
                      <div className="grid grid-cols-6 gap-3">
                        {MONTH_NAMES_SHORT.map((month, i) => (
                          <div key={month}>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1 block">{month}</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={form.soiling[i]}
                              onChange={(e) => updateSoiling(i, e.target.value)}
                              className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-green-500 transition-colors"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── BOTÕES DE AÇÃO ── */}
              <div className="flex items-center gap-3">
                <button
                  onClick={calculate}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-[#a3e635] hover:bg-[#bef264] text-[#0f1419] rounded-xl font-black text-sm uppercase tracking-wider transition-all hover:-translate-y-0.5 shadow-lg shadow-[#a3e635]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={16} fill="currentColor" />
                  {loading ? "Calculando..." : "Calcular"}
                </button>
                <button
                  onClick={calculate}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-[#1a1f2e] hover:bg-[#252b3b] text-white border border-gray-700 rounded-xl font-black text-sm uppercase tracking-wider transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  Calcular e Salvar
                </button>
              </div>

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* ══  RESULTADOS  ══════════════════════════════════════════════ */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {result && result.outputs && (
                <div ref={resultRef} className="space-y-6 animate-in fade-in duration-500">

                  {/* ── Resultado Principal ── */}
                  <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-green-400 mb-2">Resultados</h2>
                        <div className="flex items-baseline gap-3">
                          <span className="text-5xl font-black text-white">{Math.round(result.outputs.ac_annual).toLocaleString("pt-BR")}</span>
                          <span className="text-lg text-gray-400 font-bold">kWh/Ano</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">* Baseado em dados TMY — pode variar do desempenho real</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Estação NREL: {result.station_info.city ? result.station_info.city + ", " : ""}{result.station_info.state}
                        </p>
                      </div>
                      <button
                        onClick={findInstaller}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white text-sm font-bold hover:border-green-500 transition-colors shrink-0"
                      >
                        <MapPin size={16} className="text-green-400" />
                        Encontrar instalador local
                      </button>
                    </div>

                    {/* Tabela mensal */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 py-3 px-4">Mês</th>
                            <th className="text-center text-[11px] font-bold uppercase tracking-wider text-gray-500 py-3 px-4">
                              Radiação Solar<br /><span className="font-normal text-gray-600">(kWh/m²/dia)</span>
                            </th>
                            <th className="text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 py-3 px-4">
                              Energia CA<br /><span className="font-normal text-gray-600">(kWh)</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {MONTH_NAMES.map((name, i) => (
                            <tr key={name} className="border-b border-gray-800/50 hover:bg-[#252b3b]/30 transition-colors">
                              <td className="py-3 px-4 text-sm font-bold text-white">{name}</td>
                              <td className="py-3 px-4 text-sm text-gray-300 text-center">{result.outputs.solrad_monthly[i].toFixed(2)}</td>
                              <td className="py-3 px-4 text-sm font-bold text-green-400 text-right">{Math.round(result.outputs.ac_monthly[i]).toLocaleString("pt-BR")}</td>
                            </tr>
                          ))}
                          {/* Linha anual */}
                          <tr className="border-t-2 border-green-500/30 bg-green-500/5">
                            <td className="py-3 px-4 text-sm font-black text-green-400">Anual</td>
                            <td className="py-3 px-4 text-sm font-bold text-green-400 text-center">{result.outputs.solrad_annual.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm font-black text-green-400 text-right">{Math.round(result.outputs.ac_annual).toLocaleString("pt-BR")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── Localização e Identificação da Estação ── */}
                  <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-green-400">Localização e Identificação da Estação</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Localização solicitada</span>
                        <span className="text-white font-bold text-right max-w-[60%]">{reverseAddress || form.address || `${form.lat}, ${form.lon}`}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Estação NSRDB</span>
                        <span className="text-white font-bold">{result.station_info.city ? result.station_info.city + ", " : ""}{result.station_info.state}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Lat NSRDB</span>
                        <span className="text-white font-bold">{result.station_info.lat.toFixed(4)}°</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Lon NSRDB</span>
                        <span className="text-white font-bold">{result.station_info.lon.toFixed(4)}°</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Latitude</span>
                        <span className="text-white font-bold">{form.lat}°</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Longitude</span>
                        <span className="text-white font-bold">{form.lon}°</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Especificações do Sistema ── */}
                  <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-green-400">Especificações do Sistema Fotovoltaico</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Tamanho CC</span>
                        <span className="text-white font-bold">{form.system_capacity} kWp</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Tipo de módulo</span>
                        <span className="text-white font-bold">{MODULE_TYPES.find((m) => m.value === form.module_type)?.label}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Tipo de arranjo</span>
                        <span className="text-white font-bold">{ARRAY_TYPES.find((a) => a.value === form.array_type)?.label}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Perdas do sistema</span>
                        <span className="text-white font-bold">{form.losses}%</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Inclinação</span>
                        <span className="text-white font-bold">{form.tilt}°</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Azimute</span>
                        <span className="text-white font-bold">{form.azimuth}°</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Relação CC para CA</span>
                        <span className="text-white font-bold">{form.dc_ac_ratio}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Eficiência do inversor</span>
                        <span className="text-white font-bold">{form.inv_eff}%</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">GCR</span>
                        <span className="text-white font-bold">{form.gcr}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Albedo</span>
                        <span className="text-white font-bold">{form.albedo || "Do arquivo met."}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Bifacial</span>
                        <span className="text-white font-bold">{form.bifacial === "1" ? `Sim (${form.bifaciality})` : "Não"}</span>
                      </div>
                    </div>

                    {/* Soiling */}
                    <div className="mt-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Perda mensal de irradiância (soiling %)</p>
                      <div className="flex flex-wrap gap-2">
                        {MONTH_NAMES_SHORT.map((month, i) => (
                          <div key={month} className="bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-center min-w-[60px]">
                            <span className="text-[10px] text-gray-500 block">{month}</span>
                            <span className="text-sm font-bold text-white">{form.soiling[i]}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Métricas de Desempenho ── */}
                  <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-green-400">Métricas de Desempenho</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Fator de capacidade CC</span>
                        <span className="text-white font-bold">{result.outputs.capacity_factor.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-800/50">
                        <span className="text-gray-500">Radiação solar anual</span>
                        <span className="text-white font-bold">{result.outputs.solrad_annual.toFixed(3)} kWh/m²/dia</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Botões Finais ── */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={generatePDF}
                      className="flex items-center gap-2 px-6 py-3 bg-[#a3e635]/10 hover:bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30 rounded-xl font-black text-sm uppercase tracking-wider transition-all hover:-translate-y-0.5"
                    >
                      <Download size={16} />
                      Baixar PDF
                    </button>
                    <button
                      className="flex items-center gap-2 px-6 py-3 bg-[#1a1f2e] hover:bg-[#252b3b] text-white border border-gray-700 rounded-xl font-black text-sm uppercase tracking-wider transition-all hover:-translate-y-0.5"
                    >
                      <Save size={16} />
                      Salvar Cálculo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab Content: Cálculos Salvos ── */}
          {activeTab === "salvos" && (
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
              <Bookmark size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-black text-gray-400">Nenhum cálculo salvo</h3>
              <p className="text-sm text-gray-600 mt-2">Os cálculos salvos aparecerão aqui.</p>
            </div>
          )}

          {/* ── Tab Content: Clientes Ativos ── */}
          {activeTab === "clientes" && (
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
              <ExternalLink size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-black text-gray-400">Nenhum cliente ativo</h3>
              <p className="text-sm text-gray-600 mt-2">Os clientes ativos aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
