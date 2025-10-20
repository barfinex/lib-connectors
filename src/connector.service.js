"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ConnectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
const types_1 = require("@barfinex/types");
function safeJson(v) {
    try {
        return JSON.stringify(v);
    }
    catch {
        return String(v);
    }
}
function fmtErr(e) {
    if (e instanceof Error)
        return `${e.name}: ${e.message}`;
    return safeJson(e);
}
let ConnectorService = ConnectorService_1 = class ConnectorService {
    constructor(http) {
        this.http = http;
        this.isDebug = true;
        this.logger = new common_1.Logger(ConnectorService_1.name);
    }
    getCallerName(stackShift = 2) {
        const s = new Error().stack?.split('\n')[stackShift] ?? '';
        const m = s.match(/at\s+(?:\S+\.)?([a-zA-Z0-9_]+)\s*\(/);
        return m?.[1] ?? 'unknown';
    }
    logStart(url, params) {
        const fn = this.getCallerName(3);
        this.logger.log(`[${fn}] → ${url}`);
        if (this.isDebug && params !== undefined) {
            this.logger.debug(`[${fn}] params: ${safeJson(params)}`);
        }
    }
    logSuccess(methodName, url) {
        this.logger.log(`[${methodName}] ✓ ${url}`);
    }
    logError(methodName, url, err) {
        this.logger.error(`[${methodName}] ✗ ${url}: ${fmtErr(err)}`);
    }
    checkApiUrlWithСonnectorType(url) {
        if (!/^https?:\/\//.test(url)) {
            throw new common_1.ForbiddenException(`The URL must start with http or https`);
        }
        const normalizedUrl = url.replace(/\/$/, '');
        const ok = Object.values(types_1.ConnectorType).some((ct) => normalizedUrl.includes(ct));
        if (!ok)
            throw new common_1.ForbiddenException(`The URL does not contain a valid connectorType from ConnectorType enum`);
    }
    checkApiUrl(url) {
        if (!/^https?:\/\//.test(url)) {
            throw new common_1.ForbiddenException(`The URL must start with http or https`);
        }
    }
    async openOrder(options) {
        const { providerRestApiUrl, order } = options;
        const url = `${providerRestApiUrl}/orders/${order.connectorType}/${order.marketType}`;
        this.checkApiUrlWithСonnectorType(url);
        const params = { order };
        this.logStart(url, params);
        const request$ = this.request('post', url, params, {}, this.openOrder.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async closeOrder(options) {
        const { providerRestApiUrl, order } = options;
        const url = `${providerRestApiUrl}/orders/${order.connectorType}/${order.marketType}/${order.id}/close`;
        this.checkApiUrlWithСonnectorType(url);
        const params = { order };
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.closeOrder.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async closeAllOrders(options) {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${marketType}/close-all`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, options);
        const request$ = this.request('put', url, options, [], this.closeAllOrders.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async cancelOrder(options) {
        const { providerRestApiUrl, connectorType, order } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${order.marketType}/${order.id}/cancel`;
        this.checkApiUrlWithСonnectorType(url);
        const params = { order };
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.cancelOrder.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async cancelAllOrders(options) {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${marketType}/cancel-all`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, options);
        const request$ = this.request('put', url, options, [], this.cancelAllOrders.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async updateOrder(options) {
        const { providerRestApiUrl, connectorType, order } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${order.marketType}/${order.id}`;
        this.checkApiUrlWithСonnectorType(url);
        const params = { order };
        this.logStart(url, params);
        const request$ = this.request('post', url, params, {}, this.updateOrder.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getOrder(options) {
        const { providerRestApiUrl, connectorType, order } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${order.marketType}/${order.id}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getOrder.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getOrders(options) {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${marketType}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getOrders.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getActiveOrders(options) {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${marketType}/active`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getActiveOrders.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getCancelledOrders(options) {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/orders/${connectorType}/${marketType}/cancelled`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getCancelledOrders.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getCandles(options) {
        const { providerRestApiUrl, connectorType, marketType, symbol, interval } = options;
        const symbolName = encodeURIComponent(symbol.name);
        const url = `${providerRestApiUrl}/candles/${connectorType}/${marketType}/${symbolName}/${interval}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart?.(url);
        const request$ = this.request("get", url, null, [], this.getCandles.name);
        const res = await (0, rxjs_1.lastValueFrom)(request$);
        if (Array.isArray(res))
            return res;
        if (res && typeof res === 'object' && Array.isArray(res.candles)) {
            return res.candles;
        }
        this.logger.warn(`[getCandles] unexpected payload from ${url}: ${typeof res} ${JSON.stringify(res)}`);
        return [];
    }
    async getProviderOptions(options) {
        const { providerRestApiUrl } = options;
        const url = `${providerRestApiUrl}/options`;
        this.checkApiUrl(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getProviderOptions.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getAccount(options) {
        const { providerRestApiUrl, connectorType, marketType } = options;
        const url = `${providerRestApiUrl}/accounts/${connectorType}/${marketType}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getAccount.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async changeAccountSymbolLeverage(options) {
        const { providerRestApiUrl, connectorType, marketType, symbol, newLeverage: leverage } = options;
        const url = `${providerRestApiUrl}/accounts/${connectorType}/${marketType}/leverage`;
        const params = { symbol, leverage, marketType };
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.changeAccountSymbolLeverage.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getInspectors(options) {
        const { providerRestApiUrl, connectorType } = options;
        const url = `${providerRestApiUrl}/inspectors/${connectorType}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getInspectors.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getInspector(options) {
        const { providerRestApiUrl, connectorType, inspectorKey } = options;
        const url = `${providerRestApiUrl}/inspectors/${connectorType}/${inspectorKey}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getInspector.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async registerInspector(options) {
        const { providerRestApiUrl, inspector } = options;
        const url = `${providerRestApiUrl}/inspectors`;
        const params = { inspector };
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, params);
        const request$ = this.request('post', url, params, {}, this.registerInspector.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async updateInspector(options) {
        const { providerRestApiUrl, connectorType, inspector } = options;
        const url = `${providerRestApiUrl}/inspectors/${connectorType}/${inspector.key}`;
        const params = { inspector };
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.updateInspector.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getDetectors(options) {
        const { providerRestApiUrl } = options;
        const url = `${providerRestApiUrl}/detectors`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getDetectors.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getDetector(options) {
        const { providerRestApiUrl, detectorKey } = options;
        const url = `${providerRestApiUrl}/detectors/${detectorKey}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getDetector.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async registerDetector(options) {
        const { providerRestApiUrl, detector } = options;
        const url = `${providerRestApiUrl}/detectors`;
        const params = { detector };
        this.checkApiUrl(url);
        this.logStart(url, params);
        const request$ = this.request('post', url, params, {}, this.registerDetector.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async updateDetector(options) {
        const { providerRestApiUrl, detector } = options;
        const url = `${providerRestApiUrl}/detectors/${detector.key}`;
        const params = { detector };
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.updateDetector.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getAdvisors(options) {
        const { providerRestApiUrl, connectorType } = options;
        const url = `${providerRestApiUrl}/advisors/${connectorType}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, [], this.getAdvisors.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async getAdvisor(options) {
        const { providerRestApiUrl, connectorType, advisorKey } = options;
        const url = `${providerRestApiUrl}/advisors/${connectorType}/${advisorKey}`;
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url);
        const request$ = this.request('get', url, null, {}, this.getAdvisor.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async advisorRegistration(options) {
        const { providerRestApiUrl, advisor } = options;
        const url = `${providerRestApiUrl}/advisors`;
        const params = { advisor };
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, params);
        const request$ = this.request('post', url, params, {}, this.advisorRegistration.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    async advisorUpdate(options) {
        const { providerRestApiUrl, connectorType, advisor } = options;
        const url = `${providerRestApiUrl}/advisors/${connectorType}/${advisor.key}`;
        const params = { advisor };
        this.checkApiUrlWithСonnectorType(url);
        this.logStart(url, params);
        const request$ = this.request('put', url, params, {}, this.advisorUpdate.name);
        return await (0, rxjs_1.lastValueFrom)(request$);
    }
    request(method, url, params, defaultValue, methodName) {
        const _methodName = methodName ?? this.getCallerName(3);
        const retryCount = 5;
        let retryIndexSeen = 0;
        let lastLoggedRetryIndex = -1;
        let req$ = this.http.get(url);
        if (method === 'post')
            req$ = this.http.post(url, params);
        else if (method === 'put')
            req$ = this.http.put(url, params);
        if (method === 'get') {
            return req$.pipe((0, operators_1.map)((res) => {
                this.logSuccess(_methodName, url);
                return res.data;
            }), (0, operators_1.catchError)((err) => {
                if (retryIndexSeen >= retryCount) {
                    this.logError(_methodName, url, err);
                    this.logger.log(`[${_methodName}] default value used for ${url}`);
                    return (0, rxjs_1.of)(defaultValue);
                }
                if (retryIndexSeen !== lastLoggedRetryIndex) {
                    this.logError(_methodName, url, err);
                    lastLoggedRetryIndex = retryIndexSeen;
                }
                return (0, rxjs_1.of)(null);
            }), (0, operators_1.skipWhile)((res) => res === null), (0, operators_1.throwIfEmpty)(), (0, operators_1.retry)({
                count: retryCount,
                delay: (_error, i) => {
                    retryIndexSeen = i;
                    const base = 2000;
                    const ms = Math.pow(2, i - 1) * base;
                    return (0, rxjs_1.timer)(ms);
                },
            }));
        }
        else {
            return req$.pipe((0, operators_1.map)((res) => {
                this.logSuccess(_methodName, url);
                return res.data;
            }), (0, operators_1.catchError)((err) => {
                this.logError(_methodName, url, err);
                this.logger.log(`[${_methodName}] default value used for ${url}`);
                return (0, rxjs_1.of)(defaultValue);
            }));
        }
    }
};
exports.ConnectorService = ConnectorService;
exports.ConnectorService = ConnectorService = ConnectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], ConnectorService);
//# sourceMappingURL=connector.service.js.map