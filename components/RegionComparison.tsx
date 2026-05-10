"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Cloud, Wind, Thermometer, TrendingUp, MapPin } from "lucide-react";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Region {
  id: string;
  name: string;
  state: string;
  date: string;
  viability: number;
  irradiation: number;
  temperature: number;
  cloudiness: number;
  wind: number;
  roi: string;
}

interface RegionComparisonProps {
  region1?: Region;
  region2?: Region;
}

export function RegionComparison({ region1, region2 }: RegionComparisonProps) {
  // Dados de exemplo para demonstração
  const defaultRegion1: Region = {
    id: '1',
    name: 'Belo Jardim',
    state: 'PE',
    date: '18/04/2026',
    viability: 84,
    irradiation: 6.4,
    temperature: 32,
    cloudiness: 15,
    wind: 12,
    roi: '4.2 anos'
  };

  const defaultRegion2: Region = {
    id: '2',
    name: 'Caruaru',
    state: 'PE',
    date: '18/04/2026',
    viability: 78,
    irradiation: 5.9,
    temperature: 30,
    cloudiness: 22,
    wind: 14,
    roi: '4.8 anos'
  };

  const r1 = region1 || defaultRegion1;
  const r2 = region2 || defaultRegion2;

  // Dados para o gráfico de comparação
  const comparisonData = {
    labels: ['Viabilidade (%)', 'Irradiação (kWh/m²)', 'Temperatura (°C)', 'Nebulosidade (%)', 'Vento (km/h)'],
    datasets: [
      {
        label: `${r1.name}, ${r1.state}`,
        data: [r1.viability, r1.irradiation * 10, r1.temperature, r1.cloudiness, r1.wind],
        backgroundColor: '#97C459',
        borderColor: '#3B6D11',
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: `${r2.name}, ${r2.state}`,
        data: [r2.viability, r2.irradiation * 10, r2.temperature, r2.cloudiness, r2.wind],
        backgroundColor: '#C4D96F',
        borderColor: '#639922',
        borderWidth: 1,
        borderRadius: 6,
      }
    ]
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          font: { size: 13, weight: 'bold' },
          color: '#1a1a18',
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: '#1a1a18',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 14, weight: 'bold' },
        padding: 12,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#1a1a18',
          font: { size: 12, weight: 'bold' }
        }
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          color: '#15803d',
          font: { size: 12, weight: 'bold' }
        }
      }
    }
  };

  const renderMetric = (icon: React.ElementType, label: string, value: string | number, color: string) => (
    <div className="flex items-center gap-3 p-3 bg-[#eeede8] rounded-lg border border-black/5">
      {React.createElement(icon, { size: 20, className: `text-${color}` })}
      <div>
        <p className="text-xs text-[#6b6a64] font-bold uppercase">{label}</p>
        <p className="text-lg font-black text-sun-text">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Cards de Comparação Lado a Lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Região 1 */}
        <Card className="border-black/10 shadow-md rounded-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin size={24} className="text-sun-green-600" />
              <div>
                <h3 className="text-xl font-black text-sun-text">{r1.name}</h3>
                <p className="text-xs text-[#6b6a64]">{r1.state} • {r1.date}</p>
              </div>
            </div>

            {/* Viabilidade Score */}
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-xs font-bold uppercase text-[#6b6a64] mb-2">Viabilidade</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#15803d]">{r1.viability}</span>
                <span className="text-sm font-bold text-[#15803d]">/ 100</span>
              </div>
              <div className="w-full h-2 mt-2 bg-white rounded-full overflow-hidden border border-green-200">
                <div className="bg-[#15803d] h-full" style={{ width: `${r1.viability}%` }} />
              </div>
            </div>

            {/* Métricas */}
            <div className="space-y-2">
              {renderMetric(Sun, 'Irradiação', `${r1.irradiation} kWh/m²`, 'sun-green-600')}
              {renderMetric(Thermometer, 'Temperatura', `${r1.temperature}°C`, 'orange-600')}
              {renderMetric(Cloud, 'Nebulosidade', `${r1.cloudiness}%`, 'blue-600')}
              {renderMetric(Wind, 'Vento', `${r1.wind} km/h`, 'teal-600')}
              {renderMetric(TrendingUp, 'ROI Estimado', r1.roi, 'indigo-600')}
            </div>
          </CardContent>
        </Card>

        {/* Região 2 */}
        <Card className="border-black/10 shadow-md rounded-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin size={24} className="text-sun-green-600" />
              <div>
                <h3 className="text-xl font-black text-sun-text">{r2.name}</h3>
                <p className="text-xs text-[#6b6a64]">{r2.state} • {r2.date}</p>
              </div>
            </div>

            {/* Viabilidade Score */}
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-xs font-bold uppercase text-[#6b6a64] mb-2">Viabilidade</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#15803d]">{r2.viability}</span>
                <span className="text-sm font-bold text-[#15803d]">/ 100</span>
              </div>
              <div className="w-full h-2 mt-2 bg-white rounded-full overflow-hidden border border-green-200">
                <div className="bg-[#15803d] h-full" style={{ width: `${r2.viability}%` }} />
              </div>
            </div>

            {/* Métricas */}
            <div className="space-y-2">
              {renderMetric(Sun, 'Irradiação', `${r2.irradiation} kWh/m²`, 'sun-green-600')}
              {renderMetric(Thermometer, 'Temperatura', `${r2.temperature}°C`, 'orange-600')}
              {renderMetric(Cloud, 'Nebulosidade', `${r2.cloudiness}%`, 'blue-600')}
              {renderMetric(Wind, 'Vento', `${r2.wind} km/h`, 'teal-600')}
              {renderMetric(TrendingUp, 'ROI Estimado', r2.roi, 'indigo-600')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Comparação */}
      <Card className="border-black/10 shadow-md rounded-xl bg-white">
        <CardContent className="p-6">
          <h3 className="text-lg font-black text-sun-text mb-6">Análise Comparativa</h3>
          <div className="h-80 w-full">
            <Bar data={comparisonData} options={options} />
          </div>
        </CardContent>
      </Card>

      {/* Recomendação */}
      <Card className="border-black/10 shadow-md rounded-xl bg-linear-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-black text-sun-text mb-2">Recomendação</h3>
          <p className="text-[#4a4944] font-bold">
            {r1.viability > r2.viability 
              ? `${r1.name} apresenta melhor viabilidade solar (${r1.viability}% vs ${r2.viability}%). Recomenda-se priorizar a instalação nesta região.`
              : `${r2.name} apresenta melhor viabilidade solar (${r2.viability}% vs ${r1.viability}%). Recomenda-se priorizar a instalação nesta região.`
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
