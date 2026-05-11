"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Clock, TrendingUp, Sun, PiggyBank, Zap, BarChart3, Package, Layers, Loader2 } from "lucide-react";

// Tipagem atualizada
interface Placa {
  id: number;
  marca: string;
  empresaInformante: string; 
  potenciaW: number;
  preco: number;
}

export default function SimuladorDashboard() {
  // 1. ESTADOS
  const [geracaoMensalkWh, setGeracaoMensalkWh] = useState<number>(400);
  const [tarifaEnergia, setTarifaEnergia] = useState<number>(0.95);
  const [inflacaoEnergia, setInflacaoEnergia] = useState<number>(8);
  
  // Estados para controlar a API
  const [catalogoPlacas, setCatalogoPlacas] = useState<Placa[]>([]);
  const [placaSelecionadaId, setPlacaSelecionadaId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 2. INTEGRAÇÃO COM A API
  useEffect(() => {
    const fetchPlacasDaApi = async () => {
      try {
        // Chamada real para a sua NOVA API no npoint (com proteção contra cache do navegador)
        const response = await fetch('https://api.npoint.io/9a890986fc5aeca8e80e', {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache'
          }
        }); 
        
        if (!response.ok) {
          throw new Error('Falha ao buscar dados da API');
        }
        
        const data: Placa[] = await response.json();
        setCatalogoPlacas(data);
        
        // Deixa a primeira placa selecionada por padrão assim que carregar
        if (data.length > 0) {
          setPlacaSelecionadaId(data[0].id);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar o catálogo de placas. Tente atualizar a página.");
        setIsLoading(false);
      }
    };

    fetchPlacasDaApi();
  }, []); 

  // 3. CÁLCULO DE DIMENSIONAMENTO DO SISTEMA
  const dimensionamento = useMemo(() => {
    if (!placaSelecionadaId || catalogoPlacas.length === 0) {
      return { placa: null, qtdPlacas: 0, potenciaSistemaKWp: "0.00", custoTotalEstimado: 0 };
    }

    const placa = catalogoPlacas.find(p => p.id === placaSelecionadaId) || catalogoPlacas[0];
    const mediaDiasMes = 30;
    const hspDiario = 4.5; // Horas de sol por dia (média Brasil)
    const eficienciaSistema = 0.80; // Perdas por calor, cabos, etc.

    const geracaoDiariaNecessaria = geracaoMensalkWh / mediaDiasMes;
    const potenciaSistemaWp = (geracaoDiariaNecessaria / (hspDiario * eficienciaSistema)) * 1000;
    
    const qtdPlacas = Math.ceil(potenciaSistemaWp / placa.potenciaW);
    const custoPlacas = qtdPlacas * placa.preco;
    
    // Multiplicador 2.2 engloba custo de inversor, cabos, estrutura e mão de obra
    const custoTotalEstimado = custoPlacas * 2.2; 

    return {
      placa,
      qtdPlacas,
      potenciaSistemaKWp: (potenciaSistemaWp / 1000).toFixed(2),
      custoTotalEstimado,
    };
  }, [geracaoMensalkWh, placaSelecionadaId, catalogoPlacas]);

  // 4. CÁLCULOS FINANCEIROS
  const custoSistema = dimensionamento.custoTotalEstimado;
  const economiaMensal = geracaoMensalkWh * tarifaEnergia; 
  const economiaAnual = economiaMensal * 12;
  
  const paybackMeses = custoSistema > 0 ? custoSistema / economiaMensal : 0;
  const paybackAnos = Math.floor(paybackMeses / 12);
  const paybackMesesRestantes = Math.ceil(paybackMeses % 12);

  // Projeção de ROI em 20 anos
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

  // --- RENDERIZAÇÃO DA TELA ---

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#eeede8] text-slate-600 gap-4">
        <Loader2 size={48} className="animate-spin text-emerald-600" />
        <p className="font-bold animate-pulse text-lg">Conectando ao banco de dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#eeede8] text-red-500 font-bold">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <main className="w-full p-4 md:p-6 lg:p-8 space-y-5 bg-[#eeede8] min-h-screen text-sun-text font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/10 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-yellow-400 shrink-0 shadow-md border border-black/5">
              <Calculator size={36} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none mb-1.5 text-slate-800">Simulador de Projeto</h1>
              <p className="text-[10px] font-bold text-[#6b6a64] uppercase tracking-[0.3em] opacity-80">
                Dimensionamento de Equipamentos
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* PAINEL ESQUERDO: Controles e Catálogo */}
          <div className="col-span-1 space-y-6">
            <Card className="border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-2xl">
              <CardHeader className="bg-white/40 border-b border-white/50 rounded-t-2xl pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Sun className="text-orange-500" size={22} /> Necessidade do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3 relative group">
                  <label className="text-sm font-bold text-slate-700 flex justify-between items-end">
                    <span className="text-slate-500">Captação Desejada</span>
                    <span className="text-xl text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{geracaoMensalkWh} <span className="text-sm">kWh</span></span>
                  </label>
                  <input type="range" min="100" max="3000" step="50" value={geracaoMensalkWh} onChange={(e) => setGeracaoMensalkWh(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:h-3 transition-all" />
                </div>

                <div className="space-y-3 relative group">
                  <label className="text-sm font-bold text-slate-700 flex justify-between items-end">
                    <span className="text-slate-500">Tarifa de Energia</span>
                    <span className="text-xl text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100">R$ {tarifaEnergia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </label>
                  <input type="range" min="0.40" max="2.00" step="0.01" value={tarifaEnergia} onChange={(e) => setTarifaEnergia(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:h-3 transition-all" />
                </div>
              </CardContent>
            </Card>

            {/* Catálogo vindo da API */}
            <Card className="border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-2xl">
              <CardHeader className="bg-white/40 border-b border-white/50 rounded-t-2xl pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Package className="text-blue-500" size={22} /> Catálogo de Placas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {catalogoPlacas.map((placa) => (
                    <div 
                      key={placa.id}
                      onClick={() => setPlacaSelecionadaId(placa.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${placaSelecionadaId === placa.id ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{placa.marca}</h4>
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md shrink-0">
                            {placa.potenciaW}W
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate" title={placa.empresaInformante}>
                          {placa.empresaInformante}
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="block text-sm font-bold text-slate-700">R$ {placa.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-slate-400">/unidade</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PAINEL DIREITO: Resultados e Gráficos */}
          <div className="col-span-1 xl:col-span-2 space-y-6">
            
            {/* Informações do Dimensionamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/80 p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <Layers className="text-indigo-500 mb-2" size={28} />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Qtd. Necessária</span>
                <span className="text-3xl font-black text-slate-800">{dimensionamento.qtdPlacas} <span className="text-lg font-medium text-slate-500">placas</span></span>
              </div>
              
              <div className="bg-white/80 p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <Zap className="text-amber-500 mb-2" size={28} />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tamanho</span>
                <span className="text-3xl font-black text-slate-800">{dimensionamento.potenciaSistemaKWp} <span className="text-lg font-medium text-slate-500">kWp</span></span>
              </div>

              <div className="bg-blue-600 p-5 rounded-2xl shadow-lg shadow-blue-500/20 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10"><Calculator size={100} /></div>
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1 relative z-10">Investimento Total</span>
                <span className="text-2xl md:text-3xl font-black relative z-10">R$ {dimensionamento.custoTotalEstimado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                <span className="text-[10px] text-blue-200 mt-1 relative z-10">Equipamentos + Instalação</span>
              </div>
            </div>

            {/* Cards Financeiros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-white/60 bg-linear-to-br from-emerald-50/90 to-teal-100/50 backdrop-blur-md shadow-lg shadow-emerald-900/5 rounded-2xl">
                <CardContent className="p-8 flex flex-col justify-center h-full relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 text-emerald-500/10 rotate-12 pointer-events-none"><PiggyBank size={140} strokeWidth={1} /></div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-3 bg-white/80 text-emerald-600 rounded-xl shadow-sm"><PiggyBank size={24} strokeWidth={2.5} /></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-900">Economia 1º Ano</h3>
                  </div>
                  <p className="text-4xl xl:text-5xl font-black bg-clip-text text-transparent bg-linear-to-r from-emerald-700 to-teal-500 relative z-10">
                    R$ {economiaAnual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/60 bg-linear-to-br from-blue-50/90 to-indigo-100/50 backdrop-blur-md shadow-lg shadow-blue-900/5 rounded-2xl">
                <CardContent className="p-8 flex flex-col justify-center h-full relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 text-blue-500/10 -rotate-12 pointer-events-none"><Clock size={140} strokeWidth={1} /></div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-3 bg-white/80 text-blue-600 rounded-xl shadow-sm"><Clock size={24} strokeWidth={2.5} /></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-blue-900">Tempo de Payback</h3>
                  </div>
                  <p className="text-4xl xl:text-5xl font-black bg-clip-text text-transparent bg-linear-to-r from-blue-700 to-indigo-500 relative z-10">
                    {paybackAnos}<span className="text-2xl"> {paybackAnos === 1 ? 'ano' : 'anos'}</span> {paybackMesesRestantes > 0 && <span className="text-2xl">e {paybackMesesRestantes} {paybackMesesRestantes === 1 ? 'mês' : 'meses'}</span>}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico ROI 20 anos */}
            <Card className="border-white/60 bg-white/70 backdrop-blur-xl shadow-xl shadow-indigo-900/5 rounded-2xl transition-all duration-300">
              <CardContent className="p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="w-full lg:w-[45%] xl:w-[40%]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm"><TrendingUp size={24} strokeWidth={2.5} /></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900">Lucro (20 Anos)</h3>
                  </div>
                  <p className="text-4xl lg:text-[2.5rem] font-black tracking-tighter whitespace-nowrap bg-clip-text text-transparent bg-linear-to-r from-indigo-700 to-purple-600">
                    R$ {lucroLiquido20Anos.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm font-medium text-slate-500 mt-4 leading-relaxed pr-4">
                    Economia total acumulada subtraindo o custo inicial do equipamento.
                  </p>
                </div>
                
                <div className="w-full lg:w-[50%] xl:w-[55%] h-48 bg-slate-50/50 rounded-xl border border-slate-100 p-4 flex flex-col justify-end relative">
                  <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 flex items-center gap-1"><BarChart3 size={14} /> Projeção</div>
                  <div className="absolute left-0 right-0 border-t border-dashed border-slate-300 z-0" style={{ bottom: `${Math.max(0, (Math.abs(Math.min(...dadosGrafico.map(d => d.lucroLiquido))) / maxLucro) * 100)}%` }}></div>
                  <div className="flex items-end justify-between gap-1 w-full h-32 relative z-10 mt-6">
                    {dadosGrafico.map((d, i) => {
                      const heightPct = Math.max(0, (d.lucroLiquido / maxLucro) * 100);
                      const isLucro = d.lucroLiquido >= 0;
                      return (
                        <div key={i} className="relative flex-1 flex flex-col justify-end h-full group">
                          <div className={`w-full rounded-t-sm transition-all duration-500 ease-out cursor-pointer hover:opacity-100 opacity-80 ${isLucro ? 'bg-linear-to-t from-indigo-600 to-indigo-400' : 'bg-linear-to-t from-orange-400 to-red-400'}`} style={{ height: `${heightPct}%`, minHeight: isLucro ? '4px' : '0px' }} />
                          {i % 2 === 0 && <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">{d.ano}</span>}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20">
                            Ano {d.ano}: R$ {Math.round(d.lucroLiquido).toLocaleString('pt-BR')}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div> 
        </div> 
      </div> 
    </main>
  );
}