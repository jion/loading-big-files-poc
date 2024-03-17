import Dexie from 'dexie';
import 'dexie-observable';
import 'dexie-syncable';

class WebSocketSyncProtocol {
  static RECONNECT_DELAY = 5000; // Reconnect delay in milliseconds

  constructor(context, url, options, baseRevision, syncedRevision, changes, partial, applyRemoteChanges, onChangesAccepted, onSuccess, onError) {
    this.context = context;
    this.url = url;
    this.options = options;
    this.baseRevision = baseRevision;
    this.syncedRevision = syncedRevision;
    this.changes = changes;
    this.partial = partial;
    this.applyRemoteChanges = applyRemoteChanges;
    this.onChangesAccepted = onChangesAccepted;
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.requestId = 0;
    this.acceptCallbacks = {};
    this.isFirstRound = true;

    this.ws = new WebSocket(url);
    this.setupWebSocketHandlers();
  }

  setupWebSocketHandlers() {
    this.ws.onopen = this.handleWebSocketOpen.bind(this);
    this.ws.onerror = this.handleWebSocketError.bind(this);
    this.ws.onclose = this.handleWebSocketClose.bind(this);
    this.ws.onmessage = this.handleWebSocketMessage.bind(this);
  }

  handleWebSocketOpen() {
    this.sendClientIdentity();
    this.sendChanges(this.changes, this.baseRevision, this.partial, this.onChangesAccepted);
    this.subscribeToServerChanges();
  }

  handleWebSocketOpen() {
    // 1. Send the client identity to the server
    this.sendClientIdentity();

    // 2. Send any pending changes to the server
    this.sendChanges(this.changes, this.baseRevision, this.partial, this.onChangesAccepted);

    // 3. Subscribe to receive changes from the server
    this.subscribeToServerChanges();
  }

  sendClientIdentity() {
    const clientIdentity = this.context.clientIdentity || null;
    this.sendMessage({
      type: "clientIdentity",
      clientIdentity,
    });
  }

  subscribeToServerChanges() {
    this.sendMessage({
      type: "subscribe",
      syncedRevision: this.syncedRevision,
    });
  }

  sendMessage(message) {
    console.log("Sending message to server:", message);
    this.ws.send(JSON.stringify(message));
  }

  sendChanges(changes, baseRevision, partial, onChangesAccepted) {
    this.requestId++;
    this.acceptCallbacks[this.requestId.toString()] = onChangesAccepted;

    const message = {
      type: 'changes',
      changes,
      partial,
      baseRevision,
      requestId: this.requestId
    };

    console.log("Sending changes to server: ", changes);
    this.ws.send(JSON.stringify(message));
  }

  handleWebSocketError(event) {
    console.error("WebSocket error:", event.message);

    // 1. Close the WebSocket connection
    this.ws.close();

    // 2. Call onError with appropriate message and reconnect delay
    this.onError(event.message, WebSocketSyncProtocol.RECONNECT_DELAY);
  }

  handleWebSocketClose(event) {
    console.log("WebSocket closed:", event.reason || "Unknown reason");

    // 1. Call onError with appropriate message and reconnect delay
    this.onError("Socket closed: " + (event.reason || "Unknown reason"), WebSocketSyncProtocol.RECONNECT_DELAY);
  }

  handleWebSocketMessage(event) {
    try {
      // 1. Parse the received message
      const message = JSON.parse(event.data);

      // 2. Handle different message types
      if (message.type === "changes") {
        this.handleServerChanges(message);
      } else if (message.type === "ack") {
        this.handleAcknowledgement(message);
      } else if (message.type === "clientIdentity") {
        this.handleClientIdentity(message);
      } else if (message.type === "error") {
        this.handleError(message);
      } else {
        console.warn("Unknown message type:", message.type);
      }
    } catch (e) {
      console.error("Error parsing message:", e);
      this.ws.close();
      this.onError(e, Infinity); // Don't reconnect on parsing errors
    }
  }

  handleServerChanges(message) {
    // Apply server changes and handle partial/complete sync
    this.applyRemoteChanges(message.changes, message.currentRevision, message.partial);
    if (this.isFirstRound && !message.partial) {
      this.onSuccess({
        react: (changes, baseRevision, partial, onChangesAccepted) => {
          this.sendChanges(changes, baseRevision, partial, onChangesAccepted);
        },
        disconnect: () => this.ws.close(),
      });
      this.isFirstRound = false;
    }
  }

  handleAcknowledgement(message) {
    // Acknowledge the specific change request sent to the server
    const requestId = message.requestId;
    const acceptCallback = this.acceptCallbacks[requestId.toString()];
    if (acceptCallback) {
      acceptCallback();
      delete this.acceptCallbacks[requestId.toString()];
    }
  }

  handleClientIdentity(message) {
    // Update client identity in context and save it
    this.context.clientIdentity = message.clientIdentity;
    this.context.save();
  }

  handleError(message) {
    // Handle server-side errors and potentially stop reconnection
    console.error("Server error:", message.message);
    this.ws.close();
    this.onError(message.message, Infinity); // Don't reconnect on server errors
  }

  static registerSyncProtocol() {
    Dexie.Syncable.registerSyncProtocol("websocket", WebSocketSyncProtocol);
  }
}

// Usage:
// Dexie.Syncable.sync("websocket", ...);

export default WebSocketSyncProtocol; // Export as an ES module
