# Beach Volleyball Game 🏐

A polished Limbus Company themed beach volleyball game with smooth physics, AI opponents, and refined gameplay mechanics.

## ✨ Features

- **Character Selection**: Choose from Don Quixote, Ryoshu, or Ideal from the main menu
- **Realistic Physics**: Smooth volleyball movement with tuned gravity, bounce, and air resistance
- **Smart AI Opponent**: NPC with ball tracking, strategic positioning, and realistic reactions
- **Complete Sound System**: Character voices, hit effects, and rally end sounds
- **Polished Visuals**: Larger sprites (220x220 characters, 65x65 ball) with clean appearance
- **Rally System**: Pass counting with satisfying "awh" sound when rallies end
- **Responsive Controls**: Precise hit detection and smooth character movement

## 🎮 Controls

- **Movement**: Arrow keys or WASD to move left/right
- **Hit Ball**: SPACEBAR when close to the volleyball (180px range)
- **Reset Game**: R key
- **Mute/Unmute**: M key

## 🎯 How to Play

1. **Select your character** from the main menu (Don Quixote, Ryoshu, or Ideal)
2. **Move close to the volleyball** using arrow keys or WASD
3. **Press SPACEBAR** when near the ball to hit it across the court
4. **Keep the rally going** with the AI opponent
5. **Build long rallies** - you'll hear a satisfying "awh" sound when they end (2+ passes)

## 🚀 Quick Start

1. Open `index.html` in your web browser
2. Or serve locally: `python -m http.server 8000` and visit `http://localhost:8000`
3. Select your character and start playing!

## 🔧 Technical Highlights

### Gameplay Polish
- **Hit Detection**: Center-to-center distance calculation (180px player, 200px NPC)
- **Ball Physics**: Tuned gravity (800), bounce (0.35), friction (0.92), air resistance (0.999)
- **Visual Clean-up**: Removed distracting trail effects and screen shake
- **Size Optimization**: Larger characters and ball for better visibility

### AI Behavior
- **State Machine**: Tracking → Positioning → Ready → Waiting states
- **Ball Prediction**: Calculates future ball position for strategic positioning
- **Dynamic Speed**: Adjusts movement speed based on ball proximity and urgency

## Technical Details

Built with vanilla JavaScript and HTML5 Canvas:

- **GameEngine**: Core game loop, rendering, and input handling
- **Character**: Player and NPC character logic with animations
- **Volleyball**: Physics-based ball with collision detection
- **SoundManager**: Audio system for effects and voices
- **Modular Design**: Easy to extend with new characters or features

## Files Structure

```
BeachVolleyball/
├── index.html              # Main game page
├── js/
│   ├── gameEngine.js       # Core game engine
│   ├── character.js        # Character logic
│   ├── volleyball.js       # Ball physics
│   ├── soundManager.js     # Audio system
│   └── game.js            # Main game logic
├── images/
│   ├── BeachBG.png        # Background image
│   ├── donQ.png           # Character sprite
│   └── volleyball.png     # Volleyball sprite
└── sounds/
    ├── hit.mp3            # Hit sound effect
    └── donQsays.mp3       # Character voice
```

## Running the Game

1. Clone this repository
2. Open `index.html` in a web browser
3. Or serve it through a local web server for best performance

## Future Enhancements

- Multiplayer support
- Additional Limbus Company characters
- Power-ups and special moves
- Tournament mode
- Better graphics and animations
- Mobile touch controls

---

Enjoy your beach volleyball game! 🏖️🏐
