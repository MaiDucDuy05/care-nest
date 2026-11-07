import { Controller, Get, Post, Query } from '@nestjs/common';
import { SearchService } from './search.service.js';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('suggest')
  async suggest(@Query('q') q: string) {
    return this.searchService.suggest(q || '');
  }

  @Get('status')
  async status() {
    return this.searchService.getStatus();
  }

  @Post('sync')
  async sync() {
    return this.searchService.syncAllProducts();
  }
}
