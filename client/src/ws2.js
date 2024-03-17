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

      this.ws.onopen = (event) => {
        console.log("WebSocket connection established.");
        this.isConnected = true;
        this.flushMessageQueue(); // Flush queued messages upon reconnection
        // Additional initialization logic...
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
      console.log("Applying remote changes: ", changes);
      // Implement the logic to apply changes to the local database or state
    }

  }

  export default WebSocketSyncProtocol;
