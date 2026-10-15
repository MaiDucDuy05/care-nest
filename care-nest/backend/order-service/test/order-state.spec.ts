import { describe, it, expect } from 'vitest';
import { OrderStatus } from '@carenest/database';
import { canTransition, assertTransition, isTerminal, InvalidStateTransitionError } from '../src/state-machine/order-state.js';

describe('order-state state machine', () => {
  it('allows CREATED → CONFIRMED and CREATED → CANCELLED', () => {
    expect(canTransition(OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(true);
    expect(canTransition(OrderStatus.CREATED, OrderStatus.CANCELLED)).toBe(true);
  });

  it('rejects CREATED → SHIPPED (must go through CONFIRMED → PACKING → SHIPPED)', () => {
    expect(canTransition(OrderStatus.CREATED, OrderStatus.SHIPPED)).toBe(false);
  });

  it('rejects SHIPPED → CANCELLED (must go to RETURNED or DELIVERED)', () => {
    expect(canTransition(OrderStatus.SHIPPED, OrderStatus.CANCELLED)).toBe(false);
  });

  it('allows full happy-path CREATED → CONFIRMED → PACKING → SHIPPED → DELIVERED', () => {
    expect(canTransition(OrderStatus.CONFIRMED, OrderStatus.PACKING)).toBe(true);
    expect(canTransition(OrderStatus.PACKING, OrderStatus.SHIPPED)).toBe(true);
    expect(canTransition(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).toBe(true);
  });

  it('throws on invalid transition via assertTransition', () => {
    expect(() => assertTransition(OrderStatus.CREATED, OrderStatus.SHIPPED)).toThrow(InvalidStateTransitionError);
  });

  it('marks CANCELLED and RETURNED as terminal', () => {
    expect(isTerminal(OrderStatus.CANCELLED)).toBe(true);
    expect(isTerminal(OrderStatus.RETURNED)).toBe(true);
    expect(isTerminal(OrderStatus.CREATED)).toBe(false);
    expect(isTerminal(OrderStatus.SHIPPED)).toBe(false);
  });

  it('rejects any transition out of terminal states', () => {
    for (const to of Object.values(OrderStatus)) {
      expect(canTransition(OrderStatus.CANCELLED, to)).toBe(false);
      expect(canTransition(OrderStatus.RETURNED, to)).toBe(false);
    }
  });
});
