import Phaser from "phaser";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    console.log("📦 Preloading assets...");

    /* ================================
       TILEMAP
    ================================= */
    this.load.tilemapTiledJSON(
      "office_map",
      "assets/maps/office_map.json"
    );

    /* ================================
       TILESET IMAGE
       (name must match Tiled JSON)
    ================================= */
    this.load.image(
      "office_tileset",
      "assets/tilesets/office_tileset.png",
      "office_tileset2",
      "assets/tilesets/office_tileset2.png"
    );

    /* ================================
       PLAYER SPRITESHEETS
    ================================= */

    // Walk animation (6 frames, 32x32)
    this.load.spritesheet(
      "Owlet_Monster_Walk",
      "assets/sprites/Owlet_Monster_Walk_6.png",
      {
        frameWidth: 32,
        frameHeight: 32
      }
    );

    // Idle animation (4 frames, 32x32)
    this.load.spritesheet(
      "Owlet_Monster_Idle",
      "assets/sprites/Owlet_Monster_Idle_4.png",
      {
        frameWidth: 32,
        frameHeight: 32
      }
    );

    /* ================================
       OPTIONAL: LOADING BAR (MINIMAL)
    ================================= */
    const { width, height } = this.cameras.main;
    const bar = this.add.rectangle(
      width / 2 - 200,
      height / 2,
      0,
      20,
      0xffffff
    ).setOrigin(0, 0.5);

    this.load.on("progress", (p) => {
      bar.width = 400 * p;
    });
  }

  create() {
    console.log("✅ Preload complete");

    // Go directly to LauncherScene
    this.scene.start("LauncherScene");
  }
}