import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';

import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { UpdateMessageFoldersSyncStatusSuccessDTO } from 'src/modules/messaging/message-folder-manager/dtos/update-message-folders-sync-status-success.dto';
import { UpdateMessageFoldersSyncStatusInput } from 'src/modules/messaging/message-folder-manager/dtos/update-message-folders-sync-status.input';
import { MessageFolderSyncService } from 'src/modules/messaging/message-folder-manager/services/message-folder-sync.service';

@Resolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(AuthGraphqlApiExceptionFilter)
@UseGuards(WorkspaceAuthGuard)
export class MessageFolderSyncResolver {
  constructor(
    private readonly messageFolderSyncService: MessageFolderSyncService,
  ) {}

  @Mutation(() => UpdateMessageFoldersSyncStatusSuccessDTO)
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.CONNECTED_ACCOUNTS))
  async updateMessageFoldersSyncStatus(
    @Args('input') input: UpdateMessageFoldersSyncStatusInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<UpdateMessageFoldersSyncStatusSuccessDTO> {
    await this.messageFolderSyncService.updateMessageFoldersSyncStatus(
      workspace.id,
      input.messageFolderIds,
      input.isSynced,
    );

    return { success: true };
  }
}
