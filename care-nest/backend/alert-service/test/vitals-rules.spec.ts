import { describe, it, expect } from 'vitest';
import { evaluateVitals, isOutsideGeofence, haversineMeters } from '../src/rules/vitals-rules.js';

describe('vitals-rules', () => {
  describe('evaluateVitals', () => {
    it('returns not triggered for normal vitals', () => {
      const r = evaluateVitals({
        type: 'BP',
        systolic: 120,
        diastolic: 80,
        heartRate: 72,
        oxygen: 98,
        bodyTempC: 36.6,
        measuredAt: new Date(),
      });
      expect(r.triggered).toBe(false);
    });

    it('triggers CRITICAL for hypertensive crisis', () => {
      const r = evaluateVitals({
        type: 'BP',
        systolic: 190,
        diastolic: 125,
        measuredAt: new Date(),
      });
      expect(r.triggered).toBe(true);
      expect(r.severity).toBe('CRITICAL');
      expect(r.type).toBe('VITALS_BP_HIGH');
    });

    it('triggers HIGH for systolic above threshold', () => {
      const r = evaluateVitals({
        type: 'BP',
        systolic: 150,
        diastolic: 85,
        measuredAt: new Date(),
      });
      expect(r.triggered).toBe(true);
      expect(r.severity).toBe('HIGH');
    });

    it('triggers MEDIUM for low BP', () => {
      const r = evaluateVitals({
        type: 'BP',
        systolic: 80,
        diastolic: 50,
        measuredAt: new Date(),
      });
      expect(r.triggered).toBe(true);
      expect(r.type).toBe('VITALS_BP_LOW');
    });

    it('triggers HIGH for tachycardia', () => {
      const r = evaluateVitals({
        type: 'HR',
        heartRate: 130,
        measuredAt: new Date(),
      });
      expect(r.triggered).toBe(true);
      expect(r.severity).toBe('HIGH');
      expect(r.type).toBe('VITALS_HR_HIGH');
    });

    it('triggers HIGH for bradycardia', () => {
      const r = evaluateVitals({
        type: 'HR',
        heartRate: 40,
        measuredAt: new Date(),
      });
      expect(r.triggered).toBe(true);
      expect(r.type).toBe('VITALS_HR_LOW');
    });

    it('triggers CRITICAL for low SpO2', () => {
      const r = evaluateVitals({
        type: 'OXYGEN',
        oxygen: 88,
        measuredAt: new Date(),
      });
      expect(r.triggered).toBe(true);
      expect(r.severity).toBe('CRITICAL');
      expect(r.type).toBe('VITALS_OXYGEN_LOW');
    });

    it('triggers MEDIUM for high fever', () => {
      const r = evaluateVitals({
        type: 'TEMP',
        bodyTempC: 39.5,
        measuredAt: new Date(),
      });
      expect(r.triggered).toBe(true);
      expect(r.type).toBe('VITALS_TEMP_HIGH');
    });

    it('triggers HIGH for hypothermia', () => {
      const r = evaluateVitals({
        type: 'TEMP',
        bodyTempC: 34.5,
        measuredAt: new Date(),
      });
      expect(r.triggered).toBe(true);
      expect(r.type).toBe('VITALS_TEMP_LOW');
    });
  });

  describe('haversineMeters', () => {
    it('returns 0 for same point', () => {
      const d = haversineMeters(10.776, 106.701, 10.776, 106.701);
      expect(d).toBeLessThan(1);
    });

    it('returns ~111km for 1 degree of latitude', () => {
      const d = haversineMeters(0, 0, 1, 0);
      expect(d).toBeGreaterThan(110_000);
      expect(d).toBeLessThan(112_000);
    });
  });

  describe('isOutsideGeofence', () => {
    const center = { lat: 10.776, lon: 106.701 };

    it('returns false when inside radius', () => {
      expect(isOutsideGeofence({ lat: 10.7761, lon: 106.7009 }, center, 50)).toBe(false);
    });

    it('returns true when outside radius', () => {
      expect(isOutsideGeofence({ lat: 10.79, lon: 106.701 }, center, 50)).toBe(true);
    });
  });
});
