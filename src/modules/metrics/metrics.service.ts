import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { METRICS } from './metrics.constants';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric(METRICS.USER_CREATED_TOTAL)
    private userCreatedTotal: Counter<string>,

    @InjectMetric(METRICS.GROUP_CREATED_TOTAL)
    private groupCreatedTotal: Counter<string>,

    @InjectMetric(METRICS.REQUEST_DURATION)
    private requestDuration: Histogram<string>,

    @InjectMetric(METRICS.DB_QUERY_DURATION)
    private dbQueryDuration: Histogram<string>,
  ) {}

  incUserCreated() {
    this.userCreatedTotal.inc();
  }

  incGroupCreated() {
    this.groupCreatedTotal.inc();
  }

  recordRequestDuration(
    labels: {
      method: string;
      route: string;
      status_code: number;
    },
    durationSeconds: number,
  ) {
    this.requestDuration.observe(labels, durationSeconds);
  }

  recordDbQueryDuration(durationSeconds: number) {
    this.dbQueryDuration.observe(durationSeconds);
  }
}
