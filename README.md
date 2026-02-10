# @barfinex/connectors

**`@barfinex/connectors`** is the **integration layer** of the [Barfinex](https://barfinex.com) ecosystem — an open-source platform for algorithmic trading, quantitative research, and digital asset infrastructure.

This package provides **data and trading connectors** to external exchanges and brokers (e.g., Binance, Bybit, etc.), ensuring **real-time market access** and **execution capabilities**.  

By centralizing connector logic, it guarantees:

- 🔌 **Seamless integration** — unified abstraction over multiple exchanges.  
- ⏱ **Low-latency market data** — historical and live data feeds with caching.  
- 📈 **Trading operations** — order placement, updates, and cancellations.  
- 🛡 **Reliability** — reconnection strategies and error-handling built in.  
- 🌍 **Extensibility** — easily add support for new providers without breaking existing services.  

---

It helps to:  
- abstract differences between exchange APIs;  
- provide a uniform interface for historical and live data;  
- ensure type-safety by aligning with `@barfinex/types`.  

---

## 📦 Installation

```sh
npm install @barfinex/connectors
```

or

```sh
yarn add @barfinex/connectors
```

---

## 📘 Example Usage

### 1. Importing the Connector Module

```ts
import { Module } from '@nestjs/common';
import { ConnectorModule } from '@barfinex/connectors';

@Module({
  imports: [ConnectorModule],
})
export class AppModule {}
```

This registers connector providers globally inside your NestJS service.

---

### 2. Using the Connector Service

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConnectorService } from '@barfinex/connectors';

@Injectable()
export class MarketWatcher implements OnModuleInit {
  constructor(private readonly connectorService: ConnectorService) {}

  async onModuleInit() {
    // Example: subscribe to live candles for BTCUSDT
    await this.connectorService.subscribe('binance', 'BTCUSDT', 'min1', (candle) => {
      console.log('New candle:', candle);
    });
  }
}
```

The `ConnectorService` handles **stream subscriptions, order events, and trade execution** depending on the connector type.

---

### 3. Accessing Historical Candles

```ts
import { getHistory } from '@barfinex/connectors/history';

async function main() {
  const candles = await getHistory({
    exchange: 'binance',
    symbol: 'BTCUSDT',
    interval: '1h',
    limit: 100,
  });

  console.log('Fetched candles:', candles.length);
}
```

The `history` utility allows you to fetch **cached or on-demand historical data** for backtesting and analysis.

---

## 📚 What's Included

- **`ConnectorModule`** — NestJS module for DI.  
- **`ConnectorService`** — main abstraction for connector logic (market data, orders, subscriptions).  
- **`history.ts`** — utilities for loading and transforming historical candles.  
- **`index.ts`** — public exports for integration.  

---

## 🤝 Contributing

We welcome contributions to help grow the **open Barfinex standard**:

- 🛠 Open an issue or submit a PR  
- 💡 Add new connector support (e.g., Bybit, OKX, Coinbase)  
- 💬 Share feedback or use cases  

Join our Telegram community: [t.me/barfinex](https://t.me/barfinex)

---

## 📜 License

This repository is licensed under the [Apache License 2.0](LICENSE) with additional restrictions.

### Key Terms:
1. **Attribution**: Credit to Barfin Network Limited, with a link to [https://barfinex.com/](https://barfinex.com/).  
2. **Non-Commercial Use**: Commercial use is prohibited without explicit permission.  
3. **Display Requirements**: Must show "Barfin Network Limited", the logo, and a link to [https://barfinex.com/](https://barfinex.com/).  
