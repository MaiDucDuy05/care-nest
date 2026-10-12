---
name: wonlex-tcp-command
description: Generate and parse Wonlex GPS Watch TCP protocol commands. Use when working with Wonlex tracking devices, implementing backend parsers, or debugging device communication.
---

# Wonlex TCP Command Skill

This skill provides comprehensive guidance for generating, parsing, and understanding the Wonlex GPS Watch TCP protocol (v5.2).

## Quick Start

The protocol follows a specific framed format:
`[Manufacturer*DeviceID*Length*Content]`

- **Manufacturer:** Usually `3G` or `CS`.
- **Device ID:** 10-digit IMEI-based ID.
- **Length:** 4-digit Hex string (e.g., `000A`).
- **Content:** The actual command and its parameters.

For a full list of commands and data formats, see [references/protocol.md](references/protocol.md).

## Core Tasks

### 1. Generating Server Commands
To send a command to a device, you must calculate the content length in hexadecimal.

**Example: Set SOS numbers**
- Content: `SOS,12345678901,09876543210,11223344556`
- Length of content: 41 characters -> `0029` in Hex.
- Final Command: `[3G*1234567890*0029*SOS,12345678901,09876543210,11223344556]`

### 2. Parsing Device Data (UD/AL)
Location (`UD`) and Alarm (`AL`) data contain a comma-separated string of telemetry.

**Key Fields in `UD`:**
1. Date (DDMMYY)
2. Time (HHMMSS)
3. Validity (A=Valid, V=Invalid)
4. Latitude
5. N/S
6. Longitude
7. E/W
8. Speed (km/h)
9. Direction
10. Altitude
... (see protocol reference for full list)

### 3. Calculating Content Length
Always use 4-digit uppercase Hex for the length field.
- `10` -> `000A`
- `255` -> `00FF`
- `1024` -> `0400`

## Common Commands Reference

| Task | Command |
| :--- | :--- |
| Set Upload Interval | `UPLOAD,seconds` |
| Set SOS Numbers | `SOS,num1,num2,num3` |
| Set Language/Timezone | `LANG,id`, `ZONE,offset` |
| Remote Shutdown/Restart | `POWEROFF`, `RESET` |
| Find Device | `FIND` |
| Monitoring (Listen-in) | `MONITOR,phone_number` |

For detailed parameters and additional commands (Heart Rate, Temperature, Fall Detection), refer to [references/protocol.md](references/protocol.md).

## Troubleshooting
- **Invalid Length:** Ensure the length is calculated ONLY for the content part (after the 3rd asterisk).
- **Format Errors:** Check for missing brackets `[]` or incorrect asterisk `*` placement.
- **Unicode:** Commands like `MESSAGE` or `SCHEDULE` require content to be in Hex-encoded Unicode.
