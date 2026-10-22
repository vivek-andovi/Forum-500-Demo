import { Global, Module } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Global()
@Module({ providers: [NotificationsService, NotificationsRepository], exports: [NotificationsService] })
export class NotificationsModule {}
