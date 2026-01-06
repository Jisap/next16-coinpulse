"use client"


import { PERIOD_BUTTONS } from '@/constants';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import React, { useRef, useState, useTransition } from 'react'

const CandlestickChart = ({
  children,
  data,
  coinId,
  height = 360,
  initialPeriod = 'daily',
}: CandlestickChartProps) => {

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const prevOhlcDataLength = useRef<number>(data?.length || 0);

  const [period, setPeriod] = useState(initialPeriod);
  const [ohlcData, setOhlcData] = useState<OHLCData[]>(data ?? []);
  const [isPending, startTransition] = useTransition();

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

          {PERIOD_BUTTONS.map(({ value, label }) => (
            <button
              key={value}
              className='config-button'
              onClick={() => { }}
              disabled={isPending}
            >

              {label}
            </button>


          ))}
        </div>
      </div>
    </div>
  )
}

export default CandlestickChart