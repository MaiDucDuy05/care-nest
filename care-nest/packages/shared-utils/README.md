# @carenest/shared-utils

Cross-cutting utilities: logger, retry, timeout, PII masking.

## Usage

```ts
import { createLogger, retry, withTimeout, maskEmail } from '@carenest/shared-utils';

const log = createLogger({ service: 'order-service' });

log.info({ orderId, userEmail: maskEmail(userEmail) }, 'order created');

await retry(() => kafkaProducer.send(record), { attempts: 5 });
```
