/**
 * Utilitários para cálculos de área de telhado e estimativas de placas solares
 */

export interface SolarPlateSpecs {
  lengthM: number;      // Comprimento em metros
  widthM: number;       // Largura em metros
  powerW: number;       // Potência em watts
  areaM2: number;       // Área em m²
}

export interface RoofCalculationResult {
  areaM2: number;
  estimatedPlates: number;
  estimatedPowerW: number;
  estimatedPowerKW: number;
  estimatedAnnualEnergyKWh: number;
  estimatedAnnualSavingsR$: number;
  roiYears: number;
}

// Especificações padrão de placa solar
export const DEFAULT_PLATE_SPECS: SolarPlateSpecs = {
  lengthM: 2.0,
  widthM: 1.0,
  powerW: 400,
  areaM2: 2.0,
};

// Constantes de cálculo
export const SOLAR_CONSTANTS = {
  METERS_PER_DEGREE_LAT: 111320,
  AVERAGE_DAILY_SUNLIGHT_HOURS: 5, // Horas de sol pleno por dia (média Brasil)
  AVERAGE_SYSTEM_EFFICIENCY: 0.85, // 85% de eficiência do sistema
  ELECTRICITY_PRICE_PER_KWH: 0.75, // R$ por kWh (média Brasil)
  INSTALLATION_COST_PER_KW: 5000, // R$ por kW instalado
};

/**
 * Calcula a área de um polígono usando a fórmula de Shoelace
 * @param coordinates Array de coordenadas [latitude, longitude]
 * @returns Área em metros quadrados
 */
export function calculatePolygonAreaM2(coordinates: [number, number][]): number {
  if (coordinates.length < 3) return 0;

  // Calcular o raio de metros por grau de longitude
  const avgLatitude = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
  const metersPerDegreeLng = SOLAR_CONSTANTS.METERS_PER_DEGREE_LAT * Math.cos((avgLatitude * Math.PI) / 180);

  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const lat1 = coordinates[i][0];
    const lng1 = coordinates[i][1];
    const lat2 = coordinates[j][0];
    const lng2 = coordinates[j][1];

    const x1 = lng1 * metersPerDegreeLng;
    const y1 = lat1 * SOLAR_CONSTANTS.METERS_PER_DEGREE_LAT;
    const x2 = lng2 * metersPerDegreeLng;
    const y2 = lat2 * SOLAR_CONSTANTS.METERS_PER_DEGREE_LAT;

    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
}

/**
 * Calcula a área de um retângulo definido por limites lat/lng
 * @param north Latitude norte
 * @param south Latitude sul
 * @param east Longitude leste
 * @param west Longitude oeste
 * @returns Área em metros quadrados
 */
export function calculateRectangleAreaM2(
  north: number,
  south: number,
  east: number,
  west: number
): number {
  const avgLatitude = (north + south) / 2;
  const metersPerDegreeLng = SOLAR_CONSTANTS.METERS_PER_DEGREE_LAT * Math.cos((avgLatitude * Math.PI) / 180);

  const latDiff = north - south;
  const lngDiff = east - west;

  const height = latDiff * SOLAR_CONSTANTS.METERS_PER_DEGREE_LAT;
  const width = lngDiff * metersPerDegreeLng;

  return height * width;
}

/**
 * Estima o número de placas solares que cabem em uma área
 * @param areaM2 Área em metros quadrados
 * @param plateSpecs Especificações da placa solar
 * @returns Número estimado de placas
 */
export function estimatePlateCount(
  areaM2: number,
  plateSpecs: SolarPlateSpecs = DEFAULT_PLATE_SPECS
): number {
  return Math.floor(areaM2 / plateSpecs.areaM2);
}

/**
 * Calcula a potência total instalada
 * @param plateCount Número de placas
 * @param plateSpecs Especificações da placa
 * @returns Potência em watts
 */
export function calculateTotalPowerW(
  plateCount: number,
  plateSpecs: SolarPlateSpecs = DEFAULT_PLATE_SPECS
): number {
  return plateCount * plateSpecs.powerW;
}

