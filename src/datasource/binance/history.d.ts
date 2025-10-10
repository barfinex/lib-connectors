import { TimeFrame, CandleRaw, MarketType } from '@barfinex/types';
export declare function createRequestBinance(marketType: MarketType): (from: number, to: number, symbolName: string, interval: TimeFrame, opts?: {
    maxBars?: number;
}) => Promise<CandleRaw[]>;
