// Multiplayer Manager using Firebase
class MultiplayerManager {
    constructor() {
        this.isHost = false;
        this.roomCode = null;
        this.playerId = null;
        this.opponent = null;
        this.gameRef = null;
        this.isConnected = false;
        this.lastSyncTime = 0;
        this.syncInterval = 50; // Sync every 50ms for smooth gameplay
        
        // Firebase config - YOUR ACTUAL CONFIG
        this.firebaseConfig = {
            apiKey: "AIzaSyBQs6rr8KLY1xGj5_Adz2ZNx35W-Q8xI7U",
            authDomain: "beach-volleyball-game-11a3a.firebaseapp.com",
            databaseURL: "https://beach-volleyball-game-11a3a-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "beach-volleyball-game-11a3a",
            storageBucket: "beach-volleyball-game-11a3a.firebasestorage.app",
            messagingSenderId: "393988693165",
            appId: "1:393988693165:web:135adf826e177162c7fa24"
        };
        
        this.callbacks = {
            onRoomJoined: null,
            onOpponentJoined: null,
            onOpponentLeft: null,
            onGameStateUpdate: null,
            onError: null
        };
    }
    
    async initialize() {
        try {
            // Initialize Firebase
            if (!window.firebase) {
                throw new Error('Firebase SDK not loaded');
            }
            
            firebase.initializeApp(this.firebaseConfig);
            this.database = firebase.database();
            
            // Generate unique player ID
            this.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
            
            console.log('Multiplayer Manager initialized with ID:', this.playerId);
            return true;
        } catch (error) {
            console.error('Failed to initialize multiplayer:', error);
            if (this.callbacks.onError) this.callbacks.onError(error.message);
            return false;
        }
    }
    
