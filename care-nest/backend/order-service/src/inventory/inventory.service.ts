import { Injectable } from '@nestjs/common';
import { InventoryRepository } from './inventory.repository.js';

@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  hold(productId: string, quantity: number) {
    return this.inventoryRepository.reserve(productId, quantity);
  }

  release(productId: string, quantity: number) {
    return this.inventoryRepository.release(productId, quantity);
  }

  commit(productId: string, quantity: number) {
    return this.inventoryRepository.commit(productId, quantity);
  }

  getHoldTtlSeconds() {
    return this.inventoryRepository.getHoldTtlSeconds();
  }
}
