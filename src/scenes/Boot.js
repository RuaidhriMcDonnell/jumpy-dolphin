import Phaser from 'phaser';

export default class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Load any assets needed for the preloader scene (like loading bar graphics)
    }

    create() {
        // Set up any game-wide configurations here
        console.log('Boot scene started');
        
        // Move to the Preloader scene
        this.scene.start('Preloader');
    }
}
