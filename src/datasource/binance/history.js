"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestBinance = createRequestBinance;
const ccxt = __importStar(require("ccxt"));
const types_1 = require("@barfinex/types");
const utils_1 = require("../../../../utils/dist/index.js");
const common_1 = require("@nestjs/common");
function toCcxtTimeframe(tf) {
    switch (tf) {
        case types_1.TimeFrame.min1: return '1m';
        case types_1.TimeFrame.min5: return '5m';
        case types_1.TimeFrame.min15: return '15m';
        case types_1.TimeFrame.min30: return '30m';
        case types_1.TimeFrame.h1: return '1h';
        case types_1.TimeFrame.h4: return '4h';
        case types_1.TimeFrame.day: return '1d';
        default:
            throw new common_1.BadRequestException(`Unsupported interval: ${tf}`);
    }
}
function createRequestBinance(marketType) {
    const exchange = marketType === types_1.MarketType.futures
        ? new ccxt.binanceusdm({ enableRateLimit: true })
        : new ccxt.binance({ enableRateLimit: true });
    exchange.timeout = 15_000;
    const maxLimit = marketType === types_1.MarketType.futures ? 1500 : 1000;
    const marketsReady = exchange.loadMarkets();
    const symbolCache = new Map();
    function resolveFromLoaded(symbolIdLike) {
        const id = symbolIdLike.toUpperCase();
        const byId = exchange.markets_by_id?.[id];
        if (byId?.symbol)
            return byId.symbol;
        const m = id.match(/^(.+?)(USDT|BUSD|USDC|FDUSD|TUSD|BTC|BNB)$/i);
        if (m) {
            const base = m[1].toUpperCase();
            const quote = m[2].toUpperCase();
            const candidates = [];
            if (marketType === types_1.MarketType.futures) {
                candidates.push(`${base}/${quote}:${quote}`);
            }
            candidates.push(`${base}/${quote}`);
            for (const s of candidates) {
                if (exchange.markets[s])
                    return s;
            }
            const found = Object.values(exchange.markets).find((mk) => mk.base === base && mk.quote === quote);
            if (found?.symbol)
                return found.symbol;
        }
        throw new common_1.NotFoundException(`Unknown symbol for ${exchange.id}: ${symbolIdLike}`);
    }
    async function getUnifiedSymbol(symbolName) {
        const key = symbolName.toUpperCase();
        const cached = symbolCache.get(key);
        if (cached)
            return cached;
        await marketsReady;
        const unified = resolveFromLoaded(key);
        symbolCache.set(key, unified);
        return unified;
    }
    const inflight = new Map();
    return async function requestBinance(from, to, symbolName, interval, opts) {
        const tfStr = toCcxtTimeframe(interval);
        const frameMs = utils_1.date.intervalToMs(interval);
        const now = Date.now();
        const lastClosed = Math.floor(now / frameMs) * frameMs - 1;
        const safeTo = Math.min(to, lastClosed);
        if (safeTo <= from)
            return [];
        let useFrom = from;
        if (opts?.maxBars && opts.maxBars > 0) {
            const minFrom = safeTo - opts.maxBars * frameMs + 1;
            if (minFrom > useFrom)
                useFrom = minFrom;
        }
        const key = `${marketType}:${symbolName.toUpperCase()}:${interval}:${useFrom}-${safeTo}`;
        const existing = inflight.get(key);
        if (existing)
            return existing;
        const p = (async () => {
            const unifiedSymbol = await getUnifiedSymbol(symbolName);
            const out = [];
            let since = useFrom;
            let lastTs = -1;
            while (since <= safeTo) {
                const remainingBars = Math.ceil((safeTo - since + 1) / frameMs);
                const limit = Math.min(maxLimit, remainingBars);
                const batch = await exchange.fetchOHLCV(unifiedSymbol, tfStr, since, limit);
                if (!batch.length)
                    break;
                for (const [ts, o, h, l, c, v] of batch) {
                    if (ts > safeTo)
                        break;
                    if (ts <= lastTs)
                        continue;
                    out.push({
                        time: ts,
                        o: Number(o),
                        h: Number(h),
                        l: Number(l),
                        c: Number(c),
                        v: Number(v),
                        symbol: { name: symbolName.toUpperCase() },
                    });
                    lastTs = ts;
                }
                since = lastTs + frameMs;
                if (since <= useFrom)
                    break;
            }
            out.sort((a, b) => a.time - b.time);
            return out.filter(c => c.time >= useFrom && c.time <= safeTo);
        })().finally(() => inflight.delete(key));
        inflight.set(key, p);
        return p;
    };
}
//# sourceMappingURL=history.js.map