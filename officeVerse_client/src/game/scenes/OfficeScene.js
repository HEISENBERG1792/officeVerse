import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';
import { connectMovement, sendMovement } from '../../network/movementSocket.js';
import { initChat } from '../../network/ChatModule.js';
import ZoneManager from '../map/ZoneManager.js';
import MiniMap from '../ui/MiniMap.js';

export default class OfficeScene extends Phaser.Scene {
    constructor() {
        super('OfficeScene');
        this.otherPlayers = {};
        this.nearbyPlayer = null;
        this.interactionPrompt = null;
        this.INTERACTION_DISTANCE = 100;

        // Zone tracking
        this.currentZone = null;
        this.zonePrompt = null;

        // Character configurations
        this.characterConfigs = {
            owlet: {
                walk: 'Owlet_Monster_Walk',
                idle: 'Owlet_Monster_Idle'
            },
            dude: {
                walk: 'Dude_Monster_Walk',
                idle: 'Dude_Monster_Idle'
            },
            pink: {
                walk: 'Pink_Monster_Walk',
                idle: 'Pink_Monster_Idle'
            }
        };
    }

    init(data) {
        this.myPlayerName = data?.name || 'Player';
        this.myPlayerId = data?.id || Math.floor(Math.random() * 100000);
        this.myPlayerSkin = data?.skin || 0xffffff;
        this.myPlayerCharacter = data?.character || 'owlet';
        this.roomId = data?.roomId;
        this.roomName = data?.roomName;
        this.roomCode = data?.roomCode;

        console.log('Player initialized:', {
            name: this.myPlayerName,
            id: this.myPlayerId,
            skin: this.myPlayerSkin,
            character: this.myPlayerCharacter
        });
    }