/**
 * Calcula a energia anual gerada (em kWh)
 * @param powerW Potência em watts
 * @param dailySunlightHours Horas de sol pleno por dia
 * @param systemEfficiency Eficiência do sistema (0-1)
 * @returns Energia anual em kWh
 */
export function calculateAnnualEnergyKWh(
  powerW: number,
  dailySunlightHours: number = SOLAR_CONSTANTS.AVERAGE_DAILY_SUNLIGHT_HOURS,
  systemEfficiency: number = SOLAR_CONSTANTS.AVERAGE_SYSTEM_EFFICIENCY
): number {
  const powerKW = powerW / 1000;
  const annualHours = dailySunlightHours * 365;
  return powerKW * annualHours * systemEfficiency;
}

/**
 * Calcula a economia anual em reais
 * @param annualEnergyKWh Energia anual em kWh
 * @param electricityPricePerKWh Preço da eletricidade por kWh
 * @returns Economia anual em reais
 */
export function calculateAnnualSavingsR$(
  annualEnergyKWh: number,
  electricityPricePerKWh: number = SOLAR_CONSTANTS.ELECTRICITY_PRICE_PER_KWH
): number {
  return annualEnergyKWh * electricityPricePerKWh;
}

/**
 * Calcula o ROI (Retorno sobre Investimento) em anos
 * @param powerKW Potência em kW
 * @param annualSavingsR$ Economia anual em reais
 * @param costPerKW Custo por kW instalado
 * @returns ROI em anos
 */
export function calculateROIYears(
  powerKW: number,
  annualSavingsR$: number,
  costPerKW: number = SOLAR_CONSTANTS.INSTALLATION_COST_PER_KW
): number {
  const totalCost = powerKW * costPerKW;
  if (annualSavingsR$ === 0) return Infinity;
  return totalCost / annualSavingsR$;
}

/**
 * Função principal que calcula todos os parâmetros
 * @param areaM2 Área em metros quadrados
 * @param plateSpecs Especificações da placa (opcional)
 * @returns Resultado completo do cálculo
 */
export function calculateRoofMetrics(
  areaM2: number,
  plateSpecs: SolarPlateSpecs = DEFAULT_PLATE_SPECS
): RoofCalculationResult {
  const estimatedPlates = estimatePlateCount(areaM2, plateSpecs);
  const estimatedPowerW = calculateTotalPowerW(estimatedPlates, plateSpecs);
  const estimatedPowerKW = estimatedPowerW / 1000;
  const estimatedAnnualEnergyKWh = calculateAnnualEnergyKWh(estimatedPowerW);
  const estimatedAnnualSavingsR$ = calculateAnnualSavingsR$(estimatedAnnualEnergyKWh);
  const roiYears = calculateROIYears(estimatedPowerKW, estimatedAnnualSavingsR$);

  return {
    areaM2: Math.round(areaM2 * 100) / 100,
    estimatedPlates,
    estimatedPowerW,
    estimatedPowerKW: Math.round(estimatedPowerKW * 100) / 100,
    estimatedAnnualEnergyKWh: Math.round(estimatedAnnualEnergyKWh * 100) / 100,
    estimatedAnnualSavingsR$: Math.round(estimatedAnnualSavingsR$ * 100) / 100,
    roiYears: Math.round(roiYears * 10) / 10,
  };
}

/**
 * Formata valores para exibição
 */
export const formatters = {
  areaM2: (value: number) => `${value.toFixed(2)} m²`,
  powerW: (value: number) => `${(value / 1000).toFixed(2)} kW`,
  powerKW: (value: number) => `${value.toFixed(2)} kW`,
  energyKWh: (value: number) => `${value.toFixed(0)} kWh/ano`,
  savingsR$: (value: number) => `R$ ${value.toFixed(2)}/ano`,
  roi: (value: number) => `${value.toFixed(1)} anos`,
  plates: (value: number) => `${value} placas`,
};
