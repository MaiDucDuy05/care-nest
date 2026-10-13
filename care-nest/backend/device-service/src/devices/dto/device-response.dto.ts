export interface DeviceResponseDto {
  id: string;
  deviceId: string;
  model: string;
  firmware: string | null;
  status: string;
  lastSeenAt: Date | null;
  lastBattery: number | null;
  registeredAt: Date;
}
