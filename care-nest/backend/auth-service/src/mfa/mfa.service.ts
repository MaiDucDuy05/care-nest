import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { UsersRepository } from '../users/users.repository.js';

/**
 * TOTP-based MFA using RFC 6238 (HMAC-SHA1, 6 digits, 30s step).
 *
 * We implement HMAC-SHA1 directly via Node's crypto module to avoid
 * pulling in a 200kB+ TOTP library. The algorithm is small and stable.
 *
 * In production the secret is encrypted at rest using a KMS-managed
 * key. Here we store it as plaintext for dev simplicity.
 */
@Injectable()
export class MfaService {
  private static readonly ISSUER = 'CareNest';
  private static readonly STEP_SECONDS = 30;
  private static readonly DIGITS = 6;
  private static readonly WINDOW = 1; // accept ±1 step (90s tolerance)

  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Generate a new TOTP secret for a user. Returns the otpauth:// URL
   * for QR rendering on the client side.
   */
  async setup(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new BadRequestException('User không tồn tại');
    if (user.mfaEnabled) {
      throw new BadRequestException('MFA đã được bật. Tắt trước khi thiết lập lại');
    }

    const secret = MfaService.generateSecret();
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(MfaService.ISSUER)}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${encodeURIComponent(MfaService.ISSUER)}&digits=${MfaService.DIGITS}&period=${MfaService.STEP_SECONDS}`;

    // Persist secret (not yet enabled) — user must verify a code to flip mfaEnabled=true
    await this.usersRepository.setMfaSecret(userId, secret);

    return { secret, otpauthUrl };
  }

  /**
   * Verify a 6-digit code against the user's stored secret and enable MFA.
   */
  async verifyAndEnable(userId: string, code: string): Promise<{ enabled: boolean }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new BadRequestException('User không tồn tại');
    if (!user.mfaSecret) throw new BadRequestException('Cần thiết lập MFA trước');
    if (user.mfaEnabled) return { enabled: true };

    if (!MfaService.verifyCode(user.mfaSecret, code)) {
      throw new UnauthorizedException('Mã MFA không hợp lệ');
    }

    await this.usersRepository.enableMfa(userId);
    return { enabled: true };
  }

  /**
   * Verify a code for a user that already has MFA enabled (used at login).
   */
  async verify(userId: string, code: string): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.mfaEnabled || !user.mfaSecret) return false;
    return MfaService.verifyCode(user.mfaSecret, code);
  }

  async disable(userId: string, code: string): Promise<{ disabled: boolean }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new BadRequestException('User không tồn tại');
    if (!user.mfaEnabled) return { disabled: true };
    if (!MfaService.verifyCode(user.mfaSecret!, code)) {
      throw new UnauthorizedException('Mã MFA không hợp lệ');
    }
    await this.usersRepository.disableMfa(userId);
    return { disabled: true };
  }

  // -------------------------------------------------------------------
  // Internal — TOTP algorithm (RFC 6238)
  // -------------------------------------------------------------------

  private static generateSecret(): string {
    // 20-byte secret is the standard size (160-bit)
    return base32Encode(crypto.randomBytes(20));
  }

  private static verifyCode(secretB32: string, code: string): boolean {
    if (!/^\d{6}$/.test(code)) return false;
    const secret = base32Decode(secretB32);
    if (!secret) return false;

    const now = Math.floor(Date.now() / 1000);
    const step = MfaService.STEP_SECONDS;
    for (let i = -MfaService.WINDOW; i <= MfaService.WINDOW; i++) {
      const counter = Math.floor(now / step) + i;
      const expected = MfaService.generateCode(secret, counter);
      // Constant-time compare
      if (timingSafeEqualHex(expected, code)) return true;
    }
    return false;
  }

  private static generateCode(secret: Buffer, counter: number): string {
    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(counter));
    const hmac = crypto.createHmac('sha1', secret).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    const otp = (binary % 10 ** MfaService.DIGITS).toString().padStart(MfaService.DIGITS, '0');
    return otp;
  }
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  return out;
}

function base32Decode(str: string): Buffer | null {
  const clean = str.replace(/=+$/g, '').toUpperCase();
  if (!/^[A-Z2-7]+$/.test(clean)) return null;
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
