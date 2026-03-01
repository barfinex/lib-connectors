import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map, catchError, skipWhile, retry, throwIfEmpty } from 'rxjs/operators';
import { lastValueFrom, of, timer } from 'rxjs';
import {
    Account,
    Detector,
    MarketType,
    Order,
    ConnectorType,
    OrderType,
    TimeFrame,
    Candle,
    Inspector,
    OrderSourceType,
    Advisor,
    Symbol,
    Provider,
} from '@barfinex/types';

// -------- helpers for safe logging ----------
function safeJson(v: unknown): string {
    try { return JSON.stringify(v); } catch { return String(v); }
}
function fmtErr(e: unknown): string {
    if (e instanceof Error) return `${e.name}: ${e.message}`;
    return safeJson(e);
}

@Injectable()
export class ConnectorService {
    constructor(private http: HttpService) { }

    private isDebug = true;
    private readonly logger = new Logger(ConnectorService.name);

    /** best-effort имя вызывающего метода из стека */
    private getCallerName(stackShift = 2): string {
        const s = new Error().stack?.split('\n')[stackShift] ?? '';
        const m = s.match(/at\s+(?:\S+\.)?([a-zA-Z0-9_]+)\s*\(/);
        return m?.[1] ?? 'unknown';
    }
    private logStart(url: string, params?: unknown) {
        const fn = this.getCallerName(3);
        this.logger.log(`[${fn}] → ${url}`);
        if (this.isDebug && params !== undefined) {
            this.logger.debug(`[${fn}] params: ${safeJson(params)}`);
        }
    }
    private logSuccess(methodName: string, url: string) {
        this.logger.log(`[${methodName}] ✓ ${url}`);
    }
    private logError(methodName: string, url: string, err: unknown) {
        this.logger.error(`[${methodName}] ✗ ${url}: ${fmtErr(err)}`);
    }

    checkApiUrlWithСonnectorType(url: string): void {
        if (!/^https?:\/\//.test(url)) {
            throw new ForbiddenException(`The URL must start with http or https`);
        }
        const normalizedUrl = url.replace(/\/$/, '');
        const ok = Object.values(ConnectorType).some((ct) => normalizedUrl.includes(ct));
        if (!ok) throw new ForbiddenException(`The URL does not contain a valid connectorType from ConnectorType enum`);
    }

    checkApiUrl(url: string): void {
        if (!/^https?:\/\//.test(url)) {
            throw new ForbiddenException(`The URL must start with http or https`);
        }
    }

    // ========================== ORDERS ==========================

    async openOrder(options: { order: Order; providerRestApiUrl: string }): Promise<Order> {
        const { providerRestApiUrl, order } = options;
        const url = `${providerRestApiUrl}/orders/${order.connectorType}/${order.marketType}`;
        this.checkApiUrlWithСonnectorType(url);
        const params = { order };
        this.logStart(url, params);
        const request$ = this.request('post', url, params, {}, this.openOrder.name);
        return await lastValueFrom(request$) as Order;
    }

    async closeOrder(options: { order: Order; providerRestApiUrl: string }): Promise<Order> {
        const { providerRestApiUrl, order } = options;
        const url = `${providerRestApiUrl}/orders/${order.connectorType}/${order.marketType}/${order.id}/close`;
        this.checkApiUrlWithСonnectorType(url);
        const params = { order };
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.closeOrder.name);
        return await lastValueFrom(request$);
    }

