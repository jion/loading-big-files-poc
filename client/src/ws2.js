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

      this.ws.onopen = (event) => {
        console.log("WebSocket connection established.");
        this.isConnected = true;
        // Additional initialization can be performed here
      };

      // Error and close handlers
      this.reconnectDelay = options.reconnectDelay || 5000; // Reconnect delay in milliseconds
      this.shouldReconnect = true; // Flag to control reconnection attempts

      this.ws.onerror = (event) => {
        console.error("WebSocket encountered an error: ", event.message);
        this.isConnected = false;
        // No immediate reconnection here, `onclose` will handle it
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket connection closed.");
        this.isConnected = false;
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };

      // Handle messages from the server
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'changes':
            this.applyRemoteChanges(message.changes, message.lastRevision, message.partial);
            break;
          case 'ack':
            if (this.acceptCallbacks[message.requestId]) {
              this.acceptCallbacks[message.requestId]();
              delete this.acceptCallbacks[message.requestId];
            }
            break;
          case 'clientIdentity':
            // Handle client identity setup or update
            break;
          case 'error':
            console.error("Error from server: ", message.message);
            // Implement additional error handling here
            break;
          default:
            console.log("Received unknown message type from server.");
        }
      };
    }

    disconnect() {
      this.shouldReconnect = false; // Prevent reconnection attempts
      if (this.ws) {
        this.ws.close();
        this.ws = null;
        this.isConnected = false;
      }
    }

    sendChanges(changes, baseRevision, partial) {
      const requestId = Date.now(); // Simple example for generating a unique ID
      this.acceptCallbacks[requestId] = () => {
        console.log(`Changes with request ID ${requestId} accepted by server.`);
        // Implement callback actions here
      };

      const message = {
        type: 'changes',
        changes,
        partial,
        baseRevision,
        requestId,
      };

      this.ws.send(JSON.stringify(message));
    }

    applyRemoteChanges(changes, lastRevision, partial) {
      console.log("Applying remote changes: ", changes);
      // Implement the logic to apply changes to the local database or state
    }

  }

  export default WebSocketSyncProtocol;
