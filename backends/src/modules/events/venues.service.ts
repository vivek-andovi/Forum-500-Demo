import { Injectable } from '@nestjs/common';
import { VenuesRepository } from './venues.repository';

@Injectable()
export class VenuesService {
  constructor(private readonly repo: VenuesRepository) {}

  list() {
    return this.repo.listPublished();
  }
}
