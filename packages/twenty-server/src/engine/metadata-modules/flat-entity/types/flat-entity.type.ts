import { type SyncableEntity } from 'src/engine/workspace-manager/workspace-sync/interfaces/syncable-entity.interface';

import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { type ExtractRecordTypeOrmNonNullableDateProperties } from 'src/engine/workspace-manager/workspace-migration-v2/types/extract-record-typeorm-non-nullable-date-properties.type';
import { type ExtractRecordTypeOrmNullableDateProperties } from 'src/engine/workspace-manager/workspace-migration-v2/types/extract-record-typeorm-nullable-date-properties.type';
import { type NonNullableProperties } from 'src/types/non-nullable-properties.type';
import { FieldMetadataType } from 'twenty-shared/types';

export type SyncableFlatEntity = NonNullableProperties<
  Omit<SyncableEntity, 'application' | 'applicationId'>
> & {
  id: string;
  applicationId: string | null;
};

export type EntityNullableDateProperties<TEntity> =
  ExtractRecordTypeOrmNullableDateProperties<TEntity>;

export type EntityNonNullableDateProperties<TEntity> =
  ExtractRecordTypeOrmNonNullableDateProperties<TEntity>;

export type FlatEntityFrom<
  TEntity,
  TEntityRelationProperties extends keyof TEntity,
> = {
  [P in EntityNonNullableDateProperties<TEntity>]: string;
} & {
  [P in EntityNullableDateProperties<TEntity>]: string | null;
} & Omit<
    TEntity,
    | TEntityRelationProperties
    | EntityNonNullableDateProperties<TEntity>
    | EntityNullableDateProperties<TEntity>
    | 'application'
  >;

type toto = EntityNonNullableDateProperties<
  FieldMetadataEntity<FieldMetadataType.SELECT>
>;
type toto2 = EntityNullableDateProperties<
  FieldMetadataEntity<FieldMetadataType.SELECT>
>;
