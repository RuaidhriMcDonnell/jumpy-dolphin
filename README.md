# Emma Game - Dolphin Adventure 🐬

A side-scrolling dolphin game with air/water physics built with Phaser 3 and Vite.

## Game Description

An infinite side-scrolling game where you control a dolphin that can leap out of the water and dive back in! The screen is divided into two zones: **air** (top half) and **water** (bottom half), each with different physics.

### Unique Physics System

- 🌊 **In Water**: Buoyancy pushes you upward - no gravity!
- 🌤️ **In Air**: Normal gravity pulls you down
- The water line is at the middle of the screen, creating dynamic gameplay as you transition between zones

### Controls

- **SPACE** or **UP ARROW** - Jump/Leap upward
- **MOUSE CLICK** or **TAP** - Jump/Leap upward
- Experience different physics above and below the water!

### Game Features

- 🐬 Play as a dolphin with smooth animations
- 🌊 Dynamic water surface with animated waves
- 🫧 Underwater bubbles and surface effects
- ☁️ Scrolling clouds in the sky
- ⚡ Dual physics system (gravity in air, buoyancy in water)
- 📊 Score tracking based on survival time
- 💀 Game over when hitting boundaries (ceiling or ocean floor)
- 🔄 Quick restart functionality

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`

### Build

Create a production build:

```bash
npm run build
```

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
emmaGame/
├── src/
│   ├── scenes/
│   │   ├── Boot.js       # Initial boot scene
│   │   ├── Preloader.js  # Asset loading scene
│   │   └── Game.js       # Main game scene
│   └── main.js           # Game configuration and initialization
├── assets/               # Game assets (images, audio, etc.)
├── index.html            # Main HTML file
├── vite.config.js        # Vite configuration
└── package.json          # Project dependencies
```

## Adding Assets

Place your game assets (images, audio, sprites, etc.) in the `assets/` folder and load them in the Preloader scene.

## Next Steps

- Add your game assets to the `assets/` folder
- Load assets in `src/scenes/Preloader.js`
- Implement your game logic in `src/scenes/Game.js`
- Create additional scenes as needed

## Resources

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 3 Examples](https://phaser.io/examples)
- [Vite Documentation](https://vitejs.dev/)
