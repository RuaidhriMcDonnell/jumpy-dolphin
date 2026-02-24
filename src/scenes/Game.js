import Phaser from 'phaser';

export default class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        
        // Game constants
        this.PLAYER_X = 150; // Fixed X position for player
        this.JUMP_VELOCITY = -100; // Upward velocity when jumping
        this.SCROLL_SPEED = 200; // Background scroll speed
        this.MAX_VELOCITY = 600; // Maximum fall speed
        this.BUOYANCY_FORCE = 500; // Upward force when in water (overcomes world gravity)
        this.GRAVITY = 300; // Gravity when in air
        this.WATER_DRAG = 0.92; // Drag coefficient for water (0-1, lower = more drag)
        this.BACKGROUND_SCROLLING = false; // Set to false for static background
        this.HOOPS_ENABLED = false; // Set to false to disable hoops and scoring
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

        // Create scrolling background (sky and water)
        this.createScrollingBackground(width, height);

        // Create player
        this.createPlayer();

        // Create hoops
        this.createHoopTexture();
        this.createHoops(width, height);

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
                0.3
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
        this.waterSurface.lineStyle(4, 0x0099CC, 1);
        
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
        this.waterSurface.lineStyle(2, 0xFFFFFF, 0.5);
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
        this.player.setDisplaySize(96, 96);
        
        // Add physics to player
        this.physics.add.existing(this.player);
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setMaxVelocity(0, this.MAX_VELOCITY);
        this.player.body.setGravityY(0); // Start with no additional body gravity (world gravity is 300)
    }

    setupControls() {
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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

        this.restartText = this.add.text(width / 2, 220, 'Click to Restart', {
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
            this.player.setScale(1, 0.9);
            this.tweens.add({
                targets: this.player,
                scaleY: 1,
                duration: 200,
                ease: 'Bounce.easeOut'
            });
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
            
            // Setup restart
            this.input.once('pointerdown', () => {
                this.scene.restart();
            });
            
            this.spaceKey.once('down', () => {
                this.scene.restart();
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
    }

    update(time, delta) {
        if (this.gameOver) {
            return;
        }

        // Check if dolphin is in water or air
        this.isInWater = this.player.y > this.waterLineY;
        
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

        // Handle jump input (space only)
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.jump();
        }

        // Handle swimming in water with up/down arrows
        if (this.isInWater) {
            const swimSpeed = 150;
            if (this.cursors.up.isDown) {
                this.player.body.setVelocityY(-swimSpeed);
            } else if (this.cursors.down.isDown) {
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
