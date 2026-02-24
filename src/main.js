import Phaser from 'phaser';
import Boot from './scenes/Boot.js';
import Game from './scenes/Game.js';
import Preloader from './scenes/Preloader.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#282c34',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        gamepad: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [Boot, Preloader, Game]
};

const game = new Phaser.Game(config);
