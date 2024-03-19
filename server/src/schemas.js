const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
    id: { type: String, required: true, unique: true }, // Use Dexie's id as the primary key
    merchant_user_id: String,
    merchant: String,
    first_name: String,
    last_name: String,
    email: String,
    live: Boolean,
  });

const changeSchema = new Schema({
  rev: Number,
  source: String,
  type: Number, // CREATE = 1, UPDATE = 2, DELETE = 3
  table: String,
  key: String,
  obj: Schema.Types.Mixed,
  mods: Schema.Types.Mixed,
  date: { type: Date, default: Date.now },
});

const UncommittedChangeSchema = new mongoose.Schema({
  rev: Number,
  source: String,
  type: Number, // CREATE = 1, UPDATE = 2, DELETE = 3
  table: String,
  key: String,
  obj: Schema.Types.Mixed,
  mods: Schema.Types.Mixed,
  date: { type: Date, default: Date.now },
});

const Customer = mongoose.model('Customer', customerSchema);
const Change = mongoose.model('Change', changeSchema);
const UncommittedChange = mongoose.model('UncommittedChange', UncommittedChangeSchema);

module.exports = { Customer, Change, UncommittedChange };
