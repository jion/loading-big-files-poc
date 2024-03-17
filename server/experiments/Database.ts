interface Database {
    create(table: string, key: string, obj: any, clientIdentity: string): Promise<void>;
    update(table: string, key: string, modifications: any, clientIdentity: string): Promise<void>;
    delete(table: string, key: string, clientIdentity: string): Promise<void>;
    subscribe(fn: () => void): () => void;
    unsubscribe(fn: () => void): void;
}