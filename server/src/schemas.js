const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
    id: { type: String, required: true, unique: true }, // Use Dexie's id as the primary key
    firstName: String,
    lastName: String,
    email: String,
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

const Customer = mongoose.model('Customer', customerSchema);
const Change = mongoose.model('Change', changeSchema);

module.exports = { Customer, Change };