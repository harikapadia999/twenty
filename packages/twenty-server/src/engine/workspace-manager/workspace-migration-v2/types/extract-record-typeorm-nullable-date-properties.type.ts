export type ExtractRecordTypeOrmNullableDateProperties<T> = NonNullable<
  {
    [P in keyof T]: T[P] extends null
      ? [NonNullable<T[P]>] extends [never]
        ? never
        : NonNullable<T[P]> extends Date
          ? P
          : never
      : never;
  }[keyof T]
>;
