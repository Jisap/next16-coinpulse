"use client"


import { getCandlestickConfig, getChartConfig, LIVE_INTERVAL_BUTTONS, PERIOD_BUTTONS, PERIOD_CONFIG } from '@/constants';
import { fetcher } from '@/lib/coingecko.action';
import { convertOHLCData } from '@/lib/utils';
import { CandlestickSeries, createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import React, { useEffect, useRef, useState, useTransition } from 'react'

const CandlestickChart = ({
  children,
  data,
  coinId,
  height = 360,
  initialPeriod = 'daily',
  liveOhlcv = null,
  mode = 'historical',
  liveInterval,
  setLiveInterval,
}: CandlestickChartProps) => {

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const prevOhlcDataLength = useRef<number>(data?.length || 0);

  const [period, setPeriod] = useState(initialPeriod); // daily, weekly, monthly, 3months, 6months, yearly, max
  const [ohlcData, setOhlcData] = useState<OHLCData[]>(data ?? []);
  const [isPending, startTransition] = useTransition(); //

  const fetchOHLCData = async (selectedPeriod: Period) => {
    try {
      const { days, interval } = PERIOD_CONFIG[selectedPeriod]; // daily: { days: 1, interval: 'hourly' }, weekly: { days: 7, interval: 'hourly' }, etc

      // Construir parámetros base
      const params: Record<string, string | number> = {
        vs_currency: 'usd',
        days,
      };

      // Solo incluir interval si está definido en PERIOD_CONFIG
      if (interval) {
        params.interval = interval;
      }

      console.log('Fetching OHLC data:', { period: selectedPeriod, params });
      const newData = await fetcher<OHLCData[]>(`/coins/${coinId}/ohlc`, params);
      console.log('Received data points:', newData?.length);
      setOhlcData(newData ?? []);
      console.log('newData', newData)
      setOhlcData(newData ?? [])
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
    }
  }

  const handlePeriodChange = (newPeriod: Period) => {
    if (newPeriod === period) return;

    startTransition(async () => {
      setPeriod(newPeriod);
      await fetchOHLCData(newPeriod);
    })
  }

  // Este useEffect es el responsable de crear, configurar y destruir 
  // la instancia del gráfico de la librería lightweight-charts
  useEffect(() => {
    const container = chartContainerRef.current;                                                // Nos aseguramos que el div que contendrá el gráfico ya exista en la página
    if (!container) return;

    const showTime = ['daily', 'weekly', 'monthly'].includes(period);                           // Nos aseguramos de que el periodo a mostrar este incluido en el array permitido

    const chart = createChart(container, {                                                      // Creamos una instancia del gráfico dentro del div refenciado 
      ...getChartConfig(height, showTime),                                                      // getChartConfig contiene la configuración (height para la altura del gráfico y showtime como boolean para saber si se muestra el la hora en el eje x)
      width: container.clientWidth,
    });

    const series = chart.addSeries(CandlestickSeries, getCandlestickConfig());                  // Sobre la instacia del gráfico se añade una serie CandlesticSeries que es la representación de las velas. El get es la configuración de las velas.

    const convertedToSeconds = ohlcData.map(                                                    // La libreria espera datos en segundos pero coingecko da los datos en milisegundos por eso se divide entre 1000
      (item) => [Math.floor(item[0] / 1000), item[1], item[2], item[3], item[4]] as OHLCData,
    );

    series.setData(convertOHLCData(convertedToSeconds));                                        // Los datos ya procesados se pasan a la serie de velas usando series.setData().                                       
    chart.timeScale().fitContent();                                                             // Ajusta el zoom y la posición del gráfico para que todos los datos sean visibles.

    chartRef.current = chart;
    candleSeriesRef.current = series;

    const observer = new ResizeObserver((entries) => {                                          // Se crea un ResizeObserver. Este es un API del navegador que "observa" un elemento del DOM y ejecuta una función cada vez que su tamaño cambia.
      if (!entries.length) return;
      chart.applyOptions({ width: entries[0].contentRect.width });                              // cuando el div contenedor del gráfico cambia de tamaño, se actualiza el ancho del gráfico (chart.applyOptions({ width: ... })). Esto hace que el gráfico sea responsivo y se adapte al layout de la página.  
    });
    observer.observe(container);

    return () => {                                                                              // Cuando el componente se desmonta, se desconecta el observer y se limpian las referencias al gráfico y la serie de velas. 
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };

  }, [height]);

  // NUEVO useEffect: Actualizar la configuración del timeScale cuando cambia period
  useEffect(() => {
    if (!chartRef.current) return;

    const showTime = ['daily', 'weekly', 'monthly'].includes(period);
    chartRef.current.applyOptions({
      ...getChartConfig(height, showTime),
    });
  }, [period, height]);

  // Este useEffect es el responsable de actualizar el gráfico cuando los datos cambian
  useEffect(() => {
    if (!candleSeriesRef.current) return;                                                       // Verifica que la serie de velas ya exista. Si el gráfico no se ha creado todavía (por el primer useEffect), no hace nada para evitar errores.

    const convertedToSeconds = ohlcData.map(                                                    // Toma los datos históricos (ohlcData) y divide los timestamps por 1000. Se adaptan asi los datos a la libreria lightweight-charts que espera datos en segundos.
      (item) => [Math.floor(item[0] / 1000), item[1], item[2], item[3], item[4]] as OHLCData,
    );

    let merged: OHLCData[];

    if (liveOhlcv) {                                                                            // Si hay datos en vivo disponibles
      const liveTimestamp = liveOhlcv[0];                                                       // Obtiene el timestamp de la vela en vivo

      const lastHistoricalCandle = convertedToSeconds[convertedToSeconds.length - 1];           // Obtiene la última vela del historial

      if (lastHistoricalCandle && lastHistoricalCandle[0] === liveTimestamp) {                  // Si la última vela histórica coincide en tiempo con la vela en vivo
        merged = [...convertedToSeconds.slice(0, -1), liveOhlcv];                               // Reemplaza la última vela histórica con la vela en vivo actualizada
      } else {                                                                                  // Si no coinciden (es una nueva vela)
        merged = [...convertedToSeconds, liveOhlcv];                                            // Añade la vela en vivo al final del array
      }
    } else {
      merged = convertedToSeconds;
    }

    merged.sort((a, b) => a[0] - b[0]);

    const converted = convertOHLCData(merged);
    candleSeriesRef.current.setData(converted);

    const dataChanged = prevOhlcDataLength.current !== ohlcData.length;

    if (dataChanged || mode === 'historical') {
      chartRef.current?.timeScale().fitContent();
      prevOhlcDataLength.current = ohlcData.length;
    }
  }, [ohlcData, period, liveOhlcv, mode]);


  return (
    <div id="candlestick-chart">
      <div className='chart-header'>
        <div className='flex-1'>
          {children}
        </div>

        <div className='button-group'>
          <span className='text-sm mx-2 font-medium text-purple-100/50'>
            Period
          </span>

          {PERIOD_BUTTONS.map(({ value, label }) => (  // { value: 'daily', label: '1D' }, etc
            <button
              key={value}
              className={period === value ? 'config-button-active' : 'config-button'}
              onClick={() => handlePeriodChange(value)}
              disabled={isPending}
            >

              {label}
            </button>
          ))}
        </div>

        {liveInterval && (
          <div className="button-group">
            <span className="text-sm mx-2 font-medium text-purple-100/50">Update Frequency:</span>
            {LIVE_INTERVAL_BUTTONS.map(({ value, label }) => (
              <button
                key={value}
                className={liveInterval === value ? 'config-button-active' : 'config-button'}
                onClick={() => setLiveInterval && setLiveInterval(value)}
                disabled={isPending}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={chartContainerRef}
        className='chart'
        style={{ height }}
      />
    </div>
  )
}

export default CandlestickChart