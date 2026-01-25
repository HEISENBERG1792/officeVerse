import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';

export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super("LobbyScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#020617");

    const { width, height } = this.scale;

    this.add.text(width / 2, 120, "LOBBY", {
      fontSize: "42px",
      color: "#38bdf8"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 40, "Connected", {
      fontSize: "18px",
      color: "#94a3b8"
    }).setOrigin(0.5);

    this.createButton("ENTER OFFICE", height / 2 + 20, () => {
      this.scene.start("OfficeScene");
    });

    this.createButton("BACK", height / 2 + 80, () => {
      this.scene.start("LauncherScene");
    });
  }

  createButton(label, y, callback) {
    const btn = this.add.text(this.scale.width / 2, y, label, {
      fontSize: "22px",
      backgroundColor: "#1e293b",
      padding: { x: 20, y: 10 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on("pointerdown", callback);
  }
}
