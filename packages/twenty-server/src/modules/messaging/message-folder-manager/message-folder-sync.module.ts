import { Module } from '@nestjs/common';

import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceDataSourceModule } from 'src/engine/workspace-datasource/workspace-datasource.module';
import { MessageFolderSyncResolver } from 'src/modules/messaging/message-folder-manager/message-folder-sync.resolver';
import { MessageFolderSyncService } from 'src/modules/messaging/message-folder-manager/services/message-folder-sync.service';

@Module({
  imports: [PermissionsModule, WorkspaceDataSourceModule],
  providers: [MessageFolderSyncResolver, MessageFolderSyncService],
  exports: [MessageFolderSyncService],
})
export class MessageFolderSyncModule {}
