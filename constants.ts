import {
  CandlestickSeriesPartialOptions,
  ChartOptions,
  ColorType,
  DeepPartial,
} from 'lightweight-charts';

export const navItems = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Search',
    href: '/',
  },
  {
    label: 'All Coins',
    href: '/coins',
  },
];

const CHART_COLORS = {
  background: '#0b1116',
  text: '#8f9fb1',
  grid: '#1a2332',
  border: '#1a2332',
  crosshairVertical: '#ffffff40',
  crosshairHorizontal: '#ffffff20',
  candleUp: '#158A6E',
  candleDown: '#EB1C36',
} as const;

export const getCandlestickConfig = (): CandlestickSeriesPartialOptions => ({
  upColor: CHART_COLORS.candleUp,
  downColor: CHART_COLORS.candleDown,
  wickUpColor: CHART_COLORS.candleUp,
  wickDownColor: CHART_COLORS.candleDown,
  borderVisible: true,
  wickVisible: true,
});

export const getChartConfig = (
  height: number,
  timeVisible: boolean = true,
): DeepPartial<ChartOptions> => ({
  width: 0,
  height,
  layout: {
    background: { type: ColorType.Solid, color: CHART_COLORS.background },
    textColor: CHART_COLORS.text,
    fontSize: 12,
    fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial',
  },
  grid: {
    vertLines: { visible: false },
    horzLines: {
      visible: true,
      color: CHART_COLORS.grid,
      style: 2,
    },
  },
  rightPriceScale: {
    borderColor: CHART_COLORS.border,
  },
  timeScale: {
    borderColor: CHART_COLORS.border,
    timeVisible,
    secondsVisible: false,
  },
  handleScroll: true,
  handleScale: true,
  crosshair: {
    mode: 1,
    vertLine: {
      visible: true,
      color: CHART_COLORS.crosshairVertical,
      width: 1,
      style: 0,
    },
    horzLine: {
      visible: true,
      color: CHART_COLORS.crosshairHorizontal,
      width: 1,
      style: 0,
    },
  },
  localization: {
    priceFormatter: (price: number) =>
      '$' + price.toLocaleString(undefined, { maximumFractionDigits: 2 }),
  },
});

// Original Code
// export const PERIOD_CONFIG: Record<Period, // daily, weekly, monthly, 3months, 6months, yearly, max
//   {
//     days: number | string;                 // number for days, string for max
//     interval?: 'hourly' | 'daily'          // hourly or daily
//   }
// > = {
//   daily: { days: 1, interval: 'hourly' },
//   weekly: { days: 7, interval: 'hourly' },
//   monthly: { days: 30, interval: 'hourly' },
//   '3months': { days: 90, interval: 'daily' },
//   '6months': { days: 180, interval: 'daily' },
//   yearly: { days: 365 },
//   max: { days: 'max' },
// };

// Configuración para CoinGecko Demo API
// IMPORTANTE: La API demo NO acepta el parámetro 'interval'
// La granularidad de los datos la determina automáticamente según los 'days':
// - 1 día: datos cada ~30 minutos
// - 2-90 días: datos cada ~4 horas
// - 91+ días: datos cada 1-4 días
export const PERIOD_CONFIG: Record<
  Period,
  {
    days: number | string;
    interval?: 'hourly' | 'daily'; // Mantenido para compatibilidad de tipos, pero NO se usa
  }
> = {
  daily: { days: 1 },       // ~30 min de granularidad
  weekly: { days: 7 },      // ~4 horas de granularidad
  monthly: { days: 30 },    // ~4 horas de granularidad
  '3months': { days: 90 },  // ~4 horas de granularidad
  '6months': { days: 180 }, // ~1 día de granularidad
  yearly: { days: 365 },    // ~4 días de granularidad
  max: { days: 365 },     // Limitado a 365 días en API Demo
};

export const PERIOD_BUTTONS: { value: Period; label: string }[] = [
  { value: 'daily', label: '1D' },
  { value: 'weekly', label: '1W' },
  { value: 'monthly', label: '1M' },
  { value: '3months', label: '3M' },
  { value: '6months', label: '6M' },
  { value: 'yearly', label: '1Y' },
  { value: 'max', label: 'Max' },
];

export const LIVE_INTERVAL_BUTTONS: { value: '1s' | '1m'; label: string }[] = [
  { value: '1s', label: '1s' },
  { value: '1m', label: '1m' },
];