"use client";

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
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function EnergyChart() {
  const data = {
    labels: ['6h','7h','8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h'],
    datasets: [{
      label: 'kWh/m²',
      data: [0.1, 0.4, 1.2, 2.8, 4.5, 5.9, 6.4, 5.8, 4.6, 3.1, 1.8, 0.7, 0.1],
      backgroundColor: '#97C459', 
      borderColor: '#3B6D11',     
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  // Tipando explicitamente as options para evitar o erro de atribuição
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a18',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 14, weight: 'bold' },
        padding: 12,
        displayColors: false,
      }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: {
          color: '#1a1a18',
          font: {
            size: 13,
            // AQUI ESTÁ A CORREÇÃO: Usamos "as const" ou "bold"
            weight: 'bold' 
          }
        }
      },
            y: { 
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { 
                color: '#15803d', // VERDE ESCURO
                font: {
                size: 13,
                weight: 'bold'
                },
                callback: function(value) { return value + ' kWh' }
            }
        }
    }
  };

  return (
    <div className="h-64 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}