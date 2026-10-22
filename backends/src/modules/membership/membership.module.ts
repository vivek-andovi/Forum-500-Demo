import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsService } from './applications.service';
import { BenefitsController } from './benefits.controller';
import { BenefitsRepository } from './benefits.repository';
import { BenefitsService } from './benefits.service';
import { GroupsController } from './groups.controller';
import { GroupsRepository } from './groups.repository';
import { GroupsService } from './groups.service';
import { MembersController } from './members.controller';
import { MembersRepository } from './members.repository';
import { MembersService } from './members.service';
import { ProfileController } from './profile.controller';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';

/** Membership hub: directory, my profile, applications, benefits and groups. */
@Module({
  controllers: [MembersController, ProfileController, ApplicationsController, BenefitsController, GroupsController],
  providers: [
    MembersService, MembersRepository,
    ProfileService, ProfileRepository,
    ApplicationsService, ApplicationsRepository,
    BenefitsService, BenefitsRepository,
    GroupsService, GroupsRepository,
  ],
  exports: [MembersService, ProfileService, ApplicationsService, BenefitsService, GroupsService],
})
export class MembershipModule {}
