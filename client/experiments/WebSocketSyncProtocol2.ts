import {
    IContext,
    ISyncOptions,
    IChange,
    IServerMessage,
    ApplyRemoteChangesFunction,
    OnChangesAcceptedFunction,
    OnSuccessFunction,
    OnErrorFunction,
  } from './Interfaces';

  export class WebSocketSyncProtocol {
    private requestId: number = 0;
    private acceptCallbacks: { [key: string]: OnChangesAcceptedFunction } = {};

    public sync(
      context: IContext,
      url: string,
      options: ISyncOptions,
      baseRevision: number,
      syncedRevision: number,
      changes: IChange[],
      partial: boolean,
      applyRemoteChanges: ApplyRemoteChangesFunction,
      onChangesAccepted: OnChangesAcceptedFunction,
      onSuccess: OnSuccessFunction,
      onError: OnErrorFunction
    ): void {
      const ws = new WebSocket(url);

      const sendChanges = (changes: IChange[], baseRevision: number, partial: boolean, onChangesAccepted: OnChangesAcceptedFunction): void => {
        this.requestId++;
        this.acceptCallbacks[this.requestId.toString()] = onChangesAccepted;

        ws.send(JSON.stringify({
          type: 'changes',
          changes,
          partial,
          baseRevision,
          requestId: this.requestId
        }));
      };

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "clientIdentity", clientIdentity: context.clientIdentity || null }));
        sendChanges(changes, baseRevision, partial, onChangesAccepted);
        ws.send(JSON.stringify({ type: "subscribe", syncedRevision }));
      };

      ws.onerror = (event: Event) => {
        ws.close();
        onError("WebSocket error", 5000);
      };

      ws.onclose = (event: CloseEvent) => {
        onError("WebSocket closed: " + event.reason, 5000);
      };

      ws.onmessage = (event: MessageEvent) => {
        const requestFromServer: IServerMessage = JSON.parse(event.data);
        switch (requestFromServer.type) {
          case "changes":
            applyRemoteChanges(requestFromServer.changes!, requestFromServer.lastRevision!, requestFromServer.partial!);
            if (!requestFromServer.partial) {
              onSuccess({
                react: (changes: IChange[], baseRevision: number, partial: boolean, onChangesAccepted: OnChangesAcceptedFunction) => {
                  sendChanges(changes, baseRevision, partial, onChangesAccepted);
                },
                disconnect: () => ws.close(),
              });
            }
            break;
          case "ack":
            const acceptCallback = this.acceptCallbacks[requestFromServer.requestId!.toString()];
            if (acceptCallback) {
              acceptCallback();
              delete this.acceptCallbacks[requestFromServer.requestId!.toString()];
            }
            break;
          case "clientIdentity":
            context.clientIdentity = requestFromServer.clientIdentity;
            context.save();
            break;
          case "error":
            ws.close();
            onError(requestFromServer.message!, Infinity); // Don't reconnect - an error at the application level means something went wrong.
            break;
        }
      };
    }
  }
