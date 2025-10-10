// providers/alpaca/request.ts
import { date } from '@barfinex/utils';
import { CandleRaw, TimeFrame } from '@barfinex/types';
import { AlpacaClient, Bar } from '@master-chief/alpaca';
import { RawBar } from '@master-chief/alpaca/@types/entities';
import {
    BadRequestException,
    ServiceUnavailableException,
} from '@nestjs/common';

export function convertTimeFrame(timeframe: TimeFrame) {
    switch (timeframe) {
        case TimeFrame.min1:
            return '1Min';
        case TimeFrame.h1:
            return '1Hour';
        case TimeFrame.day:
            return '1Day';
        default:
            throw new BadRequestException(
                `Alpaca integration does not support timeframe: ${timeframe}`,
            );
    }
}

export function transformAlpacaCandle(
    bar: Bar | RawBar,
    symbol: { name: string },
): CandleRaw {
    const rawBar = 'raw' in bar ? bar.raw() : bar;
    const time = Date.parse(rawBar.t);

    return {
        o: rawBar.o,
        h: rawBar.h,
        l: rawBar.l,
        c: rawBar.c,
        v: rawBar.v,
        time,
        symbol,
    };
}

const key = process.env.ALPACA_KEY;
const secret = process.env.ALPACA_SECRET;
let client: AlpacaClient | null = null;

function getClient() {
    if (!client) {
        client = new AlpacaClient({ credentials: { key: key!, secret: secret! } });
    }
    return client;
}

export async function requestAlpaca(
    from: number,
    to: number,
    ticker: string,
    interval: TimeFrame,
): Promise<CandleRaw[]> {
    // Пропускаем запросы за выходные
    if (date.isWeekend(from)) {
        return [];
    }

    const fifteenMin = 900_100; // 15 мин + 100 мс
    const now = Date.now();
    const separateRequest = now - fifteenMin < to;
    let premiumBars: (Bar | RawBar)[] = [];

    let toSafe = to;

    // Если «хвост» упирается в текущий открытый бар — дернём «премиальные» бары отдельным запросом
    if (separateRequest) {
        toSafe -= fifteenMin;

        try {
            const response = await getClient().getBars({
                symbol: ticker,
                start: new Date(toSafe - fifteenMin + 60_000),
                end: new Date(toSafe + fifteenMin),
                timeframe: convertTimeFrame(interval),
            });
            premiumBars = response.bars;
        } catch (e: any) {
            throw new ServiceUnavailableException(
                `Failed to fetch premium Alpaca bars for ${ticker}: ${e?.message ?? e}`,
            );
        }
    }

    try {
        const response = await getClient().getBars({
            symbol: ticker,
            start: new Date(from),
            end: new Date(toSafe),
            timeframe: convertTimeFrame(interval),
        });

        const allBars = [...response.bars, ...premiumBars];
        return allBars.map((bar) =>
            transformAlpacaCandle(bar, { name: ticker.toUpperCase() }),
        );
    } catch (e: any) {
        throw new ServiceUnavailableException(
            `Failed to fetch Alpaca bars for ${ticker}: ${e?.message ?? e}`,
        );
    }
}
