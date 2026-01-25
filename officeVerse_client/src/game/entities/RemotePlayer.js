export default class RemotePlayer {
  constructor(scene, data) {
    this.scene = scene;
    this.playerId = data.playerId;
    this.playerName = data.playerName;

    // Create sprite
    this.sprite = scene.physics.add.sprite(data.x, data.y, 'Owlet_Monster_Idle', 0);
    this.sprite.setScale(2);
    this.sprite.setTint(0x88ccff); // Tint to differentiate remote players

    // Name tag
    this.nameTag = scene.add.text(data.x, data.y - 40, data.playerName, {
      fontSize: '14px',
      color: '#88ccff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5);

    // Interpolation
    this.targetX = data.x;
    this.targetY = data.y;
    this.interpolationSpeed = 0.2;

    // Play idle animation
    this.sprite.anims.play('idle', true);
  }

  updatePosition(x, y) {
    this.targetX = x;
    this.targetY = y;

    // Calculate direction for animation
    const dx = x - this.sprite.x;
    const dy = y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 2) {
      // Moving
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement
        this.sprite.setFlipX(dx < 0);
        this.sprite.anims.play('walk-right', true);
      } else {
        // Vertical movement
        this.sprite.anims.play(dy < 0 ? 'walk-up' : 'walk-down', true);
      }
    } else {
      // Idle
      if (this.sprite.anims.currentAnim?.key !== 'idle') {
        this.sprite.anims.play('idle', true);
      }
    }
  }

  update() {
    // Smooth interpolation
    this.sprite.x += (this.targetX - this.sprite.x) * this.interpolationSpeed;
    this.sprite.y += (this.targetY - this.sprite.y) * this.interpolationSpeed;

    // Update name tag
    this.nameTag.setPosition(this.sprite.x, this.sprite.y - 40);
    
    // Update depth
    this.sprite.setDepth(this.sprite.y);
    this.nameTag.setDepth(this.sprite.y + 1);
  }

  destroy() {
    this.sprite.destroy();
    this.nameTag.destroy();
  }
}