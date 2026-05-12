import Dexie, { type EntityTable } from 'dexie';
import type { SwingSession } from '../types';

// Database schema
const db = new Dexie('StrikeLabAnalyze') as Dexie & {
  sessions: EntityTable<SwingSession, 'id'>;
};

db.version(1).stores({
  sessions: 'id, name, date, category, proGolferId, *tags, createdAt',
});

export { db };

// ===== SwingRepository =====

export const SwingRepository = {
  async getAll(): Promise<SwingSession[]> {
    return db.sessions.orderBy('createdAt').reverse().toArray();
  },

  async getById(id: string): Promise<SwingSession | undefined> {
    return db.sessions.get(id);
  },

  async getByCategory(
    category: 'personal' | 'pro'
  ): Promise<SwingSession[]> {
    return db.sessions
      .where('category')
      .equals(category)
      .reverse()
      .sortBy('createdAt');
  },

  async getByProGolfer(proGolferId: string): Promise<SwingSession[]> {
    return db.sessions
      .where('proGolferId')
      .equals(proGolferId)
      .toArray();
  },

  async create(session: SwingSession): Promise<string> {
    return db.sessions.add(session);
  },

  async update(
    id: string,
    changes: Partial<SwingSession>
  ): Promise<number> {
    return db.sessions.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  },

  async remove(id: string): Promise<void> {
    return db.sessions.delete(id);
  },

  async count(): Promise<number> {
    return db.sessions.count();
  },
};
