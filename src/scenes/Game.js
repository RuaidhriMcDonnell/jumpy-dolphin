import Phaser from 'phaser';

export default class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        
        // Game constants
        this.PLAYER_X = 150; // Fixed X position for player
        this.JUMP_VELOCITY = -250; // Upward velocity when jumping
        this.SCROLL_SPEED = 200; // Background scroll speed
        this.MAX_VELOCITY = 600; // Maximum fall speed
        this.BUOYANCY_FORCE = 500; // Upward force when in water (overcomes world gravity)
        this.GRAVITY = 100; // Gravity when in air
        this.WATER_DRAG = 0.99; // Drag coefficient for water (0-1, lower = more drag)
        this.SPLASH_MIN_SPEED = 220; // Minimum downward speed to trigger splash
        this.BACKGROUND_SCROLLING = true; // Set to false for static background
        this.HOOPS_ENABLED = true; // Set to false to disable hoops and scoring
        this.HOOP_SPAWN_INTERVAL = 1500; // Time between hoops in ms
        this.HOOP_SIZE = 72; // Visual diameter of hoop
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Game state
        this.gameOver = false;
        this.score = 0;
        this.waterLineY = height / 2; // Divide screen in half
        this.isInWater = false;
        this.wasInWater = false;

        // Create scrolling background (sky and water)
        this.createScrollingBackground(width, height);

        // Create player
        this.createPlayer();

        // Create splash effect
        this.createSplashTexture();
        this.createSplashEmitter();

        // Create hoops
        this.createHoopTexture();
        this.createHoops(width, height);

        // Create anglerfish
        this.createAnglerfish(width, height);

        // Create eels
        this.createEels(width, height);

        // Create seagull
        this.createSeagull(width, height);

        // Setup speedup timer (increase speed by 10% every 20 seconds)
        this.time.addEvent({
            delay: 10000,
            callback: () => {
                if (!this.gameOver && this.SCROLL_SPEED < 600) {
                    this.SCROLL_SPEED *= 1.1;
                }
            },
            loop: true
        });

        // Setup input controls
        this.setupControls();

        // Create UI
        this.createUI(width);

        // Display instructions
        this.showInstructions(width, height);
    }

    createScrollingBackground(width, height) {
        // Create sky (top half) using image
        this.sky = this.add.tileSprite(width / 2, this.waterLineY / 2, width, this.waterLineY, 'bg-sky');
        this.sky.setOrigin(0.5);

        // Create water (bottom half) using image
        this.water = this.add.tileSprite(width / 2, this.waterLineY + (height - this.waterLineY) / 2, width, height - this.waterLineY, 'bg-water');
        this.water.setOrigin(0.5);

        // Create water surface line with waves
        this.createWaterSurface(width);

        // Create scrolling clouds (in air)
        this.clouds = this.add.group();
        for (let i = 0; i < 5; i++) {
            const cloud = this.add.ellipse(
                Phaser.Math.Between(0, width + 200),
                Phaser.Math.Between(50, this.waterLineY - 50),
                Phaser.Math.Between(60, 120),
                Phaser.Math.Between(40, 70),
                0xFFFFFF,
                0.6
            );
            cloud.scrollSpeed = Phaser.Math.FloatBetween(0.3, 0.8);
            this.clouds.add(cloud);
        }

        // Create bubbles (in water)
        this.bubbles = this.add.group();
        for (let i = 0; i < 8; i++) {
            const bubble = this.add.circle(
                Phaser.Math.Between(0, width + 200),
                Phaser.Math.Between(this.waterLineY + 50, height - 100),
                Phaser.Math.Between(3, 8),
                0xFFFFFF,
                0.8
            );
            bubble.scrollSpeed = Phaser.Math.FloatBetween(0.4, 1.0);
            bubble.riseSpeed = Phaser.Math.FloatBetween(20, 50);
            this.bubbles.add(bubble);
        }
    }

    createWaterSurface(width) {
        // Create animated water surface
        this.waterSurface = this.add.graphics();
        this.waterSurfaceOffset = 0;
        
        // Draw initial water line
        this.updateWaterSurface(width);
    }

    updateWaterSurface(width) {
        this.waterSurface.clear();
        this.waterSurface.lineStyle(4, 0x0099CC, 0.3);
        
        // Draw wavy line
        this.waterSurface.beginPath();
        for (let x = 0; x <= width; x += 5) {
            const y = this.waterLineY + Math.sin((x + this.waterSurfaceOffset * 0.1) * 0.02) * 5;
            if (x === 0) {
                this.waterSurface.moveTo(x, y);
            } else {
                this.waterSurface.lineTo(x, y);
            }
        }
        this.waterSurface.strokePath();
        
        // Add foam effect
        this.waterSurface.lineStyle(2, 0x5a8097, 0.3);
        this.waterSurface.beginPath();
        for (let x = 0; x <= width; x += 5) {
            const y = this.waterLineY + Math.sin((x + (this.waterSurfaceOffset * 0.1) + 50) * 0.03) * 3;
            if (x === 0) {
                this.waterSurface.moveTo(x, y);
            } else {
                this.waterSurface.lineTo(x, y);
            }
        }
        this.waterSurface.strokePath();
    }

    createPlayer() {
        // Create dolphin sprite
        this.player = this.add.sprite(this.PLAYER_X, 300, 'dolphin');
        const ratio = 824 / 304; 
        const width = 150; 
        
        this.player.setDisplaySize(width, width / ratio);
        
        // Add physics to player
        this.physics.add.existing(this.player);
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setMaxVelocity(0, this.MAX_VELOCITY);
        this.player.body.setGravityY(0); // Start with no additional body gravity (world gravity is 300)
    }

    createSplashTexture() {
        if (this.textures.exists('splash')) {
            return;
        }

        const size = 16;
        const graphics = this.add.graphics();
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillCircle(size / 2, size / 2, size / 2);
        graphics.generateTexture('splash', size, size);
        graphics.destroy();
    }

    createSplashEmitter() {
        this.splashEmitter = this.add.particles(0, 0, 'splash', {
            lifespan: 500,
            speed: { min: 80, max: 200 },
            angle: { min: 200, max: 340 },
            scale: { start: 0.8, end: 0 },
            gravityY: 200,
            quantity: 0,
            emitting: false
        });
    }

    playSplash() {
        if (!this.splashEmitter) {
            return;
        }

        if (this.player.body.velocity.y < this.SPLASH_MIN_SPEED) {
            return;
        }

        const intensity = Phaser.Math.Clamp(this.player.body.velocity.y / 300, 0.6, 1.5);
        this.splashEmitter.setConfig({
            speed: { min: 80 * intensity, max: 200 * intensity }
        });
        this.splashEmitter.emitParticleAt(this.player.x, this.waterLineY, Math.round(10 * intensity));
    }

    setupControls() {
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Gamepad (Xbox controller) support - enable gamepad input
        if (this.input.gamepad) {
            this.input.gamepad.enabled = true;
            this.input.gamepad.on('down', this.onGamepadButtonDown, this);
            
            // Debug: Check gamepad detection on startup
            window.addEventListener('gamepadconnected', (e) => {
                console.log('Gamepad connected:', e.gamepad.id);
                console.log('Has hapticActuators?', !!e.gamepad.hapticActuators);
                if (e.gamepad.hapticActuators) {
                    console.log('Haptic actuators:', e.gamepad.hapticActuators.length);
                }
            });
        }
    }
    
    onGamepadButtonDown(pad, button, value) {
        // A button (button 0) for jumping
        if (button === 0) {
            this.jump();
        }
    }

    vibrateGamepad(intensity = 1.0, duration = 100) {
        // Try multiple methods to vibrate the gamepad
        if (!navigator.getGamepads) {
            console.log('Gamepad API not supported in this browser');
            return;
        }

        const gamepads = navigator.getGamepads();
        if (!gamepads || gamepads.length === 0) {
            return;
        }

        const gamepad = gamepads[0];
        if (!gamepad) {
            return;
        }

        // Method 1: Try Gamepad Haptics API (modern approach)
        if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
            try {
                // Use dual-motor vibration pattern
                gamepad.hapticActuators[0].pulse(intensity, duration);
                console.log('Vibrating via Haptics API: intensity=' + intensity + ', duration=' + duration);
                return;
            } catch (e) {
                console.warn('Haptics API vibrate failed:', e);
            }
        }

        // Method 2: Fallback to Phaser's vibrate method
        if (this.input.gamepad && this.input.gamepad.gamepads) {
            const pad = this.input.gamepad.gamepads[0];
            if (pad && pad.vibrate) {
                try {
                    pad.vibrate(intensity, intensity, duration);
                    console.log('Vibrating via Phaser: intensity=' + intensity + ', duration=' + duration);
                    return;
                } catch (e) {
                    console.warn('Phaser vibrate failed:', e);
                }
            }
        }

        console.log('Gamepad vibration not supported on this device/browser');
    }

    createUI(width) {
        // Score display
        this.scoreText = this.add.text(width - 20, 20, 'Rings: 0', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.scoreText.setOrigin(1, 0);

        // Game over text (hidden initially)
        this.gameOverText = this.add.text(width / 2, 150, 'Game Over!', {
            font: '64px Arial',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        });
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.setVisible(false);

        this.restartText = this.add.text(width / 2, 220, 'SPACE or A Button to Restart', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.restartText.setOrigin(0.5);
        this.restartText.setVisible(false);
    }

    showInstructions(width, height) {
        this.instructionText = this.add.text(width / 2, height / 2, 
            '🐬 Dolphin Game!\nSPACE to Jump! UP/DOWN arrows to Swim!\nJump or swim through rings!\nDive in and out of the water!', 
            {
                font: '18px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }
        );
        this.instructionText.setOrigin(0.5);
        
        // Hide instructions after 3 seconds
        this.time.delayedCall(3000, () => {
            if (this.instructionText) {
                this.instructionText.destroy();
            }
        });
    }

    jump() {
        // Only allow jumping when in water (dolphins can't fly!)
        if (!this.gameOver && this.isInWater) {
            this.player.body.setVelocityY(this.JUMP_VELOCITY);
            
            // Tilt player up slightly for visual feedback
            this.tweens.killTweensOf(this.player);
            //this.player.setScale(1, 0.9);
            // this.tweens.add({
            //     targets: this.player,
            //     scaleY: 1,
            //     duration: 200,
            //     ease: 'Bounce.easeOut'
            // });
        }
    }

    handleGameOver() {
        if (!this.gameOver) {
            this.gameOver = true;
            
            // Stop player movement
            this.player.body.setVelocity(0, 0);
            
            // Show game over UI
            this.gameOverText.setVisible(true);
            this.restartText.setVisible(true);
            
            // Flash player red
            this.tweens.add({
                targets: this.player,
                alpha: 0.3,
                duration: 100,
                yoyo: true,
                repeat: 3
            });
        }
    }

    createHoopTexture() {
        if (this.textures.exists('hoop')) {
            return;
        }

        const size = this.HOOP_SIZE;
        const thickness = 6;
        const graphics = this.add.graphics();

        graphics.lineStyle(thickness, 0xffd75e, 1);
        graphics.strokeCircle(size / 2, size / 2, (size - thickness) / 2);
        graphics.generateTexture('hoop', size, size);
        graphics.destroy();
    }

    createHoops(width, height) {
        this.hoops = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        this.physics.add.overlap(this.player, this.hoops, this.handleHoopPass, null, this);

        this.hoopTimer = this.time.addEvent({
            delay: this.HOOP_SPAWN_INTERVAL,
            callback: () => this.spawnHoop(width, height),
            loop: true
        });
    }

    createAnglerfish(width, height) {
        this.anglerfish = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        
        // Create initial anglerfish in the water
        for (let i = 0; i < 1; i++) {
            const spawnX = Phaser.Math.Between(width * 0.2, width * 1.5);
            const spawnY = Phaser.Math.Between(this.waterLineY + 60, height - 100);
            const angler = this.anglerfish.create(spawnX, spawnY, 'angler');
            angler.setDisplaySize(80, 80);
            angler.body.setCircle(40);
            angler.scrollSpeed = Phaser.Math.FloatBetween(0.3, 0.7);
            angler.swimDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
            angler.swimOffset = 0;
        }

        // Add collision detection with player
        this.physics.add.overlap(this.player, this.anglerfish, this.handleAnglerCollision, null, this);
    }

    spawnHoop(width, height) {
        if(!this.HOOPS_ENABLED) {
            return;
        }
        if (this.gameOver) {
            return;
        }

        const spawnX = width + this.HOOP_SIZE;
        const spawnInAir = Phaser.Math.Between(0, 1) === 1;
        const airMin = Math.max(40, this.waterLineY - 120);
        const airMax = Math.max(airMin + 20, this.waterLineY - 40);
        const waterMin = this.waterLineY + 40;
        const waterMax = Math.min(height - 80, this.waterLineY + 180);
        const spawnY = spawnInAir
            ? Phaser.Math.Between(airMin, airMax)
            : Phaser.Math.Between(waterMin, waterMax);

        const hoop = this.hoops.create(spawnX, spawnY, 'hoop');
        hoop.setDisplaySize(this.HOOP_SIZE, this.HOOP_SIZE);
        hoop.body.setCircle(this.HOOP_SIZE / 2);
        hoop.body.setOffset(0, 0);
        hoop.scored = false;
    }

    handleHoopPass(player, hoop) {
        if (hoop.scored || this.gameOver) {
            return;
        }

        hoop.scored = true;
        hoop.disableBody(true, true);

        this.score += 1;
        this.scoreText.setText('Rings: ' + this.score);
        
        // Display +1 score indicator
        const scoreText = this.add.text(hoop.x, hoop.y - 40, '+1', {
            font: '32px Arial',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        scoreText.setOrigin(0.5);
        
        // Animate the score text: float up and fade out
        this.tweens.add({
            targets: scoreText,
            y: scoreText.y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                scoreText.destroy();
            }
        });
    }

    handleAnglerCollision(player, angler) {
        if (this.gameOver) {
            return;
        }
        
        // Strong vibration on anglerfish collision
        this.vibrateGamepad(1.0, 300);
        
        this.handleGameOver();
    }

    createSeagull(width, height) {
        // Create a single seagull flying in the sky
        this.seagull = this.add.sprite(
            width / 2,
            this.waterLineY / 2,
            'seagull'
        );
        this.seagull.setDisplaySize(80, 60);
        this.seagull.setOrigin(0.5);
        
        // Seagull flight properties
        this.seagull.flyOffset = 0;
        this.seagull.flySpeed = 1; // Speed of wave motion
        this.seagull.flyAmplitude = 40; // Vertical wave amplitude
        this.seagull.baseY = this.waterLineY / 2;
        this.seagull.scrollSpeed = 0.2; // Parallax speed
    }

    createEels(width, height) {
        this.eels = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        
        // Create initial eels in the water
        for (let i = 0; i < 1; i++) {
            const spawnX = Phaser.Math.Between(width * 0.2, width * 1.5);
            const spawnY = Phaser.Math.Between(this.waterLineY + 60, height - 100);
            const eel = this.eels.create(spawnX, spawnY, 'eel');
            eel.setDisplaySize(80, 80);
            eel.body.setCircle(40);
            eel.scrollSpeed = Phaser.Math.FloatBetween(0.3, 0.7);
            eel.swimDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
            eel.swimOffset = 0;
        }

        // Add collision detection with player
        this.physics.add.overlap(this.player, this.eels, this.handleEelCollision, null, this);
    }

    handleEelCollision(player, eel) {
        if (this.gameOver) {
            return;
        }
        
        const currentTime = this.time.now;
        const cooldown = 2000; // 2 second cooldown between damage from same eel
        
        // Only damage once per cooldown period
        if (!eel.lastCollisionTime || (currentTime - eel.lastCollisionTime) > cooldown) {
            eel.lastCollisionTime = currentTime;
            
            // Strong vibration on eel collision
            this.vibrateGamepad(1.0, 300);
            
            // Decrease score by 1
            this.score -= 1;
            this.score = Math.max(0, this.score);
            this.scoreText.setText('Rings: ' + this.score);
            
            // Display -1 damage indicator
            const damageText = this.add.text(eel.x, eel.y - 40, '-1', {
                font: '32px Arial',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 3
            });
            damageText.setOrigin(0.5);
            
            // Animate the damage text: float up and fade out
            this.tweens.add({
                targets: damageText,
                y: damageText.y - 60,
                alpha: 0,
                duration: 1000,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    damageText.destroy();
                }
            });
        }
    }

    update(time, delta) {
        // Handle restart input while game is over
        if (this.gameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.scene.restart();
            }
            
            // Check gamepad A button for restart
            if (this.input.gamepad && this.input.gamepad.gamepads && this.input.gamepad.gamepads.length > 0) {
                const pad = this.input.gamepad.gamepads[0];
                if (pad && pad.A) {
                    this.scene.restart();
                }
            }
            
            return;
        }

        // Check if dolphin is in water or air
        this.wasInWater = this.isInWater;
        this.isInWater = this.player.y > this.waterLineY;

        if (!this.wasInWater && this.isInWater) {
            this.playSplash();
            // Small vibration when landing in water
            this.vibrateGamepad(0.3, 100);
        }
        
        // Apply different physics based on environment
        if (this.isInWater) {
            // In water: buoyancy (strong upward force to overcome world gravity + float up)
            // World gravity is 300, so -500 gives net -200 upward force
            this.player.body.setGravityY(-this.BUOYANCY_FORCE);
            
            // Apply water drag/friction to Y velocity (simulates viscosity)
            this.player.body.setVelocityY(this.player.body.velocity.y * this.WATER_DRAG);
        } else {
            // In air: use world gravity only (300)
            this.player.body.setGravityY(0);
        }

        // Handle jump input (space or A button)
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.jump();
        }

        // Handle swimming in water with up/down arrows or D-Pad/analog stick
        if (this.isInWater) {
            const swimSpeed = 150;
            let upPressed = this.cursors.up.isDown;
            let downPressed = this.cursors.down.isDown;
            
            // Check gamepad input (Xbox controller)
            if (this.input.gamepad && this.input.gamepad.gamepads) {
                const gamepads = this.input.gamepad.gamepads;
                if (gamepads && gamepads.length > 0) {
                    const pad = gamepads[0]; // First controller
                    if (pad) {
                        // D-Pad Up/Down
                        upPressed = upPressed || pad.up;
                        downPressed = downPressed || pad.down;
                        
                        // Left analog stick (Y-axis: negative = up, positive = down)
                        if (pad.axes.length >= 2) {
                            const leftStickY = pad.axes[1].getValue();
                            if (leftStickY < -0.5) {
                                upPressed = true;
                            } else if (leftStickY > 0.5) {
                                downPressed = true;
                            }
                        }

                        if (pad.A) {
                           this.jump();
                    }
                    }
                }
            }
            
            if (upPressed) {
                this.player.body.setVelocityY(-swimSpeed);
            } else if (downPressed) {
                this.player.body.setVelocityY(swimSpeed);
            }
        }

        // Animate water surface
        this.waterSurfaceOffset += this.SCROLL_SPEED * (delta / 1000) * 20;
        this.updateWaterSurface(this.cameras.main.width);

        // Scroll the background images (if enabled)
        if (this.BACKGROUND_SCROLLING) {
            const scrollAmount = this.SCROLL_SPEED * (delta / 1000);
            this.sky.tilePositionX += scrollAmount;
            this.water.tilePositionX += scrollAmount;
        }

        // Scroll the clouds (in air)
        this.clouds.children.entries.forEach(cloud => {
            cloud.x -= this.SCROLL_SPEED * cloud.scrollSpeed * (delta / 1000);
            
            // Reset cloud position when it goes off screen
            if (cloud.x < -100) {
                cloud.x = this.cameras.main.width + 100;
                cloud.y = Phaser.Math.Between(50, this.waterLineY - 50);
            }
        });

        // Scroll and animate bubbles (in water)
        this.bubbles.children.entries.forEach(bubble => {
            bubble.x -= this.SCROLL_SPEED * bubble.scrollSpeed * (delta / 1000);
            bubble.y -= bubble.riseSpeed * (delta / 1000);
            
            // Reset bubble position when it goes off screen or reaches surface
            if (bubble.x < -50 || bubble.y < this.waterLineY) {
                bubble.x = this.cameras.main.width + 50;
                bubble.y = Phaser.Math.Between(this.waterLineY + 50, this.cameras.main.height - 100);
            }
        });

        // Scroll and animate anglerfish (in water)
        this.anglerfish.children.entries.forEach(angler => {
            angler.x -= this.SCROLL_SPEED * angler.scrollSpeed * (delta / 1000);
            
            // Add swimming motion (up and down)
            angler.swimOffset += delta / 1000;
            angler.y += Math.sin(angler.swimOffset * 2) * 30 * (delta / 1000);
            
            // Flip sprite based on swim direction
            angler.flipX = angler.swimDirection < 0;
            
            // Reset anglerfish position when it goes off screen
            if (angler.x < -100) {
                angler.x = this.cameras.main.width + 100;
                angler.y = Phaser.Math.Between(this.waterLineY + 60, this.cameras.main.height - 100);
                angler.swimDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
                angler.swimOffset = 0;
            }
        });

        // Scroll and animate eels (in water)
        this.eels.children.entries.forEach(eel => {
            eel.x -= this.SCROLL_SPEED * eel.scrollSpeed * (delta / 1000);
            
            // Add swimming motion (up and down)
            eel.swimOffset += delta / 1000;
            eel.y += Math.sin(eel.swimOffset * 2) * 30 * (delta / 1000);
            
            // Flip sprite based on swim direction
            eel.flipX = eel.swimDirection < 0;
            
            // Reset eel position when it goes off screen
            if (eel.x < -100) {
                eel.x = this.cameras.main.width + 100;
                eel.y = Phaser.Math.Between(this.waterLineY + 60, this.cameras.main.height - 100);
                eel.swimDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
                eel.swimOffset = 0;
            }
        });

        // Animate seagull flying in the sky
        this.seagull.flyOffset += this.seagull.flySpeed * (delta / 1000);
        this.seagull.y = this.seagull.baseY + Math.sin(this.seagull.flyOffset * 2) * this.seagull.flyAmplitude;
        
        // Scroll seagull with parallax effect
        this.seagull.x -= this.SCROLL_SPEED * this.seagull.scrollSpeed * (delta / 1000);
        
        // Reset seagull position when it goes off screen
        if (this.seagull.x < -100) {
            this.seagull.x = this.cameras.main.width + 100;
            this.seagull.baseY = Phaser.Math.Between(50, this.waterLineY - 50);
            this.seagull.flyOffset = 0;
        }

        // Scroll hoops and clean up off-screen hoops
        this.hoops.children.entries.forEach(hoop => {
            hoop.x -= this.SCROLL_SPEED * (delta / 1000);

            if (hoop.x < -this.HOOP_SIZE) {
                hoop.disableBody(true, true);
            }
        });

        // Rotate player based on velocity for visual feedback
        const rotation = Phaser.Math.Clamp(this.player.body.velocity.y / 500, -0.5, 0.5);
        this.player.rotation = rotation;

        // Player is clamped by world bounds; no game over on walls.
    }
}
