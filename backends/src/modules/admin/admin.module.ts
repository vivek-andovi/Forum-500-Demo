import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { MembershipModule } from '../membership/membership.module';
import { AdminCrudController } from './admin-crud.controller';
import { AdminCrudRepository } from './admin-crud.repository';
import { AdminCrudService } from './admin-crud.service';
import { AdminDashboardRepository } from './admin-dashboard.repository';
import { AdminWorkflowsController } from './admin-workflows.controller';
import { AdminWorkflowsService } from './admin-workflows.service';
import { AssetsRepository } from './assets.repository';
import { UploadsController } from './uploads.controller';

/** Admin portal API: generic CRUD for every resource, approvals/workflows, uploads, dashboard. */
@Module({
  imports: [MembershipModule, MediaModule],
  controllers: [AdminCrudController, AdminWorkflowsController, UploadsController],
  providers: [AdminCrudService, AdminCrudRepository, AdminWorkflowsService, AdminDashboardRepository, AssetsRepository],
})
export class AdminModule {}
