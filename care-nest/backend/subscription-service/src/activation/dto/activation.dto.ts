import { z } from 'zod';
import { nonEmptyStringSchema } from '@carenest/shared-types';

/**
 * Internal endpoint hit by order-service after a paid order ships a device.
 * Generates a one-time activation code that the buyer will scan/use to
 * link the device's IMEI to their account.
 */
export const CreateActivationCodeSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  imeiList: z.array(z.string().regex(/^\d{14,16}$/, 'IMEI phải 14-16 chữ số')).min(1).max(10),
});

export type CreateActivationCodeDto = z.infer<typeof CreateActivationCodeSchema>;

export const RedeemActivationCodeSchema = z.object({
  token: z.string().uuid(),
  deviceId: z.string().uuid().optional(),
});

export type RedeemActivationCodeDto = z.infer<typeof RedeemActivationCodeSchema>;

const uuidV7Schema = nonEmptyStringSchema.refine((v) => {
  // UUID v7 starts with version nibble = 7
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
    return false;
  }
  return true;
}, 'Token phải là UUID v7');
