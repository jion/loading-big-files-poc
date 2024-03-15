import Dexie from 'dexie';

const db = new Dexie('CustomerDB');
db.version(1).stores({
    customers: '$$id, firstName, lastName, email'
});

export { db };
