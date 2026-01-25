import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';

import api from '../network/api.js';
import GameState from '../state/GameState.js';

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
    this.playerName = '';
    this.isLoading = false;
  }

  create() {
    this.cameras.main.setBackgroundColor('#020617');

    const { width, height } = this.scale;

    // Title
    this.add.text(width / 2, 100, 'OFFICEVERSE', {
      fontSize: '48px',
      color: '#22d3ee',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Login title
    this.add.text(width / 2, 180, 'Enter Your Name', {
      fontSize: '24px',
      color: '#4ade80'
    }).setOrigin(0.5);

    // Input box background
    const inputBg = this.add.graphics();
    inputBg.fillStyle(0x1e293b, 1);
    inputBg.fillRoundedRect(width / 2 - 200, height / 2 - 30, 400, 60, 8);

    // Input text display
    this.inputText = this.add.text(width / 2, height / 2, '', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Placeholder
    this.placeholderText = this.add.text(width / 2, height / 2, 'Type your name...', {
      fontSize: '20px',
      color: '#64748b'
    }).setOrigin(0.5);

    // Cursor
    this.cursor = this.add.text(width / 2, height / 2, '|', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    // Blink cursor
    this.time.addEvent({
      delay: 500,
      callback: () => {
        this.cursor.setVisible(!this.cursor.visible);
      },
      loop: true
    });

    // Login button
    this.loginButton = this.add.text(width / 2, height / 2 + 80, 'LOGIN', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#1e293b',
      padding: { x: 40, y: 15 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.5);

    this.loginButton.on('pointerover', () => {
      if (this.playerName.length >= 3) {
        this.loginButton.setStyle({ backgroundColor: '#334155' });
      }
    });

    this.loginButton.on('pointerout', () => {
      this.loginButton.setStyle({ backgroundColor: '#1e293b' });
    });

    this.loginButton.on('pointerdown', () => {
      if (this.playerName.length >= 3 && !this.isLoading) {
        this.handleLogin();
      }
    });

    // Status text
    this.statusText = this.add.text(width / 2, height / 2 + 150, '', {
      fontSize: '16px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(width / 2, height - 100, 'Press ENTER to login', {
      fontSize: '16px',
      color: '#64748b'
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(width / 2, height - 60, 'BACK', {
      fontSize: '18px',
      color: '#f87171'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.scene.start('LauncherScene');
    });

    // Keyboard input
    this.input.keyboard.on('keydown', (event) => {
      if (this.isLoading) return;

      if (event.key === 'Backspace') {
        this.playerName = this.playerName.slice(0, -1);
        this.updateInputDisplay();
      } else if (event.key === 'Enter') {
        if (this.playerName.length >= 3) {
          this.handleLogin();
        }
      } else if (event.key.length === 1 && this.playerName.length < 20) {
        // Allow letters, numbers, spaces
        if (/[a-zA-Z0-9 ]/.test(event.key)) {
          this.playerName += event.key;
          this.updateInputDisplay();
        }
      }
    });
  }

  updateInputDisplay() {
    this.inputText.setText(this.playerName);
    
    // Show/hide placeholder
    this.placeholderText.setVisible(this.playerName.length === 0);

    // Update cursor position
    const textWidth = this.inputText.width;
    this.cursor.setX(this.scale.width / 2 + textWidth / 2 + 5);

    // Enable/disable login button
    if (this.playerName.length >= 3) {
      this.loginButton.setAlpha(1);
    } else {
      this.loginButton.setAlpha(0.5);
    }
  }

  async handleLogin() {
    this.isLoading = true;
    this.statusText.setText('Logging in...');
    this.loginButton.setAlpha(0.5);

    try {
      // Call your backend API
      const player = await api.login(this.playerName);

      console.log('Login successful:', player);

      // Store in global state
      GameState.setPlayer({
        id: player.id,
        name: player.name,
        isConnected: true
      });

      // Show success
      this.statusText.setText('Login successful!');
      this.statusText.setColor('#4ade80');

      // Wait a moment, then go to lobby
      this.time.delayedCall(500, () => {
        this.scene.start('LobbyScene');
      });

    } catch (error) {
      console.error('Login failed:', error);
      
      this.statusText.setText('Login failed: ' + error.message);
      this.statusText.setColor('#f87171');
      
      this.isLoading = false;
      this.loginButton.setAlpha(1);
    }
  }
}
