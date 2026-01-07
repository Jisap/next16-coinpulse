import Categories from "@/components/home/Categories";
import CoinOverview from "@/components/home/CoinOverview";
import { CategoriesFallback, CoinOverviewFallback, TrendingCoinsFallback } from "@/components/home/fallback";
import TrendingCoins from "@/components/home/TrendingCoins";
import { Suspense } from "react";





const dummyData: TrendingCoin[] = [
  {
    item: {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      market_cap_rank: 1,
      thumb: '/logo.svg',
      large: '/logo.svg',
      data: {
        price: 67000,
        price_change_percentage_24h: {
          usd: 2.5,
        },
      },
    },
  },
  {
    item: {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      market_cap_rank: 2,
      thumb: '/logo.svg',
      large: '/logo.svg',
      data: {
        price: 3500,
        price_change_percentage_24h: {
          usd: -1.2,
        },
      },
    },
  },
  {
    item: {
      id: 'solana',
      name: 'Solana',
      symbol: 'SOL',
      market_cap_rank: 3,
      thumb: 'logo.svg',
      large: '/logo.svg',
      data: {
        price: 150,
        price_change_percentage_24h: {
          usd: 5.8,
        },
      },
    },
  },
];

const Page = async () => {





  return (
    <main className='main-container'>
      <section className='home-grid'>
        <Suspense fallback={<CoinOverviewFallback />}>
          <CoinOverview />
        </Suspense>

        <Suspense fallback={<TrendingCoinsFallback />}>
          <TrendingCoins />
        </Suspense>
      </section>


      <section className='w-full mt-7 space-y-4'>
        <Suspense fallback={<CategoriesFallback />}>
          <Categories />
        </Suspense>
      </section>
    </main>
  )
}

export default Page