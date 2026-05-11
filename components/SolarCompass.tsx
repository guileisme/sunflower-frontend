"use client";


export function SolarCompass({ azimuth = 214, polar = 38 }) {
  const angleRad = (azimuth - 90) * (Math.PI / 180);
  const pointerX = 65 + 42 * Math.cos(angleRad);
  const pointerY = 65 + 42 * Math.sin(angleRad);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative mb-6">
        <svg width="150" height="150" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="58" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" fill="none" />
          <circle cx="65" cy="65" r="40" stroke="#f3f4f6" strokeWidth="1" fill="none" />
          
          {/* Eixos Cardinais */}
          <line x1="65" y1="12" x2="65" y2="118" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="12" y1="65" x2="118" y2="65" stroke="#e5e7eb" strokeWidth="1" />
          
          {/* PONTOS CARDINAIS: Agora muito mais destacados */}
          <text x="65" y="10" textAnchor="middle" fontSize="12" fontWeight="900" className="fill-sun-green-600">N</text>
          <text x="65" y="128" textAnchor="middle" fontSize="11" fontWeight="800" className="fill-[#6b6a64]">S</text>
          <text x="5" y="69" textAnchor="start" fontSize="11" fontWeight="800" className="fill-[#6b6a64]">O</text>
          <text x="125" y="69" textAnchor="end" fontSize="11" fontWeight="800" className="fill-[#6b6a64]">L</text>
          
          {/* Ponteiro */}
          <line x1="65" y1="65" x2={pointerX} y2={pointerY} stroke="#EF9F27" strokeWidth="4" strokeLinecap="round" />
          <circle cx={pointerX} cy={pointerY} r="6" fill="#EF9F27" stroke="white" strokeWidth="2" />
          <circle cx="65" cy="65" r="5" fill="#3B6D11" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-70">
        <div className="bg-[#f9f9f7] border border-black/5 p-3 rounded-xl text-center shadow-sm">
          <p className="text-[10px] font-black uppercase text-[#6b6a64] tracking-widest mb-1">Azimutal</p>
          <p className="text-xl font-black text-sun-text">{azimuth}°</p>
        </div>
        <div className="bg-[#f9f9f7] border border-black/5 p-3 rounded-xl text-center shadow-sm">
          <p className="text-[10px] font-black uppercase text-[#6b6a64] tracking-widest mb-1">Polar</p>
          <p className="text-xl font-black text-sun-text">{polar}°</p>
        </div>
      </div>
    </div>
  );
}