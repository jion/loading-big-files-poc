import Dexie from 'dexie';

export const db = new Dexie('CustomerDB');
db.version(1).stores({
    customers: '++id, firstName, lastName, email'
});
