# @carenest/iot-codec

Wonlex V3.2 protocol codec for the CareNest IoT GPS wearable (care-nest V3.2 watch).

## Features

- Build (`buildPacket`) and parse (`parsePacket`) single packets
- Stateful TCP stream extraction (`PacketBuffer`) for chunked, partial reads
- Low-level helpers (`appendChunk` / `extractPackets`) kept for compatibility
- Typed decoders (`decodePacket`) for every known command — returns `AnyPacket | null`
- Mock TCP server for local development and integration tests (import from `@carenest/iot-codec/server`)
- Branded `DeviceId` type for type-safe device identifiers
- Zero runtime dependencies — only `node:net` for the mock server

## Commands supported

| Command   | Type                | Notes                                            |
| --------- | ------------------- | ------------------------------------------------ |
| `login`   | `login`             | First packet after connect                       |
| `LK`      | `heartbeat`         | Steps + battery                                  |
| `UD`      | `location`          | GPS fix (lat/lon, speed, satellites, gsm, etc.)  |
| `bphrt`   | `vitals_bp_hr`      | Systolic/diastolic BP + heart rate               |
| `oxygen`  | `vitals_oxygen`     | SpO2 percentage                                  |
| `btemp2`  | `vitals_temperature`| Body temperature in °C                           |
| `SOS`     | `sos`               | Hard button — highest priority                   |
| `fall`    | `fall`              | Accelerometer-detected fall                      |
| `phbx`    | `phonebook`         | Phone book status                                |
| `VERNO`   | `version`           | Firmware version string                          |
| `PW`      | `poweroff`          | Power-off notification                           |

## Quick start

```ts
import { buildPacket, parsePacket, decodePacket } from '@carenest/iot-codec';

const out = buildPacket('123456789012345', 'UD,120126,103045,A,10.76,N,106.66,E,0,0,0,8,74,85,0');
// => "[3G*123456789012345*0054*UD,120126,103045,A,10.76,N,106.66,E,0,0,0,8,74,85,0]"

const parsed = parsePacket(out);
if (parsed) {
  const typed = decodePacket(parsed);
  if (typed?.command === 'location') {
    console.log(typed.lat, typed.lon, typed.battery);
  }
}
```

## TCP stream handling (preferred)

```ts
import { PacketBuffer, parsePacket, decodePacket } from '@carenest/iot-codec';

const buf = new PacketBuffer();

socket.on('data', (chunk: Buffer) => {
  const raws = buf.push(chunk); // throws BufferOverflowError on overflow
  for (const raw of raws) {
    const parsed = parsePacket(raw);
    if (!parsed) continue;
    const typed = decodePacket(parsed);
    if (typed) console.log(typed);
  }
});
```

## TCP stream handling (low-level)

```ts
import { appendChunk, extractPackets, parsePacket, decodePacket } from '@carenest/iot-codec';

let buffer = '';
socket.on('data', (chunk: Buffer) => {
  buffer = appendChunk(buffer, chunk); // throws BufferOverflowError on overflow
  const { packets, remaining } = extractPackets(buffer);
  buffer = remaining;
  for (const raw of packets) {
    const parsed = parsePacket(raw);
    if (!parsed) continue;
    const typed = decodePacket(parsed);
    if (typed) console.log(typed);
  }
});
```

## Mock server (dev / tests only)

```ts
import { startMockServer } from '@carenest/iot-codec/server';

const server = await startMockServer({
  port: 18811,
  fixture: {
    deviceId: '123456789012345',
    initialBurst: ['login,0', 'LK,100,0,90'],
    onCommand: (cmd) => (cmd === 'VERNO' ? 'VERNO,G29_BASE_V1.00_2014.04.23_17.46.49' : null),
  },
});
```

> ⚠️ The mock server is single-connection, unauthenticated, and not for production.
> Import from `@carenest/iot-codec/server` (not the root barrel) so production
> bundles do not pull in `node:net`.

## License

UNLICENSED — proprietary to CareNest.
