# Beach Volleyball Game 🏐

A fun beach volleyball game featuring Don Quixote characters from Limbus Company!

## Features

- **Volleyball Gameplay**: Realistic volleyball physics with arcing ball trajectories
- **Don Quixote Characters**: Play as Don Quixote characters with custom sprites
- **Sound Effects**: Immersive audio with hit sounds and character voices
- **AI Opponent**: Smart NPC that tracks the ball and maintains rallies
- **Beautiful Visuals**: Gradient beach background with clean volleyball court design
- **Responsive Controls**: Smooth character movement and jumping mechanics

## How to Play

- **Movement**: Use A/D or Arrow Keys (←/→) to move left and right
- **Jump/Hit**: Press SPACE to jump and hit the volleyball
- **Goal**: Keep the volleyball rally going as long as possible!

## Controls

- `A` or `←` - Move left
- `D` or `→` - Move right  
- `SPACE` - Jump and hit volleyball
- `R` - Reset game
- `M` - Mute/unmute sounds

## Game Mechanics

- The volleyball follows realistic physics with gravity and momentum
- Characters can hit the ball when it's close enough
- The NPC opponent will track and hit the ball back to keep rallies going
- Each successful hit plays both a hit sound effect and character voice
- The game tracks the number of consecutive passes in the rally

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
