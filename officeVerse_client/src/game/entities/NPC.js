import { GAME_CONFIG } from '../../utils/constants.js';

export default class NPC {
  constructor(scene, config) {
    this.scene = scene;
    this.name = config.name;
    this.dialogue = config.dialogue || ['Hello!'];
    this.currentDialogueIndex = 0;

    // Create sprite
    this.sprite = scene.physics.add.sprite(config.x, config.y, 'Owlet_Monster_Idle', 0);
    this.sprite.setScale(2);
    this.sprite.setImmovable(true);
    this.sprite.setTint(0xffaa00); // Orange tint for NPCs

    // Name tag
    this.nameTag = scene.add.text(config.x, config.y - 40, config.name, {
      fontSize: '14px',
      color: '#ffaa00',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5);

    // Interaction zone
    this.interactionZone = scene.add.circle(
      config.x,
      config.y,
      GAME_CONFIG.INTERACTION_RANGE,
      0x00ff00,
      0
    );
    scene.physics.add.existing(this.interactionZone);
    this.interactionZone.body.setImmovable(true);

    // Interaction prompt
    this.promptText = null;

    // Play idle animation
    this.sprite.anims.play('idle', true);

    // AI behavior
    this.behavior = config.behavior || 'idle';
    this.behaviorTimer = 0;
  }

  update(time, delta) {
    // Update positions
    this.nameTag.setPosition(this.sprite.x, this.sprite.y - 40);
    this.interactionZone.setPosition(this.sprite.x, this.sprite.y);

    // Update prompt position if visible
    if (this.promptText && this.promptText.visible) {
      this.promptText.setPosition(this.sprite.x, this.sprite.y + 40);
    }

    // AI behavior
    this.updateBehavior(time, delta);

    // Update depth
    this.sprite.setDepth(this.sprite.y);
    this.nameTag.setDepth(this.sprite.y + 1);
  }

  updateBehavior(time, delta) {
    if (this.behavior === 'idle') {
      // Just stand there
      return;
    } else if (this.behavior === 'wander') {
      this.behaviorTimer += delta;
      
      if (this.behaviorTimer > 3000) {
        // Change direction every 3 seconds
        this.behaviorTimer = 0;
        const direction = Phaser.Math.Between(0, 4);
        
        this.sprite.body.setVelocity(0);
        
        switch (direction) {
          case 0: // up
            this.sprite.body.setVelocityY(-50);
            this.sprite.anims.play('walk-up', true);
            break;
          case 1: // down
            this.sprite.body.setVelocityY(50);
            this.sprite.anims.play('walk-down', true);
            break;
          case 2: // left
            this.sprite.body.setVelocityX(-50);
            this.sprite.setFlipX(true);
            this.sprite.anims.play('walk-left', true);
            break;
          case 3: // right
            this.sprite.body.setVelocityX(50);
            this.sprite.setFlipX(false);
            this.sprite.anims.play('walk-right', true);
            break;
          case 4: // idle
            this.sprite.anims.play('idle', true);
            break;
        }
      }
    }
  }

  interact() {
    const message = this.dialogue[this.currentDialogueIndex];
    this.currentDialogueIndex = (this.currentDialogueIndex + 1) % this.dialogue.length;
    return message;
  }

  showInteractionPrompt(show) {
    if (show) {
      if (!this.promptText) {
        this.promptText = this.scene.add.text(
          this.sprite.x,
          this.sprite.y + 40,
          'Press E',
          {
            fontSize: '14px',
            color: '#4ade80',
            backgroundColor: '#000000',
            padding: { x: 6, y: 3 }
          }
        ).setOrigin(0.5);
      }
      this.promptText.setVisible(true);
      this.promptText.setDepth(this.sprite.y + 2);
    } else if (this.promptText) {
      this.promptText.setVisible(false);
    }
  }

  destroy() {
    this.sprite.destroy();
    this.nameTag.destroy();
    this.interactionZone.destroy();
    if (this.promptText) {
      this.promptText.destroy();
    }
  }
}