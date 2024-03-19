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
            const {action, table, key, obj, modifications} = change;
            switch (action) {
                case 'create':
                    await this.create(table, key, obj, clientIdentity);
                    break;
                case 'update':
                    await this.update(table, key, modifications, clientIdentity);
                    break;
                case 'delete':
                    await this.delete(table, key, clientIdentity);
                    break;
                default:
                    throw new Error(`Unknown action ${action}`);
            }
            // Remove the processed change
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

module.exports = MongoDBImplementation;
