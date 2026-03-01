import * as ccxt from 'ccxt';
import { TimeFrame, Candle, MarketType } from '@barfinex/types';
import { date } from '@barfinex/utils';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// наши интервалы → ccxt
type CcxtTF = '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '1d';

type ExchangeLike = {
  id: string;
  loadMarkets(): Promise<any>;
  markets: Record<string, any>;
  markets_by_id?: Record<string, any>;
  fetchOHLCV(
    symbol: string,
    timeframe: string,
    since?: number,
    limit?: number
  ): Promise<number[][]>;
  timeout?: number;
};

function toCcxtTimeframe(tf: TimeFrame): CcxtTF {
  switch (tf) {
    case TimeFrame.min1: return '1m';
    case TimeFrame.min5: return '5m';
    case TimeFrame.min15: return '15m';
    case TimeFrame.min30: return '30m';
    case TimeFrame.h1: return '1h';
    case TimeFrame.h2: return '2h';
    case TimeFrame.h4: return '4h';
    case TimeFrame.day: return '1d';
    default:
      throw new BadRequestException(`Unsupported interval: ${tf}`);
  }
}

export function createRequestBinance(marketType: MarketType) {
  const exchange: ExchangeLike =
    marketType === MarketType.futures
      ? new (ccxt as any).binanceusdm({ enableRateLimit: true })
      : new (ccxt as any).binance({ enableRateLimit: true });

  exchange.timeout = 15_000;

  // спот: 1000; фьючи: 1500
  const maxLimit = marketType === MarketType.futures ? 1500 : 1000;

  const marketsReady = exchange.loadMarkets();
  const symbolCache = new Map<string, string>();

  function resolveFromLoaded(symbolIdLike: string): string {
    const id = symbolIdLike.toUpperCase();

    // точное совпадение по markets_by_id
    const byId = exchange.markets_by_id?.[id];
    if ((byId as any)?.symbol) return (byId as any).symbol as string;

    // эвристика BASE/QUOTE
    const m = id.match(/^(.+?)(USDT|BUSD|USDC|FDUSD|TUSD|BTC|BNB)$/i);
    if (m) {
      const base = m[1].toUpperCase();
      const quote = m[2].toUpperCase();

      const candidates: string[] = [];
      if (marketType === MarketType.futures) {
        candidates.push(`${base}/${quote}:${quote}`);
      }
      candidates.push(`${base}/${quote}`);

      for (const s of candidates) {
        if (exchange.markets[s]) return s;
      }

      const found = Object.values(exchange.markets).find(
        (mk: any) => mk.base === base && mk.quote === quote
      ) as any;
      if (found?.symbol) return found.symbol;
    }

    throw new NotFoundException(
      `Unknown symbol for ${exchange.id}: ${symbolIdLike}`,
    );
  }

  async function getUnifiedSymbol(symbolName: string): Promise<string> {
    const key = symbolName.toUpperCase();
    const cached = symbolCache.get(key);
    if (cached) return cached;
    await marketsReady;
    const unified = resolveFromLoaded(key);
    symbolCache.set(key, unified);
    return unified;
  }

  const inflight = new Map<string, Promise<Candle[]>>();

  type RequestOpts = { maxBars?: number };

  return async function requestBinance(
    from: number,
    to: number,
    symbolName: string,
    interval: TimeFrame,
    opts?: RequestOpts
  ): Promise<Candle[]> {
    const tfStr = toCcxtTimeframe(interval);
    const frameMs = date.intervalToMs(interval);

    const now = Date.now();
    const lastClosed = Math.floor(now / frameMs) * frameMs - 1;
    const safeTo = Math.min(to, lastClosed);
    if (safeTo <= from) return [];

    let useFrom = from;
    if (opts?.maxBars && opts.maxBars > 0) {
      const minFrom = safeTo - opts.maxBars * frameMs + 1;
      if (minFrom > useFrom) useFrom = minFrom;
    }

    const key = `${marketType}:${symbolName.toUpperCase()}:${interval}:${useFrom}-${safeTo}`;
    const existing = inflight.get(key);
    if (existing) return existing;

    const p = (async () => {
      const unifiedSymbol = await getUnifiedSymbol(symbolName);
      const out: Candle[] = [];
      let since = useFrom;
      let lastTs = -1;

      while (since <= safeTo) {
        const remainingBars = Math.ceil((safeTo - since + 1) / frameMs);
        const limit = Math.min(maxLimit, remainingBars);

        const batch = await exchange.fetchOHLCV(unifiedSymbol, tfStr, since, limit);
        if (!batch.length) break;

        for (const [ts, o, h, l, c, v] of batch) {
          if (ts > safeTo) break;
          if (ts <= lastTs) continue;
          out.push({
            time: ts,
            open: Number(o),
            high: Number(h),
            low: Number(l),
            close: Number(c),
            volume: Number(v),
            symbol: { name: symbolName.toUpperCase() } as any, // Symbol совместим по полю name
          });
          lastTs = ts;
        }

        since = lastTs + frameMs;
        if (since <= useFrom) break;
      }

      out.sort((a, b) => a.time - b.time);
      return out.filter(c => c.time >= useFrom && c.time <= safeTo);
    })().finally(() => inflight.delete(key));

    inflight.set(key, p);
    return p;
  };
}
