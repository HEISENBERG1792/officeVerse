// ============================================
// FILE: src/network/roomSocket.js
// ============================================
import { NETWORK_CONFIG } from '../utils/constants.js';

/**
 * RoomSocket handles real-time room/lobby updates
 * - Room creation/deletion notifications
 * - Player join/leave events
 * - Room state changes (player count, status)
 * - Lobby updates for room browser
 */
class RoomSocket {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Map();
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
  }

  /**
   * Connect to room WebSocket server
   * @param {string} playerId - Current player ID
   * @returns {Promise<void>}
   */
  connect(playerId) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${NETWORK_CONFIG.WS_URL}/rooms`);
        
        this.ws.onopen = () => {
          console.log('Room socket connected');
          this.connected = true;
          this.reconnecting = false;
          this.reconnectAttempts = 0;

          // Send initial join message
          this.send('join', { playerId });

          // Start heartbeat
          this.startHeartbeat();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse room socket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Room socket error:', error);
          if (!this.connected) {
            reject(error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('Room socket disconnected', event.code, event.reason);
          this.connected = false;
          this.stopHeartbeat();

          // Attempt to reconnect unless explicitly closed
          if (event.code !== 1000 && !this.reconnecting) {
            this.attemptReconnect(playerId);
          }
        };

      } catch (error) {
        console.error('Failed to create room socket:', error);
        reject(error);
      }
    });
  }

  /**
   * Send message to server
   * @param {string} type - Message type
   * @param {object} data - Message data
   */
  send(type, data = {}) {
    if (this.ws && this.connected && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: Date.now()
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: socket not connected');
    }
  }

  /**
   * Handle incoming messages from server
   * @param {object} message - Parsed message object
   */
  handleMessage(message) {
    const { type, data } = message;

    // Handle heartbeat pong
    if (type === 'pong') {
      this.resetHeartbeatTimeout();
      return;
    }

    // Trigger registered listeners
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${type} listener:`, error);
        }
      });
    }

    // Trigger wildcard listeners
    const wildcardCallbacks = this.listeners.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => {
        try {
          callback({ type, data });
        } catch (error) {
          console.error('Error in wildcard listener:', error);
        }
      });
    }
  }

  /**
   * Register event listener
   * @param {string} event - Event type (or '*' for all events)
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event type
   * @param {function} callback - Callback function to remove
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event type
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  // ==================== Room Management Methods ====================

  /**
   * Subscribe to room list updates
   */
  subscribeToRoomList() {
    this.send('subscribeRoomList');
  }

  /**
   * Unsubscribe from room list updates
   */
  unsubscribeFromRoomList() {
    this.send('unsubscribeRoomList');
  }

  /**
   * Create a new room
   * @param {string} roomName - Room name
   * @param {object} options - Room options (maxPlayers, isPrivate, password)
   */
  createRoom(roomName, options = {}) {
    this.send('createRoom', {
      roomName,
      maxPlayers: options.maxPlayers || 20,
      isPrivate: options.isPrivate || false,
      password: options.password || null
    });
  }

  /**
   * Join a room
   * @param {string} roomId - Room ID to join
   * @param {string} password - Optional password
   */
  joinRoom(roomId, password = null) {
    this.send('joinRoom', { roomId, password });
  }

  /**
   * Leave current room
   * @param {string} roomId - Room ID to leave
   */
  leaveRoom(roomId) {
    this.send('leaveRoom', { roomId });
  }

  /**
   * Request current room state
   * @param {string} roomId - Room ID
   */
  requestRoomState(roomId) {
    this.send('getRoomState', { roomId });
  }

  /**
   * Update room settings (host only)
   * @param {string} roomId - Room ID
   * @param {object} settings - Room settings to update
   */
  updateRoomSettings(roomId, settings) {
    this.send('updateRoomSettings', { roomId, settings });
  }

  /**
   * Kick player from room (host only)
   * @param {string} roomId - Room ID
   * @param {string} playerId - Player ID to kick
   */
  kickPlayer(roomId, playerId) {
    this.send('kickPlayer', { roomId, playerId });
  }

  /**
   * Transfer host to another player (host only)
   * @param {string} roomId - Room ID
   * @param {string} newHostId - New host player ID
   */
  transferHost(roomId, newHostId) {
    this.send('transferHost', { roomId, newHostId });
  }

  /**
   * Send ready status
   * @param {string} roomId - Room ID
   * @param {boolean} isReady - Ready status
   */
  setReady(roomId, isReady) {
    this.send('setReady', { roomId, isReady });
  }

  /**
   * Start game (host only)
   * @param {string} roomId - Room ID
   */
  startGame(roomId) {
    this.send('startGame', { roomId });
  }

  // ==================== Heartbeat Methods ====================

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat

    // Send ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.connected) {
        this.send('ping');
        
        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout - connection may be lost');
          this.ws.close();
        }, 5000);
      }
    }, 30000);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Reset heartbeat timeout (called when pong received)
   */
  resetHeartbeatTimeout() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  // ==================== Reconnection Methods ====================

  /**
   * Attempt to reconnect to server
   * @param {string} playerId - Player ID
   */
  attemptReconnect(playerId) {
    if (this.reconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnecting = true;
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.emit('reconnecting', { 
      attempt: this.reconnectAttempts, 
      maxAttempts: this.maxReconnectAttempts 
    });

    setTimeout(() => {
      this.connect(playerId)
        .then(() => {
          console.log('Reconnected successfully');
          this.emit('reconnected');
        })
        .catch((error) => {
          console.error('Reconnection failed:', error);
          this.attemptReconnect(playerId);
        });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Emit custom event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // ==================== Connection Management ====================

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
      this.connected = false;
      this.reconnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   * @returns {string} - 'CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'
   */
  getState() {
    if (!this.ws) return 'CLOSED';
    
    const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    return states[this.ws.readyState];
  }
}

// Export singleton instance
export default new RoomSocket();


// ==================== USAGE EXAMPLES ====================

/*

// In LobbyScene.js
import roomSocket from '../../network/roomSocket.js';
import GameState from '../../state/GameState.js';

class LobbyScene extends Phaser.Scene {
  async create() {
    // Connect to room socket
    await roomSocket.connect(GameState.player.id);

    // Subscribe to room list updates
    roomSocket.subscribeToRoomList();

    // Listen for room list updates
    roomSocket.on('roomListUpdated', (rooms) => {
      console.log('Available rooms:', rooms);
      this.updateRoomList(rooms);
    });

    // Listen for room created
    roomSocket.on('roomCreated', (data) => {
      console.log('New room created:', data);
      this.addRoomToList(data.room);
    });

    // Listen for room deleted
    roomSocket.on('roomDeleted', (data) => {
      console.log('Room deleted:', data.roomId);
      this.removeRoomFromList(data.roomId);
    });

    // Listen for room state changes
    roomSocket.on('roomStateChanged', (data) => {
      console.log('Room state changed:', data);
      this.updateRoomInList(data.roomId, data.state);
    });

    // Listen for join success
    roomSocket.on('joinedRoom', (data) => {
      console.log('Joined room:', data);
      GameState.setRoom(data.room);
      this.scene.start('OfficeScene');
    });

    // Listen for join error
    roomSocket.on('joinError', (data) => {
      console.error('Failed to join room:', data.message);
      this.showError(data.message);
    });

    // Listen for player joined (in room)
    roomSocket.on('playerJoinedRoom', (data) => {
      console.log('Player joined room:', data.playerName);
      this.updatePlayerList(data.players);
    });

    // Listen for player left (in room)
    roomSocket.on('playerLeftRoom', (data) => {
      console.log('Player left room:', data.playerName);
      this.updatePlayerList(data.players);
    });

    // Listen for reconnection events
    roomSocket.on('reconnecting', (data) => {
      this.showMessage(`Reconnecting... (${data.attempt}/${data.maxAttempts})`);
    });

    roomSocket.on('reconnected', () => {
      this.showMessage('Reconnected successfully!');
    });

    roomSocket.on('maxReconnectAttemptsReached', () => {
      this.showError('Connection lost. Please refresh.');
    });
  }

  createRoom() {
    const roomName = this.roomNameInput.value;
    roomSocket.createRoom(roomName, {
      maxPlayers: 20,
      isPrivate: false
    });
  }

  joinRoom(roomId) {
    roomSocket.joinRoom(roomId);
  }

  shutdown() {
    // Unsubscribe and disconnect
    roomSocket.unsubscribeFromRoomList();
    roomSocket.removeAllListeners();
  }
}

// In RoomWaitingScene.js (waiting for game to start)
class RoomWaitingScene extends Phaser.Scene {
  create() {
    const roomId = GameState.room.id;

    // Request current room state
    roomSocket.requestRoomState(roomId);

    // Listen for room state updates
    roomSocket.on('roomState', (data) => {
      this.updateRoomInfo(data);
    });

    // Listen for ready status changes
    roomSocket.on('playerReadyChanged', (data) => {
      console.log(`${data.playerName} is ${data.isReady ? 'ready' : 'not ready'}`);
      this.updatePlayerReadyStatus(data.playerId, data.isReady);
    });

    // Listen for game start
    roomSocket.on('gameStarting', (data) => {
      console.log('Game starting in', data.countdown, 'seconds');
      this.showCountdown(data.countdown);
    });

    roomSocket.on('gameStarted', () => {
      this.scene.start('OfficeScene');
    });

    // Listen for host change
    roomSocket.on('hostChanged', (data) => {
      console.log('New host:', data.newHostName);
      GameState.room.hostId = data.newHostId;
      this.updateHostIndicator();
    });

    // Listen for player kicked
    roomSocket.on('kicked', (data) => {
      alert(`You were kicked: ${data.reason}`);
      this.scene.start('LobbyScene');
    });
  }

  toggleReady() {
    const isReady = !this.isReady;
    roomSocket.setReady(GameState.room.id, isReady);
    this.isReady = isReady;
  }

  startGame() {
    // Only host can start
    if (GameState.player.id === GameState.room.hostId) {
      roomSocket.startGame(GameState.room.id);
    }
  }

  leaveRoom() {
    roomSocket.leaveRoom(GameState.room.id);
    this.scene.start('LobbyScene');
  }
}

*/