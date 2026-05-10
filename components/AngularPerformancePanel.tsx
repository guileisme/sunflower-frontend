"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Crosshair, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

export function AngularPerformancePanel() {
  // Simulação de dados em tempo real (em produção, viria do seu backend/sensores IoT)
  const [sunAzimuth, setSunAzimuth] = useState(214.5);
  const [sunPolar, setSunPolar] = useState(38.2);
  
  // A placa tenta copiar o sol, com uma leve margem de erro mecânico (0.1 a 0.3 graus)
  const [panelAzimuth, setPanelAzimuth] = useState(214.3);
  const [panelPolar, setPanelPolar] = useState(38.4);

  // Efeito para criar uma leve flutuação nos dados, simulando a leitura do sensor
  useEffect(() => {
    const interval = setInterval(() => {
      setSunAzimuth(prev => +(prev + Math.random() * 0.2 - 0.1).toFixed(1));
      setPanelAzimuth(prev => +(prev + Math.random() * 0.2 - 0.1).toFixed(1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const deviation = Math.abs((sunAzimuth - panelAzimuth) + (sunPolar - panelPolar)).toFixed(2);

  // Dados para provar o ganho de eficiência do Rastreio Biaxial vs Fixo
  const chartData = {
    labels: ['6h', '8h', '10h', '12h', '14h', '16h', '18h'],
    datasets: [
      {
        label: 'Rastreio Biaxial (W/m²)',
        data: [250, 680, 850, 890, 820, 650, 200],
        borderColor: '#15803d', // Verde escuro principal
        backgroundColor: 'rgba(21, 128, 61, 0.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#15803d',
      },
      {
        label: 'Placa Fixa (W/m²)',
        data: [50, 300, 650, 880, 600, 250, 40],
        borderColor: '#e5e7eb', // Cinza claro
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5], // Linha tracejada
        tension: 0.4,
        pointRadius: 0,
      }
    ]
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12, weight: 'bold' },
          color: '#1a1a18'
        }
      },
      tooltip: {
        backgroundColor: '#1a1a18',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 13, weight: 'bold' }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b6a64', font: { size: 11, weight: 'bold' } }
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#6b6a64', font: { size: 11, weight: 'bold' } }
      }
    }
  };

  return (
    <Card className="border-black/5 shadow-md rounded-xl bg-white overflow-hidden">
      <CardContent className="p-0">
        
        {/* ── Cabeçalho do Painel ── */}
        <div className="bg-[#f9f9f7] p-6 border-b border-black/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-sm uppercase font-black text-sun-text tracking-[0.2em] flex items-center gap-2">
              <Crosshair size={18} className="text-sun-amber-400" />
              Sincronia Biaxial
            </h3>
            <p className="text-xs text-[#6b6a64] font-bold mt-1">
              Desvio angular atual: <span className="text-red-500">{deviation}°</span>
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-green-100 text-[#15803d] px-4 py-2 rounded-lg border border-green-200 flex flex-col items-end shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Ganho Diário</span>
              <span className="text-xl font-black flex items-center gap-1">
                +34.2% <TrendingUp size={16} strokeWidth={3} />
              </span>
            </div>
          </div>
        </div>

        {/* ── Comparador de Ângulos ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/5">
          {/* Dados do Sol */}
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <Sun size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase font-black tracking-widest text-[#6b6a64]">Posição Alvo (Sol)</p>
              <div className="flex items-center gap-4 mt-1">
                <p className="font-black text-sun-text">Azm: {sunAzimuth}°</p>
                <p className="font-black text-sun-text">Pol: {sunPolar}°</p>
              </div>
            </div>
          </div>

          {/* Dados da Placa */}
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sun-green-600 flex items-center justify-center text-white shrink-0">
              <Zap size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase font-black tracking-widest text-[#6b6a64]">Atuadores da Placa</p>
              <div className="flex items-center gap-4 mt-1">
                <p className="font-black text-[#15803d]">Azm: {panelAzimuth}°</p>
                <p className="font-black text-[#15803d]">Pol: {panelPolar}°</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Gráfico de Ganho de Eficiência ── */}
        <div className="p-6">
          <p className="text-[11px] font-bold text-[#6b6a64] uppercase tracking-wider mb-4">
            Curva de Captação — Fixo vs. Rastreio (Agreste)
          </p>
          <div className="h-60 w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}