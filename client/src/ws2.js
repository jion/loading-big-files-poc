class WebSocketSyncProtocol {
    constructor(url, options = {}) {
      this.url = url;
      this.options = options;
      this.ws = null;
      this.isConnected = false;
      this.acceptCallbacks = {};
    }

    connect() {
      this.ws = new WebSocket(this.url);
      this.messageQueue = []; // Initialize the message queue

      this.ws.onopen = () => {
        console.log("WebSocket connection established.");
        this.isConnected = true;
        // Send clientIdentity message
        const clientIdentityMessage = {
          type: "clientIdentity",
          clientIdentity: this.options.clientIdentity || null // Assuming this is stored in options or another appropriate place
        };
        this.ws.send(JSON.stringify(clientIdentityMessage));

        // Send subscribe message
        const subscribeMessage = {
          type: "subscribe",
          syncedRevision: this.options.syncedRevision || null // Likewise, assuming stored in options
        };
        this.ws.send(JSON.stringify(subscribeMessage));

        this.flushMessageQueue(); // Flush queued messages upon reconnection
      };

      // Error and close handlers
      this.reconnectDelay = options.reconnectDelay || 5000; // Reconnect delay in milliseconds
      this.shouldReconnect = true; // Flag to control reconnection attempts

      this.onError = (errorMessage, retryDelay) => {
        console.error(`Error encountered: ${errorMessage}. Retry in ${retryDelay}ms`);
        if (retryDelay === Infinity) {
          this.shouldReconnect = false; // Do not attempt to reconnect for non-recoverable errors
        } else {
          setTimeout(() => this.connect(), retryDelay);
        }
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket connection closed.");
        this.isConnected = false;
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };

      this.onSuccess = (reactFunction, disconnectFunction) => {
        console.log("Sync successful. Ready for application use.");
        // Expose functions for reacting to changes and disconnecting
        this.react = reactFunction;
        this.disconnectOverride = disconnectFunction;
      };

      // Handle messages from the server
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "clientIdentity":
            this.options.clientIdentity = message.clientIdentity;
            console.log("Received new clientIdentity:", message.clientIdentity);
            // Potentially save the clientIdentity for future sessions
            break;
          case "ack":
            if (this.acceptCallbacks[message.requestId]) {
              this.acceptCallbacks[message.requestId]();
              delete this.acceptCallbacks[message.requestId];
            }
            break;
          case "error":
            this.onError(message.message, Infinity); // Handle as a non-recoverable error
            break;
          case "changes":
            // Assuming applyRemoteChanges is implemented to handle this
            this.applyRemoteChanges(message.changes, message.lastRevision, message.partial);
            if (!message.partial) {
              // First complete sync
              this.onSuccess(() => {/* react function */}, () => this.disconnect());
            }
            break;
          default:
            console.warn("Received unknown message type:", message.type);
        }
      };
    }

    disconnect() {
      // Check if there are pending operations that need to be completed before disconnecting
      if (Object.keys(this.acceptCallbacks).length > 0) {
        console.warn("Waiting for pending operations to complete before disconnecting...");
        // Implement logic to wait for operations to complete or to notify the server
      }

      // Prevent further reconnection attempts
      this.shouldReconnect = false;

      // Close the WebSocket connection
      if (this.ws) {
        this.ws.close();
        this.ws = null;
        this.isConnected = false;
      }
    }

    sendChanges(changes, baseRevision, partial) {
      const message = {
        type: 'changes',
        changes,
        partial,
        baseRevision,
        requestId: Date.now(),
      };

      if (!this.isConnected) {
        console.log("Connection is down, queuing message");
        this.messageQueue.push(message);
      } else {
        this.ws.send(JSON.stringify(message));
      }
    }

    // Add logic to flush message queue upon reconnection
    flushMessageQueue() {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift(); // Get the first message from the queue
        this.ws.send(JSON.stringify(message));
      }
    }

    applyRemoteChanges(changes, lastRevision, partial) {
      // Here you would apply the changes to your application's data store
      console.log("Applying remote changes:", changes);
      // For example, updating the state in a React component or a global state management library
    }

  }

  export default WebSocketSyncProtocol;
