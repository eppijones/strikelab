import Dexie, { type EntityTable } from 'dexie'

export interface RangeSessionImportRow {
  /** Same id as `session.id` from payload — re-import replaces. */
  id: string
  importedAt: string
  label: string
  shotCount: number
  startTime: string
  sourceApp: string
  schemaVersion: number
  /** Full envelope JSON for round-tripping / backups. */
  rawJson: string
}

const rangeDb = new Dexie('StrikeLabRangeImports') as Dexie & {
  imports: EntityTable<RangeSessionImportRow, 'id'>
}

rangeDb.version(1).stores({
  imports: 'id, startTime, importedAt',
})

export { rangeDb }

export const RangeImportRepository = {
  async list(): Promise<RangeSessionImportRow[]> {
    return rangeDb.imports.orderBy('importedAt').reverse().toArray()
  },

  async get(id: string): Promise<RangeSessionImportRow | undefined> {
    return rangeDb.imports.get(id)
  },

  async upsert(row: RangeSessionImportRow): Promise<void> {
    await rangeDb.imports.put(row)
  },

  async remove(id: string): Promise<void> {
    await rangeDb.imports.delete(id)
  },

  async downloadBackup(): Promise<string> {
    const all = await rangeDb.imports.toArray()
    return JSON.stringify(
      { exportedAt: new Date().toISOString(), schemaVersion: 1, imports: all },
      null,
      2,
    )
  },
}
