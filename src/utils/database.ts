import Dexie, { type Table } from 'dexie';
import type { CSVData } from '../types';

export class CSVDatabase extends Dexie {
  csvData!: Table<CSVData>;

  constructor() {
    super('CSVDatabase');
    this.version(1).stores({
      csvData: 'id, name, uploadDate',
    });
  }
}

export const db = new CSVDatabase();
