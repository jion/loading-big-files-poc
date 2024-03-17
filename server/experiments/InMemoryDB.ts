class InMemoryDB implements Database {
    private tables: { [table: string]: { [key: string]: any } };
    private changes: IChange[];
    private uncommittedChanges: { [clientIdentity: string]: IChange[] };
    private revision: number;
    private subscribers: (() => void)[];

    constructor() {
      this.tables = {};
      this.changes = [];
      this.uncommittedChanges = {};
      this.revision = 0;
      this.subscribers = [];
    }
  
    create(table: string, key: string, obj: any, clientIdentity: string): Promise<void> {
      // Create table if it doesn't exist
      this.tables[table] = this.tables[table] || {};
  
      // Put the object into the table
      this.tables[table][key] = obj;
  
      // Register the change
      this.changes.push({
        rev: ++this.revision,
        source: clientIdentity,
        type: 'CREATE',
        table,
        key,
        obj,
      });
  
      this.trigger();
      return Promise.resolve(); // Resolve with no value for consistency with other methods
    }
  
    update(table: string, key: string, modifications: any, clientIdentity: string): Promise<void> {
      if (this.tables[table]) {
        const obj = this.tables[table][key];
        if (obj) {
          applyModifications(obj, modifications);
  
          this.changes.push({
            rev: ++this.revision,
            source: clientIdentity,
            type: 'UPDATE',
            table,
            key,
            mods: modifications,
          });
  
          this.trigger();
        }
      }
      return Promise.resolve();
    }
  
    delete(table: string, key: string, clientIdentity: string): Promise<void> {
      if (this.tables[table]) {
        if (this.tables[table][key]) {
          delete this.tables[table][key];
  
          this.changes.push({
            rev: ++this.revision,
            source: clientIdentity,
            type: 'DELETE',
            table,
            key,
          });
  
          this.trigger();
        }
      }
      return Promise.resolve();
    }
  
    subscribe(fn: () => void): () => void {
      this.subscribers.push(fn);
      return () => this.unsubscribe(fn); // Return unsubscribe function
    }
  
    unsubscribe(fn: () => void): void {
      const index = this.subscribers.indexOf(fn);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    }
  
    private trigger() {
      if (!this.trigger.delayedHandle) {
        // Delay the trigger to call it only once per changeset
        this.trigger.delayedHandle = setTimeout(() => {
          delete this.trigger.delayedHandle;
          this.subscribers.forEach((subscriber) => {
            try {
              subscriber();
            } catch (e) { /* Ignore errors in subscriber functions */ }
          });
        }, 0);
      }
    }
  }
  