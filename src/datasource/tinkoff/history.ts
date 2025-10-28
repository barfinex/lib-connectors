import { BadRequestException } from '@nestjs/common';
import { TimeFrame } from '@barfinex/types';
// import { CandleInterval } from 'tinkoff-invest-api/cjs/generated/marketdata';

// function transformTimeFrameToCandleInterval(interval: TimeFrame): CandleInterval {
//     switch (interval) {
//         case TimeFrame.min1:
//             return CandleInterval.CANDLE_INTERVAL_1_MIN;
//         case TimeFrame.min5:
//             return CandleInterval.CANDLE_INTERVAL_5_MIN;
//         case TimeFrame.min15:
//             return CandleInterval.CANDLE_INTERVAL_15_MIN;
//         case TimeFrame.h1:
//             return CandleInterval.CANDLE_INTERVAL_HOUR;
//         case TimeFrame.day:
//             return CandleInterval.CANDLE_INTERVAL_DAY;
//         default:
//             throw new BadRequestException(`Unsupported interval: ${interval}`);
//     }
// }
