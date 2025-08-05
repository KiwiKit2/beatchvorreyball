# Firebase Setup Guide for Beach Volleyball Multiplayer

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name your project (e.g., "beach-volleyball-game")
4. Disable Google Analytics (not needed for this project)
5. Click "Create project"

## Step 2: Set up Realtime Database

1. In your Firebase project, go to "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users

## Step 3: Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon to add a web app
4. Register your app with a name
5. Copy the Firebase configuration object

## Step 4: Update the Game

Replace the firebaseConfig in `js/multiplayerManager.js` with your configuration:

```javascript
this.firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

## Step 5: Deploy to GitHub Pages

1. Commit all changes to your repository
2. Push to GitHub
3. Enable GitHub Pages in repository settings
4. Your multiplayer game will be live!

## Security Rules (Optional)

For production, update your Realtime Database rules:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['players', 'gameState'])"
      }
    }
  }
}
```

## Features Included

- ✅ Room creation with 6-character codes
- ✅ Room joining by code
- ✅ Real-time player connection status
- ✅ Automatic cleanup when players leave
- ✅ Game state synchronization
- ✅ Heartbeat system for connection monitoring

Your game now supports online multiplayer! 🎮
