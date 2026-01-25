import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';

export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super("SettingsScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#020617");

    const { width, height } = this.scale;

    this.add.text(width / 2, 120, "SETTINGS", {
      fontSize: "42px",
      color: "#facc15"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, "Coming soon...", {
      fontSize: "20px",
      color: "#94a3b8"
    }).setOrigin(0.5);

    const backBtn = this.add.text(width / 2, height - 100, "BACK", {
      fontSize: "20px",
      color: "#f87171"
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backBtn.on("pointerdown", () => {
      this.scene.start("LauncherScene");
    });
  }
}