    preload() {
        this.load.tilemapTiledJSON('office_map', 'assets/maps/office_map.json');
        this.load.image('office_tileset', 'assets/tilesets/office_tileset.png');
        this.load.image('office_tileset2', 'assets/tilesets/office_tileset2.png');

        // Load all character spritesheets
        // Owlet
        this.load.spritesheet('Owlet_Monster_Walk', 'assets/sprites/Owlet_Monster_Walk_6.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('Owlet_Monster_Idle', 'assets/sprites/Owlet_Monster_Idle_4.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Dude Monster
        this.load.spritesheet('Dude_Monster_Walk', 'assets/sprites/Dude_Monster_Walk_6.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('Dude_Monster_Idle', 'assets/sprites/Dude_Monster_Idle_4.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Pink Monster
        this.load.spritesheet('Pink_Monster_Walk', 'assets/sprites/Pink_Monster_Walk_6.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('Pink_Monster_Idle', 'assets/sprites/Pink_Monster_Idle_4.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    create() {
        /* ---------------- ROOM INFO ---------------- */
        const roomInfo = document.getElementById('room-info-ui');
        if (roomInfo) {
            roomInfo.style.display = 'block';
            document.getElementById('room-display-name').textContent = `Office: ${this.roomName}`;
            document.getElementById('room-display-code').textContent = `Code: ${this.roomCode}`;
        }

        /* ---------------- CHAT ---------------- */
        initChat(this.myPlayerId, this.myPlayerName, this.roomId, this.roomCode);

        /* ---------------- MAP ---------------- */
        const map = this.make.tilemap({ key: 'office_map' });
        const tileset1 = map.addTilesetImage('office_tileset', 'office_tileset');
        const tileset2 = map.addTilesetImage('office_tileset2', 'office_tileset2');

        const floor = map.createLayer('floor', [tileset1, tileset2], 0, 0);
        const wall = map.createLayer('wall', [tileset1, tileset2], 0, 0);
        const furniture = map.createLayer('furniture', [tileset1, tileset2], 0, 0);
        const collision = map.createLayer('collision', [tileset1, tileset2], 0, 0);

        collision.setCollisionByProperty({ collides: true });
        collision.setVisible(false);

        /* ---------------- PLAYER ---------------- */
        const idleSprite = this.characterConfigs[this.myPlayerCharacter].idle;
        this.player = this.physics.add.sprite(64, 64, idleSprite, 0);
        this.player.setScale(1.25);
        this.player.setTint(this.myPlayerSkin);
        this.player.characterType = this.myPlayerCharacter;

        this.player.body.setAllowGravity(false);
        this.player.body.setCollideWorldBounds(false);
        this.player.body.setSize(20, 20);
        this.player.body.setOffset(6, 10);

        this.physics.add.collider(this.player, collision);

        /* ---------------- CAMERA ---------------- */
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        /* ---------------- NAME TAG ---------------- */
        this.playerNameText = this.add.text(this.player.x, this.player.y - 40, this.myPlayerName, {
            font: '14px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        /* ---------------- INPUT ---------------- */
        this.cursors = this.input.keyboard.createCursorKeys();
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        /* ---------------- ANIMATIONS ---------------- */
        this.createAnimations();
        this.player.play(`${this.myPlayerCharacter}_idle`);

        /* ---------------- NETWORK ---------------- */
        connectMovement(this, data => this.handleNetwork(data));

        /* ---------------- ZONES ---------------- */
        this.zoneManager = new ZoneManager(this, map);
        this.zones = this.zoneManager.createZones();

        if (this.zones) {
            this.physics.add.overlap(this.player, this.zones, (player, zone) => {
                this.handleZoneEnter(zone);
            });
        }

        /* ---------------- UI SCENE ---------------- */
        this.scene.launch('UIScene', { player: this.player, map: map });

        /* ---------------- MINIMAP ---------------- */
        // Minimap camera in OfficeScene can see all world sprites natively
        const minimapSize = 150;
        const padding = 20;
        const camX = this.scale.width - minimapSize - padding;
        const camY = this.scale.height - minimapSize - padding;

        this.miniMap = new MiniMap(this, map, camX, camY, minimapSize);
        this.miniMap.follow(this.player);

        // Tell main camera to ignore minimap specific UI elements
        if (this.miniMap.borderCircle) {
            this.cameras.main.ignore(this.miniMap.borderCircle);
        }
    }

    createAnimations() {
        // Create animations for all characters
        Object.keys(this.characterConfigs).forEach(charKey => {
            const config = this.characterConfigs[charKey];

            if (!this.textures.exists(config.walk) || !this.textures.exists(config.idle)) {
                console.log(`Skipping animations for ${charKey} - textures not found`);
                return;
            }

            if (!this.anims.exists(`${charKey}_walk`)) {
                this.anims.create({
                    key: `${charKey}_walk`,
                    frames: this.anims.generateFrameNumbers(config.walk, { start: 0, end: 5 }),
                    frameRate: 10,
                    repeat: -1
                });
            }

            if (!this.anims.exists(`${charKey}_idle`)) {
                this.anims.create({
                    key: `${charKey}_idle`,
                    frames: this.anims.generateFrameNumbers(config.idle, { start: 0, end: 3 }),
                    frameRate: 4,
                    repeat: -1
                });
            }
        });
    }

    update(time, delta) {
        const speed = 125;
        const body = this.player.body;
        const char = this.player.characterType;

        body.setVelocity(0);

        let moving = false;

        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
            this.player.setFlipX(true);
            moving = true;
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
            this.player.setFlipX(false);
            moving = true;
        }

        if (this.cursors.up.isDown) {
            body.setVelocityY(-speed);
            moving = true;
        } else if (this.cursors.down.isDown) {
            body.setVelocityY(speed);
            moving = true;
        }

        const animKey = moving ? `${char}_walk` : `${char}_idle`;
        if (this.player.anims.currentAnim?.key !== animKey) {
            this.player.play(animKey);
        }

        this.player.setDepth(this.player.y);
        this.playerNameText.setPosition(this.player.x, this.player.y - 40);
        this.playerNameText.setDepth(this.player.y + 1000);

        // Network Update
        this.lastSent = this.lastSent || 0;
        if (time > this.lastSent + 50) {
            if (moving || time > this.lastSent + 1000) {
                const flipXVal = this.player.flipX ? 1 : 0;
                const safeName = (this.myPlayerName || 'Player').replace(/:/g, '');
                const anim = moving ? 'walk' : 'idle';
                sendMovement(
                    `${this.roomId}:${this.myPlayerId}:${Math.round(this.player.x)}:${Math.round(this.player.y)}:${safeName}:${this.myPlayerSkin}:${this.myPlayerCharacter}:${anim}:${flipXVal}`
                );
                this.lastSent = time;
            }
        }

        this.updateProximityInteraction();

        // Zone interactions
        this.updateZoneInteraction();

        // Update zone prompt position
        if (this.zonePrompt && this.zonePrompt.visible) {
            this.zonePrompt.setPosition(this.player.x, this.player.y - 60);
            this.zonePrompt.setDepth(this.player.y + 2000);
        }

        // F key for zone interaction
        if (Phaser.Input.Keyboard.JustDown(this.fKey)) {
            this.handleZoneInteraction();
        }
    }

    handleNetwork(data) {
        console.log('Incoming Network Message:', data);
        try {
            if (data.startsWith('PlayerLeft:')) {
                const parts = data.split(':');
                const playerId = Number(parts[1]);
                this.handlePlayerLeft(playerId);
                return;
            }

            const parts = data.split(':');
            if (parts[0] !== 'Broadcast') return;

            // Log for debugging: Broadcast:partsLength -> components
            console.log(`Broadcast [${parts.length} parts]:`, parts);

            let idIndex = 1;
            if (parts.length >= 10) {
                const roomId = parts[1];
                console.log(`Room Filter: MessageRoom=${roomId}, MyRoom=${this.roomId}`);
                if (roomId != this.roomId) {
                    console.log('Room mismatch - ignoring player');
                    return;
                }
                idIndex = 2;
            }

            const id = Number(parts[idIndex]);
            if (isNaN(id)) {
                console.log(`Invalid Player ID at index ${idIndex}:`, parts[idIndex]);
                return;
            }

            if (id === this.myPlayerId) return;

            const x = Number(parts[idIndex + 1]);
            const y = Number(parts[idIndex + 2]);
            const name = parts[idIndex + 3] || 'Player';
            const skin = parseInt(parts[idIndex + 4]) || 0xffffff;
            const character = parts[idIndex + 5] || 'owlet';
            let anim = parts[idIndex + 6];
            if (anim !== 'walk' && anim !== 'idle') anim = 'idle';
            const flipX = parts[idIndex + 7] === '1';

            if (!this.otherPlayers[id]) {
                const idleSprite = this.characterConfigs[character]?.idle || 'Owlet_Monster_Idle';
                const sprite = this.physics.add.sprite(x, y, idleSprite);
                sprite.body.setAllowGravity(false);
                sprite.setTint(skin);
                sprite.characterType = character;
                sprite.play(`${character}_${anim}`, true);
                sprite.setFlipX(flipX);

                const label = this.add.text(x, y - 40, name, {
                    font: '14px Arial',
                    fill: '#fff',
                    stroke: '#000',
                    strokeThickness: 3
                }).setOrigin(0.5);

                this.otherPlayers[id] = { sprite, label };
            } else {
                const other = this.otherPlayers[id];
                if (other.sprite && other.sprite.active) {
                    const animKey = `${other.sprite.characterType}_${anim}`;
                    if (this.anims.exists(animKey)) {
                        other.sprite.play(animKey, true);
                    }
                    other.sprite.setFlipX(flipX);

                    if (other.moveTween) other.moveTween.stop();

                    other.moveTween = this.tweens.add({
                        targets: [other.sprite, other.label],
                        x: x,
                        y: { value: y, duration: 100 },
                        duration: 100,
                        onUpdate: () => {
                            if (other.sprite.active) {
                                other.sprite.setDepth(other.sprite.y);
                                other.label.setPosition(other.sprite.x, other.sprite.y - 40);
                                other.label.setDepth(other.sprite.y + 1000);
                            }
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Error handling network message:', err, data);
        }
    }

    handlePlayerLeft(playerId) {
        try {
            const other = this.otherPlayers[playerId];
            if (other) {
                if (other.moveTween) other.moveTween.stop();
                if (other.sprite) other.sprite.destroy();
                if (other.label) other.label.destroy();
                delete this.otherPlayers[playerId];

                console.log(`Player ${playerId} left the game`);
            }
        } catch (err) {
            console.error('Error handling player disconnect:', err, playerId);
        }
    }

    updateProximityInteraction() {
        let closestPlayer = null;
        let closestDistance = this.INTERACTION_DISTANCE;

        for (const [id, other] of Object.entries(this.otherPlayers)) {
            if (other.sprite && other.sprite.active) {
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    other.sprite.x, other.sprite.y
                );

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPlayer = { id: parseInt(id), sprite: other.sprite, label: other.label };
                }
            }
        }

        if (closestPlayer) {
            this.nearbyPlayer = closestPlayer;
            this.showInteractionPrompt(closestPlayer);
        } else {
            this.nearbyPlayer = null;
            this.hideInteractionPrompt();
        }
    }

    showInteractionPrompt(player) {
        if (!this.interactionPrompt) {
            this.interactionPrompt = this.add.text(0, 0, '', {
                font: '14px Arial',
                fill: '#4a90e2',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        }

        this.interactionPrompt.setText('[E] Interact');
        this.interactionPrompt.setPosition(player.sprite.x, player.sprite.y - 55);
        this.interactionPrompt.setDepth(player.sprite.y + 2000);
        this.interactionPrompt.setVisible(true);

        if (this.minimap) {
            this.minimap.ignore(this.interactionPrompt);
        }
    }

    hideInteractionPrompt() {
        if (this.interactionPrompt) {
            this.interactionPrompt.setVisible(false);
        }
    }

    initiateProximityChat(playerId) {
        if (window.selectPlayerForChat) {
            window.selectPlayerForChat(playerId);
            console.log(`Initiated proximity chat with player ${playerId}`);
        } else {
            console.error('selectPlayerForChat function not available');
        }
    }

    handleZoneEnter(zone) {
        if (this.currentZone !== zone.name) {
            this.currentZone = zone.name;
            this.showZonePrompt(zone.name);
            console.log(`Entered zone: ${zone.name}`);
        }
    }

    updateZoneInteraction() {
        // Find if we are overlapping with any zone
        let overlappingZone = null;

        if (this.zones) {
            this.zones.getChildren().forEach(zone => {
                if (this.physics.overlap(this.player, zone)) {
                    overlappingZone = zone;
                }
            });
        }

        if (overlappingZone) {
            if (this.currentZone !== overlappingZone.name) {
                this.handleZoneEnter(overlappingZone);
            }
        } else if (this.currentZone) {
            this.hideZonePrompt();
        }
    }

    showZonePrompt(zoneName) {
        if (!this.zonePrompt) {
            this.zonePrompt = this.add.text(this.player.x, this.player.y - 60, '', {
                font: '14px Arial',
                fill: '#4ade80',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5);
        }

        let promptText = '';
        switch (zoneName) {
            case 'meetingRoom':
                promptText = '[F] Start Meeting';
                break;
            case 'genAI':
                promptText = '[F] Use AI Assistant';
                break;
            case 'gaming':
                promptText = '[F] Play Mini-Game';
                break;
            case 'exit':
                promptText = '[F] Exit Office';
                break;
            case 'coffeeCorner':
                promptText = '[F] Grab Coffee';
                break;
            case 'zenZone':
                promptText = '[F] Meditate';
                break;
            default:
                promptText = `[F] Interact`;
        }

        this.zonePrompt.setText(promptText);
        this.zonePrompt.setVisible(true);

        if (this.minimap) {
            this.minimap.ignore(this.zonePrompt);
        }
    }

    hideZonePrompt() {
        if (this.zonePrompt) {
            this.zonePrompt.setVisible(false);
        }
        this.currentZone = null;
    }

    handleZoneInteraction() {
        if (!this.currentZone) return;

        console.log(`Interacting with zone: ${this.currentZone}`);

        switch (this.currentZone) {
            case 'meetingRoom':
                this.startMeeting();
                break;
            case 'genAI':
                this.openAIAssistant();
                break;
            case 'gaming':
                this.openGaming();
                break;
            case 'exit':
                this.exitOffice();
                break;
            case 'coffeeCorner':
                this.grabCoffee();
                break;
            case 'zenZone':
                this.toggleZenMode();
                break;
            default:
                console.log('Unknown zone interaction');
        }
    }

    grabCoffee() {
        console.log('Grabbing coffee...');
        alert('☕ You grabbed a fresh cup of coffee! Energy +100%');
    }

    toggleZenMode() {
        this.zenActive = !this.zenActive;
        console.log('Zen mode:', this.zenActive);

        if (this.zenActive) {
            this.player.setTint(0x88ccff); // Blue-ish calm tint
            alert('🧘 You started meditating. Real-time stressors fading...');
        } else {
            this.player.setTint(this.myPlayerSkin); // Restore original skin color
            alert('🚶 Meditation ended. Ready to work!');
        }
    }

    startMeeting() {
        // Open Google Meet in new tab
        const meetUrl = `https://meet.google.com/new`;
        window.open(meetUrl, '_blank');
        console.log('Starting Google Meet...');
    }

    openAIAssistant() {
        // Placeholder for AI assistant
        console.log('Opening AI Assistant...');
        alert('AI Assistant feature coming soon!');
    }

    openGaming() {
        // Placeholder for gaming zone
        console.log('Opening Gaming Zone...');
        alert('Gaming feature coming soon!');
    }

    exitOffice() {
        // Return to login/lobby
        console.log('Exiting office...');
        if (confirm('Are you sure you want to leave the office?')) {
            window.location.reload();
        }
    }
}