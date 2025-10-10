import { CandleRaw, TimeFrame } from '@barfinex/types';
import { Bar } from '@master-chief/alpaca';
import { RawBar } from '@master-chief/alpaca/@types/entities';
export declare function convertTimeFrame(timeframe: TimeFrame): "1Min" | "1Hour" | "1Day";
export declare function transformAlpacaCandle(bar: Bar | RawBar, symbol: {
    name: string;
}): CandleRaw;
export declare function requestAlpaca(from: number, to: number, ticker: string, interval: TimeFrame): Promise<CandleRaw[]>;
