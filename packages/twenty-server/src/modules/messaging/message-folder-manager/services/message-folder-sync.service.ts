import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { isNumber } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { In } from 'typeorm';

import {
  WorkspaceQueryRunnerException,
  WorkspaceQueryRunnerExceptionCode,
} from 'src/engine/api/graphql/workspace-query-runner/workspace-query-runner.exception';
import { type WorkspaceEntityManager } from 'src/engine/twenty-orm/entity-manager/workspace-entity-manager';
import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';
import {
  MessageFolderImportPolicy,
  type MessageChannelWorkspaceEntity,
} from 'src/modules/messaging/common/standard-objects/message-channel.workspace-entity';
import { type MessageFolderWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-folder.workspace-entity';

@Injectable()
export class MessageFolderSyncService {
  constructor(
    private readonly twentyORMGlobalManager: TwentyORMGlobalManager,
  ) {}

  async updateMessageFoldersSyncStatus(
    workspaceId: string,
    messageFolderIds: string[],
    isSynced: boolean,
  ): Promise<void> {
    const workspaceDataSource =
      await this.twentyORMGlobalManager.getDataSourceForWorkspace({
        workspaceId,
      });

    if (!workspaceDataSource) {
      throw new WorkspaceQueryRunnerException(
        'Workspace data source not found',
        WorkspaceQueryRunnerExceptionCode.DATA_NOT_FOUND,
      );
    }

    const messageFolderRepository =
      await this.twentyORMGlobalManager.getRepositoryForWorkspace<MessageFolderWorkspaceEntity>(
        workspaceId,
        'messageFolder',
      );

    const messageChannelRepository =
      await this.twentyORMGlobalManager.getRepositoryForWorkspace<MessageChannelWorkspaceEntity>(
        workspaceId,
        'messageChannel',
      );

    await workspaceDataSource.transaction(
      async (transactionManager: WorkspaceEntityManager) => {
        const folders = await messageFolderRepository.find(
          {
            where: { id: In(messageFolderIds) },
            lock: { mode: 'pessimistic_write' },
          },
          transactionManager,
        );

        if (folders.length !== messageFolderIds.length) {
          const foundIds = new Set(folders.map((folder) => folder.id));
          const missingIds = messageFolderIds.filter((id) => !foundIds.has(id));

          throw new WorkspaceQueryRunnerException(
            `Message folders not found: ${missingIds.join(', ')}`,
            WorkspaceQueryRunnerExceptionCode.DATA_NOT_FOUND,
            {
              userFriendlyMessage: msg`Some message folders were not found`,
            },
          );
        }

        const channelIds = [
          ...new Set(folders.map((folder) => folder.messageChannelId)),
        ];

        if (channelIds.length !== 1) {
          throw new WorkspaceQueryRunnerException(
            'All folders must belong to the same message channel',
            WorkspaceQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
            {
              userFriendlyMessage: msg`All folders must belong to the same message channel`,
            },
          );
        }

        const messageChannelId = channelIds[0];

        const messageChannel = await messageChannelRepository.findOne(
          {
            where: { id: messageChannelId },
            lock: { mode: 'pessimistic_write' },
          },
          transactionManager,
        );

        if (!messageChannel) {
          throw new WorkspaceQueryRunnerException(
            'Message channel not found',
            WorkspaceQueryRunnerExceptionCode.DATA_NOT_FOUND,
            {
              userFriendlyMessage: msg`Message channel not found`,
            },
          );
        }

        if (
          !isSynced &&
          messageChannel.messageFolderImportPolicy ===
            MessageFolderImportPolicy.SELECTED_FOLDERS
        ) {
          const totalSyncedCount = await messageFolderRepository.count(
            {
              where: {
                messageChannelId,
                isSynced: true,
              },
            },
            transactionManager,
          );

          const foldersBeingUnsynced = folders.filter(
            (folder) => folder.isSynced,
          ).length;

          const remainingSynced = totalSyncedCount - foldersBeingUnsynced;

          if (
            isDefined(totalSyncedCount) &&
            isNumber(totalSyncedCount) &&
            remainingSynced < 1
          ) {
            throw new WorkspaceQueryRunnerException(
              'Cannot unsync folders: at least one folder must remain synced',
              WorkspaceQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
              {
                userFriendlyMessage: msg`At least one folder must be synced.`,
              },
            );
          }
        }

        await messageFolderRepository.update(
          { id: In(messageFolderIds) },
          { isSynced },
          transactionManager,
        );
      },
    );
  }
}
