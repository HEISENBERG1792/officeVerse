// Use this import everywhere
import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';


export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  init(data) {
    console.log('UIScene init data:', data);
    // Receive references from OfficeScene
    this.player = data.player;
    this.map = data.map;
  }

  create() {
    // 🔒 UI Scene can be used for other overlays if needed
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
  }
}
