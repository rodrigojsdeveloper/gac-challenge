import { Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { METRICS } from './metrics.constants';

@Module({
  imports: [
    PrometheusModule.register({
      defaultLabels: { app: 'gac-challenge' },
    }),
  ],
  providers: [
    MetricsService,

    makeCounterProvider({
      name: METRICS.USER_CREATED_TOTAL,
      help: 'Total number of users created',
    }),

    makeCounterProvider({
      name: METRICS.GROUP_CREATED_TOTAL,
      help: 'Total number of groups created',
    }),

    makeHistogramProvider({
      name: METRICS.REQUEST_DURATION,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.05, 0.1, 0.3, 0.5, 1, 3, 5],
    }),

    makeHistogramProvider({
      name: METRICS.DB_QUERY_DURATION,
      help: 'Duration of database queries in seconds',
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
    }),
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