    async closeAllOrders(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType;
        symbol?: Symbol; type?: OrderType; orderSource: OrderSourceType;
    }): Promise<Order[]> {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${marketType}/close-all`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, options);
        const request$ = this.request('put', url, options, [], this.closeAllOrders.name);
        return await lastValueFrom(request$);
    }

    async cancelOrder(options: {
        order: Order; providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType;
    }): Promise<Order> {
        const { providerRestApiUrl, connectorType, order } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${order.marketType}/${order.id}/cancel`;
        this.checkApiUrlWithСonnectorType(url);
        const params = { order };
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.cancelOrder.name);
        return await lastValueFrom(request$);
    }

    async cancelAllOrders(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType;
        symbol?: Symbol; type?: OrderType; orderSource: OrderSourceType;
    }): Promise<Order[]> {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${marketType}/cancel-all`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, options);
        const request$ = this.request('put', url, options, [], this.cancelAllOrders.name);
        return await lastValueFrom(request$);
    }

    async updateOrder(options: {
        order: Order; providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType;
    }): Promise<Order> {
        const { providerRestApiUrl, connectorType, order } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${order.marketType}/${order.id}`;
        this.checkApiUrlWithСonnectorType(url);
        const params = { order };
        this.logStart(url, params);
        const request$ = this.request('post', url, params, {}, this.updateOrder.name);
        return await lastValueFrom(request$);
    }

    async getOrder(options: {
        order: Order; providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType;
    }): Promise<Order> {
        const { providerRestApiUrl, connectorType, order } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${order.marketType}/${order.id}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getOrder.name);
        return await lastValueFrom(request$);
    }

    async getOrders(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType;
    }): Promise<Order[]> {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${marketType}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getOrders.name);
        return await lastValueFrom(request$);
    }

    async getActiveOrders(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType;
    }): Promise<Order[]> {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${marketType}/active`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getActiveOrders.name);
        return await lastValueFrom(request$);
    }

    async getCancelledOrders(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType;
    }): Promise<Order[]> {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${marketType}/cancelled`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getCancelledOrders.name);
        return await lastValueFrom(request$);
    }

    // ========================== CANDLES ==========================

    async getCandles(
        options: { providerRestApiUrl: string, connectorType: ConnectorType, marketType: MarketType, symbol: Symbol; interval: TimeFrame }
    ): Promise<Candle[]> {
        const { providerRestApiUrl, connectorType, marketType, symbol, interval } = options;

        const symbolName = encodeURIComponent(symbol.name); // <-- ключевая правка
        const url = `${providerRestApiUrl}/candles/${connectorType}/${marketType}/${symbolName}/${interval}`;

        this.checkApiUrlWithСonnectorType(url);
        this.logStart?.(url); // если есть вспомогательный лог-старт

        const request$ = this.request("get", url, null, [], this.getCandles.name);
        const res = await lastValueFrom(request$) as unknown;

        // Нормализация ответа: всегда массив
        if (Array.isArray(res)) return res as Candle[];
        if (res && typeof res === 'object' && Array.isArray((res as any).candles)) {
            return (res as any).candles as Candle[];
        }

        this.logger.warn(`[getCandles] unexpected payload from ${url}: ${typeof res} ${JSON.stringify(res)}`);
        return [];
    }

    // ========================== PROVIDER / ACCOUNT ==========================

    async getProviderOptions(options: { providerRestApiUrl: string }): Promise<Provider> {
        const { providerRestApiUrl } = options;
        const url = `${providerRestApiUrl}/options`;
        this.checkApiUrl(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getProviderOptions.name);
        return await lastValueFrom(request$) as Provider;
    }

    async getAccount(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType;
    }): Promise<Account> {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/accounts/${connectorType}/${marketType}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getAccount.name);
        return await lastValueFrom(request$) as Account;
    }

    async changeAccountSymbolLeverage(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType; symbol: Symbol; newLeverage: number;
    }): Promise<Account> {
        const { providerRestApiUrl, connectorType, marketType, symbol, newLeverage: leverage } = options;
        const url = `${providerRestApiUrl}/accounts/${connectorType}/${marketType}/leverage`;
        const params = { symbol, leverage, marketType };
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.changeAccountSymbolLeverage.name);
        return await lastValueFrom(request$) as Account;
    }

    // ========================== INSPECTORS ==========================

    async getInspectors(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType;
    }): Promise<Inspector[]> {
        const { providerRestApiUrl, connectorType } = options;
        const url = `${providerRestApiUrl}/inspectors/${connectorType}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getInspectors.name);
        return await lastValueFrom(request$);
    }

    async getInspector(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType; inspectorKey: string;
    }): Promise<Inspector> {
        const { providerRestApiUrl, connectorType, inspectorKey } = options;
        const url = `${providerRestApiUrl}/inspectors/${connectorType}/${inspectorKey}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getInspector.name);
        return await lastValueFrom(request$);
    }

    async registerInspector(options: { providerRestApiUrl: string; inspector: Inspector }): Promise<Inspector> {
        const { providerRestApiUrl, inspector } = options;
        const url = `${providerRestApiUrl}/inspectors`;
        const params = {
            sysname: inspector?.key,
            options: inspector,
        };
        this.checkApiUrl(url);
        this.logStart(url, params);
        const request$ = this.request('post', url, params, {}, this.registerInspector.name);
        return await lastValueFrom(request$) as Inspector;
    }

    async updateInspector(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType; inspector: Inspector;
    }): Promise<Inspector> {
        const { providerRestApiUrl, connectorType, inspector } = options;
        const url = `${providerRestApiUrl}/inspectors/${connectorType}/${inspector.key}`;
        const params = { inspector };
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.updateInspector.name);
        return await lastValueFrom(request$) as Inspector;
    }

    // ========================== DETECTORS ==========================

    async getDetectors(options: { providerRestApiUrl: string }): Promise<Detector[]> {
        const { providerRestApiUrl } = options;
        const url = `${providerRestApiUrl}/detectors`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getDetectors.name);
        return await lastValueFrom(request$);
    }

    async getDetector(options: { providerRestApiUrl: string; detectorKey: string }): Promise<Detector> {
        const { providerRestApiUrl, detectorKey } = options;
        const url = `${providerRestApiUrl}/detectors/${detectorKey}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getDetector.name);
        return await lastValueFrom(request$);
    }

    async registerDetector(options: { providerRestApiUrl: string; detector: Detector }): Promise<Detector> {
        const { providerRestApiUrl, detector } = options;
        const url = `${providerRestApiUrl}/detectors`;
        const params = { detector };
        this.checkApiUrl(url);
        this.logStart(url, params);
        const request$ = this.request('post', url, params, {}, this.registerDetector.name);
        return await lastValueFrom(request$) as Detector;
    }

    async updateDetector(options: { providerRestApiUrl: string; detector: Detector }): Promise<Detector> {
        const { providerRestApiUrl, detector } = options;
        const url = `${providerRestApiUrl}/detectors/${detector.key}`;
        const params = { detector };
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.updateDetector.name);
        return await lastValueFrom(request$) as Detector;
    }

    // ========================== ADVISORS ==========================

    async getAdvisors(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType;
    }): Promise<Advisor[]> {
        const { providerRestApiUrl, connectorType } = options;
        const url = `${providerRestApiUrl}/advisors/${connectorType}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getAdvisors.name);
        return await lastValueFrom(request$);
    }

    async getAdvisor(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType; advisorKey: string;
    }): Promise<Advisor> {
        const { providerRestApiUrl, connectorType, advisorKey } = options;
        const url = `${providerRestApiUrl}/advisors/${connectorType}/${advisorKey}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getAdvisor.name);
        return await lastValueFrom(request$);
    }

    async advisorRegistration(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType; advisor: Advisor;
    }): Promise<Advisor> {
        const { providerRestApiUrl, advisor } = options;
        const url = `${providerRestApiUrl}/advisors`;
        const params = { advisor };
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, params);
        const request$ = this.request('post', url, params, {}, this.advisorRegistration.name);
        return await lastValueFrom(request$) as Advisor;
    }

    async advisorUpdate(options: {
        providerRestApiUrl: string; connectorType: ConnectorType; marketType: MarketType; advisor: Advisor;
    }): Promise<Advisor> {
        const { providerRestApiUrl, connectorType, advisor } = options;
        const url = `${providerRestApiUrl}/advisors/${connectorType}/${advisor.key}`;
        const params = { advisor };
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.advisorUpdate.name);
        return await lastValueFrom(request$) as Advisor;
    }

    // ========================== CORE REQUEST WRAPPER (с ретраями GET) ==========================

    /**
     * Единая обёртка вокруг HttpService с автологированием.
     * Для GET – сохраняем вашу схему повторов: catchError -> null, skipWhile(null), throwIfEmpty(), retry({count, delay})
     * На последней попытке вернём defaultValue, плюс аккуратно логируем ошибки.
     */
    request(
        method: 'get' | 'post' | 'put',
        url: string,
        params: any,
        defaultValue: any,
        methodName?: string,
    ) {
        const _methodName = methodName ?? this.getCallerName(3);

        const retryCount = 5;
        let retryIndexSeen = 0;         // текущая попытка
        let lastLoggedRetryIndex = -1;  // чтобы не спамить одинаковыми логами

        let req$ = this.http.get(url);
        if (method === 'post') req$ = this.http.post(url, params);
        else if (method === 'put') req$ = this.http.put(url, params);

        if (method === 'get') {
            return req$.pipe(
                map((res) => {
                    this.logSuccess(_methodName, url);
                    return res.data;
                }),
                catchError((err) => {
                    // если это последняя попытка — отдадим defaultValue
                    if (retryIndexSeen >= retryCount) {
                        this.logError(_methodName, url, err);
                        this.logger.log(`[${_methodName}] default value used for ${url}`);
                        return of(defaultValue);
                    }
                    // логируем ошибку только при смене индекса попытки
                    if (retryIndexSeen !== lastLoggedRetryIndex) {
                        this.logError(_methodName, url, err);
                        lastLoggedRetryIndex = retryIndexSeen;
                    }
                    // вернём null, чтобы skipWhile отфильтровал, а throwIfEmpty → retry
                    return of(null);
                }),
                skipWhile((res) => res === null),
                throwIfEmpty(), // пустой поток после фильтра → ошибка → сработает retry ниже
                retry({
                    count: retryCount,
                    delay: (_error, i) => {
                        retryIndexSeen = i; // 1..retryCount
                        const base = 2000;
                        const ms = Math.pow(2, i - 1) * base; // 2s, 4s, 8s, 16s, ...
                        return timer(ms);
                    },
                }),
            );
        } else {
            // POST/PUT без ретраев (как было у вас), но с логами и defaultValue
            return req$.pipe(
                map((res) => {
                    this.logSuccess(_methodName, url);
                    return res.data;
                }),
                catchError((err) => {
                    this.logError(_methodName, url, err);
                    this.logger.log(`[${_methodName}] default value used for ${url}`);
                    return of(defaultValue);
                }),
            );
        }
    }
}
