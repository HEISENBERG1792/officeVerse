import { GAME_CONFIG } from '../../utils/constants.js';

export default class Player {
  constructor(scene, x, y, playerId, playerName) {
    this.scene = scene;
    this.playerId = playerId;
    this.playerName = playerName;

    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, 'Owlet_Monster_Idle', 0);
    this.sprite.setScale(2);
    this.sprite.setDepth(y);
    // mark sprite as player for minimap
    this.sprite.setData("isPlayer", true);

    // Name tag
    this.nameTag = scene.add.text(x, y - 40, playerName, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5);

    // State
    this.lastDirection = 'down';
    this.isMoving = false;

    // Network sync
    this.lastSyncTime = 0;
    this.syncInterval = 50; // Send position every 50ms when moving
  }

  move(input, movementSocket) {
    const speed = GAME_CONFIG.PLAYER_SPEED;
    const body = this.sprite.body;

    body.setVelocity(0);

    let anim = 'idle';
    this.isMoving = false;

    if (input.x === -1) {
      body.setVelocityX(-speed);
      this.sprite.setFlipX(true);
      anim = 'walk-left';
      this.lastDirection = 'left';
      this.isMoving = true;
    } else if (input.x === 1) {
      body.setVelocityX(speed);
      this.sprite.setFlipX(false);
      anim = 'walk-right';
      this.lastDirection = 'right';
      this.isMoving = true;
    }

    if (input.y === -1) {
      body.setVelocityY(-speed);
      anim = 'walk-up';
      this.lastDirection = 'up';
      this.isMoving = true;
    } else if (input.y === 1) {
      body.setVelocityY(speed);
      anim = 'walk-down';
      this.lastDirection = 'down';
      this.isMoving = true;
    }

    // Play animation
    if (this.sprite.anims.currentAnim?.key !== anim) {
      this.sprite.anims.play(anim, true);
    }

    // Update depth for proper layering
    this.sprite.setDepth(this.sprite.y);

    // Network sync
    const now = Date.now();
    if (this.isMoving && now - this.lastSyncTime > this.syncInterval) {
      movementSocket.sendPosition(this.sprite.x, this.sprite.y);
      this.lastSyncTime = now;
    }
  }

  update() {
    // Update name tag position
    this.nameTag.setPosition(this.sprite.x, this.sprite.y - 40);
    this.nameTag.setDepth(this.sprite.y + 1);
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
  }

  destroy() {
    this.sprite.destroy();
    this.nameTag.destroy();
  }
}