    async createRoom() {
        try {
            // Generate room code
            this.roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
            this.isHost = true;
            
            // Create room in database
            this.gameRef = this.database.ref('games/' + this.roomCode);
            
            const roomData = {
                host: this.playerId,
                players: {
                    [this.playerId]: {
                        name: 'Host Player',
                        character: 'donQ',
                        ready: false,
                        connected: true,
                        lastSeen: firebase.database.ServerValue.TIMESTAMP
                    }
                },
                gameState: {
                    status: 'waiting', // waiting, playing, ended
                    ball: {
                        x: 400,
                        y: 300,
                        velocityX: 0,
                        velocityY: 0,
                        isMoving: false
                    },
                    score: {
                        player1: 0,
                        player2: 0
                    }
                },
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await this.gameRef.set(roomData);
            
            // Listen for opponent joining
            this.gameRef.child('players').on('child_added', (snapshot) => {
                const playerId = snapshot.key;
                const playerData = snapshot.val();
                
                if (playerId !== this.playerId && !this.opponent) {
                    this.opponent = { id: playerId, ...playerData };
                    console.log('Opponent joined:', this.opponent);
                    if (this.callbacks.onOpponentJoined) {
                        this.callbacks.onOpponentJoined(this.opponent);
                    }
                }
            });
            
            // Listen for opponent leaving
            this.gameRef.child('players').on('child_removed', (snapshot) => {
                const playerId = snapshot.key;
                if (playerId === this.opponent?.id) {
                    this.opponent = null;
                    console.log('Opponent left the game');
                    if (this.callbacks.onOpponentLeft) {
                        this.callbacks.onOpponentLeft();
                    }
                }
            });
            
            this.setupGameStateListener();
            this.startHeartbeat();
            
            console.log('Room created with code:', this.roomCode);
            if (this.callbacks.onRoomJoined) {
                this.callbacks.onRoomJoined(this.roomCode, true);
            }
            
            return this.roomCode;
        } catch (error) {
            console.error('Failed to create room:', error);
            if (this.callbacks.onError) this.callbacks.onError('Failed to create room');
            return null;
        }
    }
    
    async joinRoom(roomCode) {
        try {
            this.roomCode = roomCode.toUpperCase();
            this.isHost = false;
            
            this.gameRef = this.database.ref('games/' + this.roomCode);
            
            // Check if room exists
            const roomSnapshot = await this.gameRef.once('value');
            if (!roomSnapshot.exists()) {
                throw new Error('Room not found');
            }
            
            const roomData = roomSnapshot.val();
            const playerCount = Object.keys(roomData.players || {}).length;
            
            if (playerCount >= 2) {
                throw new Error('Room is full');
            }
            
            // Add ourselves to the room
            await this.gameRef.child('players/' + this.playerId).set({
                name: 'Guest Player',
                character: 'donQ',
                ready: false,
                connected: true,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
            
            // Find the host
            for (const [playerId, playerData] of Object.entries(roomData.players)) {
                if (playerId !== this.playerId) {
                    this.opponent = { id: playerId, ...playerData };
                    break;
                }
            }
            
            this.setupGameStateListener();
            this.startHeartbeat();
            
            console.log('Joined room:', this.roomCode);
            if (this.callbacks.onRoomJoined) {
                this.callbacks.onRoomJoined(this.roomCode, false);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to join room:', error);
            if (this.callbacks.onError) this.callbacks.onError(error.message);
            return false;
        }
    }
    
    setupGameStateListener() {
        if (!this.gameRef) return;
        
        // Listen for game state changes
        this.gameRef.child('gameState').on('value', (snapshot) => {
            const gameState = snapshot.val();
            if (gameState && this.callbacks.onGameStateUpdate) {
                this.callbacks.onGameStateUpdate(gameState);
            }
        });
    }
    
    async updateGameState(updates) {
        if (!this.gameRef || !this.isConnected) return;
        
        try {
            // Throttle updates to prevent spam
            const now = Date.now();
            if (now - this.lastSyncTime < this.syncInterval) return;
            this.lastSyncTime = now;
            
            await this.gameRef.child('gameState').update(updates);
        } catch (error) {
            console.error('Failed to update game state:', error);
        }
    }
    
    async updatePlayerState(updates) {
        if (!this.gameRef || !this.playerId) return;
        
        try {
            await this.gameRef.child('players/' + this.playerId).update({
                ...updates,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Failed to update player state:', error);
        }
    }
    
    startHeartbeat() {
        // Send heartbeat every 5 seconds to show we're still connected
        this.heartbeatInterval = setInterval(async () => {
            if (this.gameRef && this.playerId) {
                try {
                    await this.gameRef.child('players/' + this.playerId + '/lastSeen').set(
                        firebase.database.ServerValue.TIMESTAMP
                    );
                    this.isConnected = true;
                } catch (error) {
                    console.error('Heartbeat failed:', error);
                    this.isConnected = false;
                }
            }
        }, 5000);
    }
    
    async leaveRoom() {
        try {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
            
            if (this.gameRef && this.playerId) {
                // Remove ourselves from the room
                await this.gameRef.child('players/' + this.playerId).remove();
                
                // If we're the host and room is empty, clean up the room
                if (this.isHost) {
                    const playersSnapshot = await this.gameRef.child('players').once('value');
                    if (!playersSnapshot.exists() || Object.keys(playersSnapshot.val()).length === 0) {
                        await this.gameRef.remove();
                    }
                }
                
                // Remove listeners
                this.gameRef.off();
            }
            
            this.reset();
            console.log('Left room successfully');
        } catch (error) {
            console.error('Failed to leave room:', error);
        }
    }
    
    reset() {
        this.isHost = false;
        this.roomCode = null;
        this.opponent = null;
        this.gameRef = null;
        this.isConnected = false;
    }
    
    // Callback setters
    onRoomJoined(callback) { this.callbacks.onRoomJoined = callback; }
    onOpponentJoined(callback) { this.callbacks.onOpponentJoined = callback; }
    onOpponentLeft(callback) { this.callbacks.onOpponentLeft = callback; }
    onGameStateUpdate(callback) { this.callbacks.onGameStateUpdate = callback; }
    onError(callback) { this.callbacks.onError = callback; }
}

// Global multiplayer manager instance
window.multiplayerManager = new MultiplayerManager();
