import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { InventoryRepository } from './inventory.repository.js';

@Module({
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService, InventoryRepository],
})
export class InventoryModule {}
