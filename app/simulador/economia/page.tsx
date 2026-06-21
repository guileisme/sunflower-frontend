"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calculator, Clock, TrendingUp, Sun, PiggyBank, Zap, BarChart3, Package, Layers, Loader2,
  LayoutDashboard, Crosshair, MapPin, Globe, TableProperties, FileText, MoreHorizontal
} from "lucide-react";

// Tipagem atualizada
interface Placa {
  id: number;
  marca: string;
  empresaInformante: string; 
  potenciaW: number;
  preco: number;
}

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
      <Icon size={16} className={`${active ? "text-sun-amber-400" : "text-sun-green-600 group-hover:scale-110"} transition-transform shrink-0 sm:w-4.5 sm:h-4.5`} />
      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap">{label}</span>
    </Link>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function SimuladorDashboard() {
  // 1. ESTADOS
  const [geracaoMensalkWh, setGeracaoMensalkWh] = useState<number>(400);
  const [tarifaEnergia, setTarifaEnergia] = useState<number>(0.95);
  const [inflacaoEnergia, setInflacaoEnergia] = useState<number>(8);
  
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estados para controlar a API
  const [catalogoPlacas, setCatalogoPlacas] = useState<Placa[]>([]);
  const [placaSelecionadaId, setPlacaSelecionadaId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // 2. INTEGRAÇÃO COM A API
  useEffect(() => {
    const fetchPlacasDaApi = async () => {
      try {
        const response = await fetch('https://api.npoint.io/9a890986fc5aeca8e80e', {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache' }
        }); 
        if (!response.ok) throw new Error('Falha ao buscar dados da API');
        const data: Placa[] = await response.json();
        setCatalogoPlacas(data);
        if (data.length > 0) setPlacaSelecionadaId(data[0].id);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar o catálogo de placas.");
        setIsLoading(false);
      }
    };
    fetchPlacasDaApi();
  }, []); 

  // 3. CÁLCULO DE DIMENSIONAMENTO
  const dimensionamento = useMemo(() => {
    if (!placaSelecionadaId || catalogoPlacas.length === 0) {
      return { placa: null, qtdPlacas: 0, potenciaSistemaKWp: "0.00", custoTotalEstimado: 0 };
    }
    const placa = catalogoPlacas.find(p => p.id === placaSelecionadaId) || catalogoPlacas[0];
    const geracaoDiariaNecessaria = geracaoMensalkWh / 30;
    const potenciaSistemaWp = (geracaoDiariaNecessaria / (4.5 * 0.80)) * 1000;
    const qtdPlacas = Math.ceil(potenciaSistemaWp / placa.potenciaW);
    return {
      placa,
      qtdPlacas,
      potenciaSistemaKWp: (potenciaSistemaWp / 1000).toFixed(2),
      custoTotalEstimado: (qtdPlacas * placa.preco) * 2.2,
    };
  }, [geracaoMensalkWh, placaSelecionadaId, catalogoPlacas]);

  // 4. CÁLCULOS FINANCEIROS
  const custoSistema = dimensionamento.custoTotalEstimado;
  const economiaMensal = geracaoMensalkWh * tarifaEnergia; 
  const economiaAnual = economiaMensal * 12;
  const paybackMeses = custoSistema > 0 ? custoSistema / economiaMensal : 0;
  
  const { lucroLiquido20Anos, dadosGrafico } = useMemo(() => {
    let acumulado = 0;
    let valorContaComInflacao = economiaAnual;
    const dados = [];
    for (let i = 1; i <= 20; i++) {
      acumulado += valorContaComInflacao;
      dados.push({ ano: i, lucroLiquido: acumulado - custoSistema });
      valorContaComInflacao += valorContaComInflacao * (inflacaoEnergia / 100);
    }
    return { lucroLiquido20Anos: acumulado - custoSistema, dadosGrafico: dados };
  }, [economiaAnual, custoSistema, inflacaoEnergia]);

  const maxLucro = Math.max(1, ...dadosGrafico.map(d => d.lucroLiquido));

  if (isLoading) return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#eeede8] gap-4">
      <Loader2 size={48} className="animate-spin text-emerald-600" />
      <p className="font-bold animate-pulse">Conectando ao banco de dados...</p>
    </div>
  );

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
                  <TableProperties size={20} className="text-sun-amber-400" />
                </div>
                <div className="leading-none">
                  <h1 className="text-sm sm:text-lg font-black text-sun-text tracking-tighter uppercase">Simulador</h1>
                  <p className="text-[8px] sm:text-[9px] font-bold text-sun-green-600 tracking-widest uppercase">Dimensionamento</p>
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
                <NavLink href="/simulador/economia" icon={TableProperties} label="ROI" active />
                
                <div className="hidden md:flex items-center gap-1">
                  <NavLink href="/rastreador" icon={Crosshair} label="Rastreio" />
                  <NavLink href="/mapeador" icon={MapPin} label="Mapa" />
                  <NavLink href="/regions" icon={Globe} label="Regiões" />
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
                          <NavLink href="/regions" icon={Globe} label="Regiões" />
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

      {/* ── CONTEÚDO ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
          
          <div className="col-span-1 space-y-6">
            <Card className="border-white/40 bg-white/60 backdrop-blur-xl shadow-xl rounded-2xl">
              <CardHeader className="bg-white/40 border-b rounded-t-2xl pb-4">
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Sun size={20} className="text-orange-500" /> Necessidade do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-6">
                <div className="space-y-3 relative">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 flex justify-between items-end">
                    <span>Captação Desejada</span>
                    <span className="text-lg sm:text-xl text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{geracaoMensalkWh} kWh</span>
                  </label>
                  <input type="range" min="100" max="3000" step="50" value={geracaoMensalkWh} onChange={(e) => setGeracaoMensalkWh(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-emerald-500" />
                </div>
                <div className="space-y-3 relative">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 flex justify-between items-end">
                    <span>Tarifa de Energia</span>
                    <span className="text-lg sm:text-xl text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100">R$ {tarifaEnergia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </label>
                  <input type="range" min="0.40" max="2.00" step="0.01" value={tarifaEnergia} onChange={(e) => setTarifaEnergia(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/40 bg-white/60 backdrop-blur-xl shadow-xl rounded-2xl">
              <CardHeader className="bg-white/40 border-b rounded-t-2xl pb-4">
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Package size={20} className="text-blue-500" /> Catálogo de Placas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                <div className="space-y-3">
                  {catalogoPlacas.map((placa) => (
                    <div 
                      key={placa.id}
                      onClick={() => setPlacaSelecionadaId(placa.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${placaSelecionadaId === placa.id ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-slate-100 bg-white'}`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-xs sm:text-sm truncate">{placa.marca}</h4>
                          <span className="text-[9px] font-bold bg-slate-200 px-1.5 rounded-md">{placa.potenciaW}W</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{placa.empresaInformante}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-xs sm:text-sm font-bold">R$ {placa.preco.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-1 xl:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/80 p-4 sm:p-5 rounded-2xl border flex flex-col items-center text-center">
                <Layers className="text-indigo-500 mb-2 w-6 h-6 sm:w-7 sm:h-7" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Qtd. Placas</span>
                <span className="text-2xl sm:text-3xl font-black">{dimensionamento.qtdPlacas}</span>
              </div>
              <div className="bg-white/80 p-4 sm:p-5 rounded-2xl border flex flex-col items-center text-center">
                <Zap className="text-amber-500 mb-2 w-6 h-6 sm:w-7 sm:h-7" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tamanho</span>
                <span className="text-2xl sm:text-3xl font-black">{dimensionamento.potenciaSistemaKWp} kWp</span>
              </div>
              <div className="col-span-2 md:col-span-1 bg-blue-600 p-4 sm:p-5 rounded-2xl text-white text-center">
                <span className="text-[10px] font-bold uppercase opacity-80">Investimento Total</span>
                <span className="text-2xl sm:text-3xl font-black block">R$ {dimensionamento.custoTotalEstimado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-emerald-50 shadow-lg rounded-2xl">
                <CardContent className="p-6 flex flex-col justify-center">
                  <h3 className="text-xs font-black uppercase text-emerald-900 mb-4">Economia 1º Ano</h3>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-700">R$ {economiaAnual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 shadow-lg rounded-2xl">
                <CardContent className="p-6 flex flex-col justify-center">
                  <h3 className="text-xs font-black uppercase text-blue-900 mb-4">Payback</h3>
                  <p className="text-3xl sm:text-4xl font-black text-blue-700">{Math.floor(paybackMeses/12)} anos e {Math.ceil(paybackMeses%12)} meses</p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-white/70 shadow-xl rounded-2xl">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-xs font-black uppercase text-indigo-900 mb-6">Lucro Acumulado (20 Anos)</h3>
                <p className="text-4xl font-black text-indigo-700 mb-8">R$ {lucroLiquido20Anos.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                <div className="h-40 bg-slate-50 rounded-xl p-4 flex items-end justify-between gap-1">
                   {dadosGrafico.map((d, i) => (
                     <div key={i} className="flex-1 bg-indigo-500 rounded-t-sm" style={{ height: `${(d.lucroLiquido / maxLucro) * 100}%` }} />
                   ))}
                </div>
              </CardContent>
            </Card>
          </div> 
        </div> 
      </div> 
    </main>
  );
}