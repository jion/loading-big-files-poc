const mongoose = require('mongoose');
const { Customer, Change, UncommittedChange } = require('./schemas');

var CREATE = 1,
    UPDATE = 2,
    DELETE = 3;

class DatabaseAbstraction {
    subscribers = [];

    async create(table, key, obj, clientIdentity, partial = false) {
        throw new Error("Not implemented");
    }

    async update(table, key, modifications, clientIdentity, partial = false) {
        throw new Error("Not implemented");
    }

    async delete(table, key, clientIdentity, partial = false) {
        throw new Error("Not implemented");
    }

    async addPartialChanges(clientIdentity, changes) {
        throw new Error("Not implemented");
    }

    async commitChanges(clientIdentity) {
        throw new Error("Not implemented");
    }

    async discardChanges(clientIdentity) {
        throw new Error("Not implemented");
    }


    async trigger() {
        this.subscribers.forEach(async (subscriber) => {
            try {
                await subscriber();
            } catch (e) {
                console.error(e);
            }
        });
    }

    async subscribe(fn) {
        this.subscribers.push(fn);
    }

    async unsubscribe(fn) {
        this.subscribers.splice(this.subscribers.indexOf(fn), 1);
    }
}

class MongoDBImplementation extends DatabaseAbstraction {

    revision = 0;

    constructor() {
        super();
    }

    async create(table, key, obj, clientIdentity, partial = false) {
        if (partial) {
            await this.addPartialChanges(clientIdentity, [{
                action: 'create',
                table,
                key,
                obj
            }]);
        } else {
            const model = getModelForTable(table);
            const document = new model({ key, ...obj });
            await document.save();

            const change = new Change({
                rev: ++this.revision,
                source: clientIdentity,
                type: CREATE,
                table,
                key,
                obj
            });
            await change.save();
        }

        this.trigger();
    }

    async update(table, key, modifications, clientIdentity, partial = false) {
        if (partial) {
            await this.addPartialChanges(clientIdentity, [{
                action: 'update',
                table,
                key,
                modifications
            }]);
        } else {
            const model = getModelForTable(table);
            await model.findOneAndUpdate({ key }, { $set: modifications });
            const change = new Change({
                rev: ++this.revision,
                source: clientIdentity,
                type: UPDATE,
                table,
                key,
                modifications
            });
            await change.save();
        }

        this.trigger();
    }

    async delete(table, key, clientIdentity, partial = false) {
        if (partial) {
            await this.addPartialChanges(clientIdentity, [{
                action: 'delete',
                table,
                key
            }]);
        } else {
            const model = getModelForTable(table);
            await model.findOneAndDelete({ key });
            const change = new Change({
                rev: ++this.revision,
                source: clientIdentity,
                type: DELETE,
                table,
                key
            });
            await change.save();
        }

        this.trigger();
    }

    async addPartialChanges(clientIdentity, changes) {
        const uncommittedChanges = changes.map(change => ({
            clientID: clientIdentity,
            ...change
        }));
        await UncommittedChange.insertMany(uncommittedChanges);
    }

    async getChanges(gtRevision, excludeSource = null) {
        let query = { rev: { $gt: gtRevision } };
        if (excludeSource !== null) {
            query.source = { $ne: excludeSource };
        }

        return await Change.find(query).lean();
    }

    async commitChanges(clientIdentity) {
        const changes = await UncommittedChange.find({ clientID: clientIdentity });
        for (const change of changes) {
            await UncommittedChange.findByIdAndDelete(change._id);
        }
    }

    async discardChanges(clientIdentity) {
        await UncommittedChange.deleteMany({ clientID: clientIdentity });
    }

}

function getModelForTable(table) {
  // This function should map 'table' names to your Mongoose models.
  // For example:
  switch (table) {
    case 'customers':
      return Customer;
    // Add other cases as needed.
    default:
      throw new Error('Unknown table: ' + table);
  }
}

class InMemoryDBImplementation extends DatabaseAbstraction {
    tables = {};  // Tables: Each key is a table and its value is another object where each key is the primary key and value is the record / object that is stored in ram.
    changes = []; // Special table that records all changes made to the db. In this simple sample, we let it grow infinitly. In real world, we would have had a regular cleanup of old changes.
    uncommittedChanges = {}; // Map<clientID,Array<change>> Changes where partial=true buffered for being committed later on.
    revision = 0; // Current revision of the database.
    subscribers = []; // Subscribers to when database got changes. Used by server connections to be able to push out changes to their clients as they occur.

    async create(table, key, obj, clientIdentity, partial = false) {
        if (partial) {
            await this.addPartialChanges(clientIdentity, [{
                action: 'create',
                table,
                key,
                obj
            }]);
        } else {
            // Create table if it doesnt exist:
            this.tables[table] = this.tables[table] || {};
            // Put the obj into to table
            this.tables[table][key] = obj;
            // Register the change:
            this.changes.push({
                rev: ++this.revision,
                source: clientIdentity,
                type: CREATE,
                table: table,
                key: key,
                obj: obj
            });
            this.trigger();
        }
    }

    async update(table, key, modifications, clientIdentity, partial = false) {
        if (partial) {
            await this.addPartialChanges(clientIdentity, [{
                action: 'update',
                table,
                key,
                modifications
            }]);
        } else {
            if (this.tables[table]) {
                var obj = this.tables[table][key];
                if (obj) {
                    applyModifications(obj, modifications);
                    this.changes.push({
                        rev: ++this.revision,
                        source: clientIdentity,
                        type: UPDATE,
                        table: table,
                        key: key,
                        mods: modifications
                    });
                    this.trigger();
                }
            }
        }
    }

    async delete(table, key, clientIdentity, partial = false) {
        if (partial) {
            await this.addPartialChanges(clientIdentity, [{
                action: 'delete',
                table,
                key
            }]);
        } else {
            if (this.tables[table]) {
                if (this.tables[table][key]) {
                    delete this.tables[table][key];
                    this.changes.push({
                        rev: ++this.revision,
                        source: clientIdentity,
                        type: DELETE,
                        table: table,
                        key: key,
                    });
                    this.trigger();
                }
            }
        }
    }

    async addPartialChanges(clientIdentity, changes) {
        if (this.uncommittedChanges[clientIdentity]) {
            // Concat the changes to existing change set:
            this.uncommittedChanges[clientIdentity] = this.uncommittedChanges[clientIdentity].concat(changes);
        } else {
            // Create the change set:
            this.uncommittedChanges[clientIdentity] = changes;
        }
    }

    async getChanges(gtRevision, excludeSource = null) {

        let changes = this.changes.filter(function (change) { return change.rev > gtRevision });
        if (excludeSource !== null) {
            changes = changes.filter(function (change) { return change.source !== excludeSource });
        }

        return changes;
    }

    async commitChanges(clientIdentity) {
        if (this.uncommittedChanges[clientIdentity]) {
            this.changes = this.uncommittedChanges[clientIdentity].concat(this.changes);
            delete this.uncommittedChanges[clientIdentity];
        }
    }
};

module.exports = {
    MongoDBImplementation,
    InMemoryDBImplementation
};
