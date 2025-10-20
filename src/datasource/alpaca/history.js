"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTimeFrame = convertTimeFrame;
exports.transformAlpacaCandle = transformAlpacaCandle;
exports.requestAlpaca = requestAlpaca;
const utils_1 = require("../../../../utils/dist/index.js");
const types_1 = require("@barfinex/types");
const alpaca_1 = require("@master-chief/alpaca");
const common_1 = require("@nestjs/common");
function convertTimeFrame(timeframe) {
    switch (timeframe) {
        case types_1.TimeFrame.min1:
            return '1Min';
        case types_1.TimeFrame.h1:
            return '1Hour';
        case types_1.TimeFrame.day:
            return '1Day';
        default:
            throw new common_1.BadRequestException(`Alpaca integration does not support timeframe: ${timeframe}`);
    }
}
function transformAlpacaCandle(bar, symbol) {
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
let client = null;
function getClient() {
    if (!client) {
        client = new alpaca_1.AlpacaClient({ credentials: { key: key, secret: secret } });
    }
    return client;
}
async function requestAlpaca(from, to, ticker, interval) {
    if (utils_1.date.isWeekend(from)) {
        return [];
    }
    const fifteenMin = 900_100;
    const now = Date.now();
    const separateRequest = now - fifteenMin < to;
    let premiumBars = [];
    let toSafe = to;
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
        }
        catch (e) {
            throw new common_1.ServiceUnavailableException(`Failed to fetch premium Alpaca bars for ${ticker}: ${e?.message ?? e}`);
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
        return allBars.map((bar) => transformAlpacaCandle(bar, { name: ticker.toUpperCase() }));
    }
    catch (e) {
        throw new common_1.ServiceUnavailableException(`Failed to fetch Alpaca bars for ${ticker}: ${e?.message ?? e}`);
    }
}
//# sourceMappingURL=history.js.map