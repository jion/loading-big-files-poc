import Dexie from 'dexie';
import setupWebSocketSyncProtocol from './WebSocketSyncProtocol';

setupWebSocketSyncProtocol();

const db = new Dexie('ProgramMigrationsDemoDB');
db.version(1).stores({
  customers: '$$id, merchant_user_id, merchant, first_name, last_name, email, live',
  // addresses: '++id, customer, address_type, city, state_province_code, zip_postal_code, country_code, live, public_id',
  // payments: '++id, customer, live, token_id, billing_address, cc_number, cc_type, cc_exp_date, payment_method, public_id',
  // subscriptions: '++id, customer, product, offer, live, every, every_period, quantity, price, start_date, public_id',
});

export { db };
