import Dexie from 'dexie';

const db = new Dexie('CustomerDB');
db.version(1).stores({
    customers: '++id, merchant, merchant_user_id, first_name, last_name, email, live, phone_number, [first_name+last_name], email',
    addresses: '++id, customer, address_type, city, state_province_code, zip_postal_code, country_code, live, public_id',
    payments: '++id, customer, live, token_id, billing_address, cc_number, cc_type, cc_exp_date, payment_method, public_id',
    subscriptions: '++id, customer, product, offer, live, every, every_period, quantity, price, start_date, public_id',
  });

export { db };
