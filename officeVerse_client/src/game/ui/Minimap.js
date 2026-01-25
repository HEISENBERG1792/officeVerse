export default class MiniMap {
  constructor(scene, map, x = 20, y = 20, size = 160) {
    this.scene = scene;
    this.map = map;
    this.x = x;
    this.y = y;
    this.size = size;

    // Create the minimap camera with proper viewport
    this.camera = scene.cameras.add(x, y, size, size);
    this.camera.setZoom(0.25);
    this.camera.setName('MiniMap');
    this.camera.setBackgroundColor(0x002244);
    this.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    console.log('Minimap camera created:', this.camera.name);

    // 🔵 Circular mask
    const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillCircle(x + size / 2, y + size / 2, size / 2);
    const mask = maskShape.createGeometryMask();
    this.camera.setMask(mask);

    // 🟢 Border circle
    this.borderCircle = scene.add.circle(
      x + size / 2,
      y + size / 2,
      size / 2
    ).setStrokeStyle(3, 0xffffff)
      .setFillStyle(undefined)
      .setScrollFactor(0)
      .setDepth(10000);

    // Make sure border is ignored by minimap camera
    this.camera.ignore(this.borderCircle);

    console.log('Border circle created and added to scene');

    // Draw zone names
    this.drawZoneNames();
  }

  follow(target) {
    this.camera.startFollow(target);
  }

  destroy() {
    this.scene.cameras.remove(this.camera);
    this.playerDots.clear();
  }

  drawZoneNames() {
    const zoneLayer = this.map.getObjectLayer('zone');

    if (!zoneLayer) return;

    zoneLayer.objects.forEach(obj => {
      const zoneName = obj.name || 'Zone';

      // Background for text
      const bg = this.scene.add.rectangle(
        obj.x + obj.width / 2,
        obj.y + obj.height / 2,
        200, 40, 0x000000, 0.7
      ).setOrigin(0.5).setDepth(999);

      const label = this.scene.add.text(
        obj.x + obj.width / 2,
        obj.y + obj.height / 2,
        zoneName.toUpperCase(),
        {
          font: 'bold 24px Arial', // Even larger
          fill: '#ffff00', // Yellow for high contrast
          align: 'center',
          stroke: '#000000',
          strokeThickness: 6
        }
      ).setOrigin(0.5);

      label.setScrollFactor(1); // World space
      label.setDepth(1000);
      bg.setScrollFactor(1);

      // Show in minimap, but hide from main UI camera
      this.scene.cameras.main.ignore([label, bg]);
    });
  }

  // No abstract markers needed: camera natively sees world sprites
  addPlayerDot() { }
  addRemotePlayerDot() { }
  updateRemotePlayerPosition() { }
  removeRemotePlayerDot() { }
}

