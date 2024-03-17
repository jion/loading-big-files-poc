export interface IContext {
    clientIdentity?: string;
    save: () => void;
}

export interface IChange {
    // Placeholder for the structure of a change object.
    // This should be defined according to the actual data structure you're working with.
}

export interface IServerMessage {
    type: "clientIdentity" | "changes" | "ack" | "error";
    clientIdentity?: string;
    message?: string;
    requestId?: number;
    changes?: IChange[];
    lastRevision?: number;
    partial?: boolean;
}

export interface ISyncOptions {
    // Placeholder for any sync options if necessary.
    // Define properties based on the options you need.
}

export type ApplyRemoteChangesFunction = (changes: IChange[], currentRevision: number, partial: boolean) => void;
export type OnChangesAcceptedFunction = () => void;
export type OnSuccessFunction = (result: { react: Function; disconnect: Function }) => void;
export type OnErrorFunction = (message: string, reconnectDelay: number) => void;
