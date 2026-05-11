"use client";

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
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

export function DayCurveChart() {
  const data = {
    labels: ['5h','6h','7h','8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h'],
    datasets: [{
        label: 'W/m²',
        data: [0, 18, 95, 230, 420, 620, 790, 891, 860, 730, 560, 360, 170, 52, 4],
        borderColor: '#15803d', // LINHA VERDE ESCURA
        backgroundColor: 'rgba(21, 128, 61, 0.1)', 
        borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 6, // Pontos maiores conforme pedido
      pointHoverRadius: 9,
      pointBackgroundColor: '#1a1a18',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a18',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 14, weight: 'bold' },
        displayColors: false,
        callbacks: {
          label: (context) => `Irradiação: ${context.raw} W/m²`
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { 
          color: '#1a1a18', 
          font: { size: 12, weight: 'bold' } // Destaque nos horários
        } 
      },
            y: { 
            grid: { color: 'rgba(0,0,0,0.05)' }, 
            ticks: { 
                color: '#15803d', // MÉTRICAS EM VERDE ESCURO
                font: { size: 12, weight: 'bold' }, 
                callback: function(value) { return value + ' W' } 
            } 
        }
    }
  };

  return (
    <div className="h-55 w-full">
      <Line data={data} options={options} />
    </div>
  );
}