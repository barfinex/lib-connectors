# @barfinex/connectors

**Exchange and broker integration layer** for the [Barfinex](https://barfinex.com) ecosystem — connect to Binance, Alpaca, and other venues for market data and order execution through a single abstraction.

This library gives your Barfinex services **real-time and historical data**, **order placement**, and **subscriptions** with a unified API. By centralizing connector logic, you get consistent behaviour across Provider, Detector, and any app that talks to exchanges.

---

## What it does

- **Unified API** — one interface for candles, trades, orderbooks, and orders across supported exchanges.
- **Live and historical data** — stream subscriptions plus helpers for historical candles (e.g. Binance, Alpaca).
- **NestJS-ready** — `ConnectorModule` and `ConnectorService` for dependency injection and lifecycle.
- **Type-safe** — built on `@barfinex/types` so symbols, intervals, and orders match the rest of the stack.

---

## Installation

```sh
npm install @barfinex/connectors
```

or

```sh
yarn add @barfinex/connectors
```

---

## What's included

| Export | Purpose |
|--------|--------|
| `ConnectorModule` | NestJS module that registers connector providers. |
| `ConnectorService` | Main service: subscriptions, market data, order operations. |
| `createRequestBinance` | Binance historical data helper. |
| `requestAlpaca` | Alpaca historical data helper. |

---

## Documentation

- **Barfinex overview** — [First Steps](https://barfinex.com/docs/first-steps), [Architecture](https://barfinex.com/docs/architecture), [Glossary](https://barfinex.com/docs/glossary).
- **Provider (uses connectors)** — [Installation provider](https://barfinex.com/docs/installation-provider), [Docker Compose for Provider](https://barfinex.com/docs/installation-provider-docker-compose), [Understanding Provider Logs](https://barfinex.com/docs/installation-provider-logs).
- **Detector (consumes market data)** — [Installation detector](https://barfinex.com/docs/installation-detector).
- **Studio** — [Terminal Configuration](https://barfinex.com/docs/configuration-studio), [Registering Provider in Studio](https://barfinex.com/docs/configuration-studio-provider).
- **APIs** — [Provider API reference](https://barfinex.com/docs/provider-api), [Building with the API](https://barfinex.com/docs/frontend-api), [Typical problems and solutions](https://barfinex.com/docs/troubleshooting).

---

## Contributing

New connectors (e.g. Bybit, OKX) and improvements are welcome. Open an [issue](https://github.com/barfinex/lib-connectors/issues) or PR. Community: [Telegram](https://t.me/barfinex) · [GitHub](https://github.com/barfinex).

---

## License

Licensed under the [Apache License 2.0](LICENSE) with additional terms. Attribution to **Barfin Network Limited** and a link to [https://barfinex.com](https://barfinex.com) are required. Commercial use requires explicit permission. See [LICENSE](LICENSE) and the [Barfinex site](https://barfinex.com) for details.
