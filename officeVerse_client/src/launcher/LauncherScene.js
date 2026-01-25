import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';

export default class LauncherScene extends Phaser.Scene {
  constructor() {
    super("LauncherScene");
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor("#020617");

    // --- LOGO ---
    const logo = this.add.text(width / 2, height / 2 - 60, "OFFICEVERSE", {
      fontSize: "48px",
      color: "#22d3ee",
      fontStyle: "bold"
    })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.8);

    // Logo animation (fade + scale)
    this.tweens.add({
      targets: logo,
      alpha: 1,
      scale: 1,
      duration: 1000,
      ease: "Power2"
    });

    // --- LOADING BAR ---
    const barWidth = 300;
    const barHeight = 16;

    const barBg = this.add.rectangle(
      width / 2,
      height / 2 + 10,
      barWidth,
      barHeight,
      0x1e293b
    );

    const barFill = this.add.rectangle(
      width / 2 - barWidth / 2,
      height / 2 + 10,
      0,
      barHeight,
      0x22d3ee
    ).setOrigin(0, 0.5);

    // Fake loading animation
    this.tweens.add({
      targets: barFill,
      width: barWidth,
      duration: 1500,
      ease: "Linear",
      onComplete: () => {
        this.showContinueText();
      }
    });
  }

  showContinueText() {
    const { width, height } = this.scale;

    const continueText = this.add.text(
      width / 2,
      height / 2 + 60,
      "Press ENTER to continue",
      {
        fontSize: "18px",
        color: "#e5e7eb"
      }
    ).setOrigin(0.5);

    // Blink animation
    this.tweens.add({
      targets: continueText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // ENTER key to continue
    const enterKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    enterKey.once("down", () => {
      this.scene.start("LoginScene");
    });
  }
}
