/**
 * Order state machine — pure transitions, no I/O.
 *
 * Lifecycle:
 *   CREATED → CONFIRMED → PACKING → SHIPPED → DELIVERED → (COMPLETED)
 *      ↓          ↓         ↓        ↓
 *  CANCELLED  CANCELLED  CANCELLED  RETURNED
 *
 * Terminal states: COMPLETED, CANCELLED, RETURNED.
 *
 * Payment events (from payment-service) drive the CREATED → CONFIRMED
 * transition; seller actions drive CONFIRMED → PACKING → SHIPPED;
 * courier webhook (Phase 2) drives SHIPPED → DELIVERED.
 */

import { OrderStatus } from '@carenest/database';

const ALLOWED: Record<OrderStatus, ReadonlySet<OrderStatus>> = {
  [OrderStatus.CREATED]: new Set([OrderStatus.CONFIRMED, OrderStatus.CANCELLED]),
  [OrderStatus.CONFIRMED]: new Set([OrderStatus.PACKING, OrderStatus.CANCELLED]),
  [OrderStatus.PACKING]: new Set([OrderStatus.SHIPPED, OrderStatus.CANCELLED]),
  [OrderStatus.SHIPPED]: new Set([OrderStatus.DELIVERED, OrderStatus.RETURNED]),
  [OrderStatus.DELIVERED]: new Set([OrderStatus.RETURNED]),
  [OrderStatus.CANCELLED]: new Set(),
  [OrderStatus.RETURNED]: new Set(),
};

const TERMINAL_STATES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.CANCELLED,
  OrderStatus.RETURNED,
]);

export class InvalidStateTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Invalid order state transition: ${from} → ${to}`);
    this.name = 'InvalidStateTransitionError';
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED[from]?.has(to) ?? false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidStateTransitionError(from, to);
  }
}

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATES.has(status);
}

export const ORDER_TRANSITIONS = ALLOWED;
