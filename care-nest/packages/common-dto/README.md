# @carenest/common-dto

Zod schemas shared between the front-end and back-end. Source of truth for
every HTTP request body and response envelope.

```ts
import { RegisterRequestSchema, type RegisterRequest } from '@carenest/common-dto';

const body: RegisterRequest = RegisterRequestSchema.parse(req.body);
```

Run `pnpm --filter @carenest/common-dto build` to emit CJS+ESM + `.d.ts`.
