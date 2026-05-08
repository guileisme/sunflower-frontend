"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Trash2, RotateCcw } from "lucide-react";

interface DrawnArea {
  coordinates: [number, number][];
  areaM2: number;
  estimatedPlates: number;
}

interface RoofMapperProps {
  onAreaCalculated?: (area: DrawnArea) => void;
}

export function RoofMapper({ onAreaCalculated }: RoofMapperProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const featureGroupRef = useRef<any>(null);
  const [drawnArea, setDrawnArea] = useState<DrawnArea | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapCenter: [number, number] = [-8.33, -36.42]; // Belo Jardim, PE

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Verificar se o Leaflet já foi carregado via CDN
    const checkAndInitMap = () => {
      const L = (window as any).L;
      if (!L) {
        // Se não foi carregado, aguardar um pouco e tentar novamente
        setTimeout(checkAndInitMap, 100);
        return;
      }

      try {
        // Corrigir ícones do Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Criar mapa
        const map = L.map(mapContainerRef.current, {
          center: mapCenter,
          zoom: 18,
          zoomControl: true,
        });

        // Adicionar tile layer de satélite
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 20,
          minZoom: 15,
        }).addTo(map);

        // Criar feature group para desenho
        const featureGroup = L.featureGroup().addTo(map);
        featureGroupRef.current = featureGroup;

        // Adicionar controle de desenho
        const drawControl = new (L.Control as any).Draw({
          position: 'topleft',
          draw: {
            polygon: {
              allowIntersection: false,
              shapeOptions: {
                color: '#3B6D11',
                weight: 3,
                fillColor: '#97C459',
                fillOpacity: 0.4,
              }
            },
            rectangle: {
              shapeOptions: {
                color: '#3B6D11',
                weight: 3,
                fillColor: '#97C459',
                fillOpacity: 0.4,
              }
            },
            polyline: false,
            circle: false,
            marker: false,
            circlemarker: false,
          },
          edit: {
            featureGroup: featureGroup,
            remove: true,
          }
        });

        map.addControl(drawControl);

        // Event listeners
        const handleDrawing = () => {
          updateCalculations(featureGroup, L);
        };

        map.on((L.Draw as any).Event.CREATED, handleDrawing);
        map.on((L.Draw as any).Event.EDITED, handleDrawing);
        map.on((L.Draw as any).Event.DELETED, handleDrawing);

        mapRef.current = map;
        setIsMapReady(true);
      } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
        setTimeout(checkAndInitMap, 500);
      }
    };

    checkAndInitMap();

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error('Erro ao remover mapa:', e);
        }
      }
    };
  }, []);

  const updateCalculations = (featureGroup: any, L: any) => {
    const layers = featureGroup.getLayers();
    if (layers.length === 0) {
      setDrawnArea(null);
      return;
    }

    let totalArea = 0;
    let allCoords: [number, number][] = [];

    layers.forEach((layer: any) => {
      let latlngs: any;
      if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        latlngs = layer.getLatLngs()[0];
        const coords = latlngs.map((ll: any) => [ll.lat, ll.lng]);
        allCoords = coords;
        totalArea += calculateArea(coords);
      }
    });

    const plates = Math.floor(totalArea / 2);
    const result = {
      coordinates: allCoords,
      areaM2: Math.round(totalArea * 100) / 100,
      estimatedPlates: plates
    };

    setDrawnArea(result);
    onAreaCalculated?.(result);
  };

  const calculateArea = (coords: [number, number][]) => {
    if (coords.length < 3) return 0;
    const avgLat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const mLat = 111320;
    const mLng = 111320 * Math.cos((avgLat * Math.PI) / 180);

    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      const x1 = coords[i][1] * mLng;
      const y1 = coords[i][0] * mLat;
      const x2 = coords[j][1] * mLng;
      const y2 = coords[j][0] * mLat;
      area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area) / 2;
  };

  const handleClear = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      setDrawnArea(null);
    }
  };

  const handleReset = () => {
    if (mapRef.current) {
      mapRef.current.setView(mapCenter, 18);
      handleClear();
    }
  };

  return (
    <div className="space-y-4">
      {/* Carregar CSS do Leaflet via CDN */}
      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/leaflet-draw/1.0.4/leaflet.draw.min.css');
      `}</style>

      {/* Carregar scripts do Leaflet via CDN */}
      {typeof window !== 'undefined' && !((window as any).L) && (
        <>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" async></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet-draw/1.0.4/leaflet.draw.umd.js" async></script>
        </>
      )}

      <Card className="border-black/10 shadow-md rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div
            ref={mapContainerRef}
            className="w-full h-96 md:h-[500px] lg:h-[600px] bg-gray-200 relative"
            style={{ minHeight: '400px' }}
          >
            {!isMapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center">
                  <div className="animate-spin mb-4">
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-sun-green-600 rounded-full mx-auto"></div>
                  </div>
                  <p className="text-gray-600 font-bold">Carregando mapa...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-black/10 shadow-md rounded-xl bg-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-black text-sun-text mb-4">Ferramentas</h3>
            <div className="space-y-2">
              <button
                onClick={handleClear}
                className="w-full flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-2.5 rounded-lg font-bold text-sm border border-red-200 hover:bg-red-200 transition-colors"
              >
                <Trash2 size={18} /> Limpar Desenho
              </button>
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-4 py-2.5 rounded-lg font-bold text-sm border border-blue-200 hover:bg-blue-200 transition-colors"
              >
                <RotateCcw size={18} /> Resetar Mapa
              </button>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-bold text-blue-700 mb-2">📍 Como usar:</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Clique no ícone de polígono (canto superior esquerdo)</li>
                <li>• Clique nos cantos da área</li>
                <li>• Duplo clique para finalizar</li>
                <li>• Edite ou delete conforme necessário</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {drawnArea ? (
          <Card className="border-black/10 shadow-md rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-black text-sun-text mb-4">Área Calculada</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-xs font-bold uppercase text-[#6b6a64] mb-1">Metros Quadrados</p>
                  <p className="text-3xl font-black text-[#15803d]">{drawnArea.areaM2}</p>
                  <p className="text-xs text-[#6b6a64] mt-1">m²</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-xs font-bold uppercase text-[#6b6a64] mb-1">Placas Solares Estimadas</p>
                  <p className="text-3xl font-black text-sun-green-600">{drawnArea.estimatedPlates}</p>
                  <p className="text-xs text-[#6b6a64] mt-1">placas (2m² cada)</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-xs font-bold uppercase text-[#6b6a64] mb-1">Potência Estimada</p>
                  <p className="text-3xl font-black text-sun-amber-600">
                    {(drawnArea.estimatedPlates * 0.4).toFixed(1)} kW
                  </p>
                  <p className="text-xs text-[#6b6a64] mt-1">400W por placa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-black/10 shadow-md rounded-xl bg-white">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
              <MapPin size={40} className="text-[#6b6a64] mb-3" />
              <h3 className="text-lg font-black text-sun-text mb-2">Nenhuma Área Desenhada</h3>
              <p className="text-sm text-[#6b6a64] text-center">
                Desenhe um polígono ou retângulo no mapa para calcular a área útil.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-black/10 shadow-md rounded-xl bg-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-black text-sun-text mb-4">Informações</h3>
            <div className="space-y-3">
              <div className="p-3 bg-[#eeede8] rounded-lg border border-black/5">
                <p className="text-xs font-bold uppercase text-[#6b6a64] mb-1">Dimensão Placa</p>
                <p className="text-sm font-black text-sun-text">2.0 m × 1.0 m</p>
              </div>
              <div className="p-3 bg-[#eeede8] rounded-lg border border-black/5">
                <p className="text-xs font-bold uppercase text-[#6b6a64] mb-1">Potência Placa</p>
                <p className="text-sm font-black text-sun-text">400 W</p>
              </div>
              <div className="p-3 bg-[#eeede8] rounded-lg border border-black/5">
                <p className="text-xs font-bold uppercase text-[#6b6a64] mb-1">Localização</p>
                <p className="text-sm font-black text-sun-text">
                  {mapCenter[0].toFixed(2)}°, {mapCenter[1].toFixed(2)}°
                </p>
              </div>
              <div className={`p-3 rounded-lg border ${isMapReady ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <p className={`text-xs font-bold uppercase ${isMapReady ? 'text-green-700' : 'text-yellow-700'} mb-1`}>Status</p>
                <p className={`text-sm font-black ${isMapReady ? 'text-green-700' : 'text-yellow-700'}`}>
                  {isMapReady ? '✅ Pronto' : '⏳ Carregando...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
