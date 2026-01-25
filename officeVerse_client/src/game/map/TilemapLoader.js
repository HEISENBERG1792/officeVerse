export default class TileMapLoader {
  /**
   * @param {Phaser.Scene} scene
   * @param {string} mapKey
   * @param {string} tilesetName  (name inside Tiled)
   * @param {string} tilesetKey   (key used in preload)
   */
  /*
  constructor(scene, mapKey, tilesetName, tilesetKey) {
    this.scene = scene;
    this.mapKey = mapKey;
    this.tilesetName = tilesetName;
    this.tilesetKey = tilesetKey;
  }

  load() {
    // Create map
    const map = this.scene.make.tilemap({ key: this.mapKey });

    // Attach tileset
    const tileset = map.addTilesetImage(
      this.tilesetName,
      this.tilesetKey
    );

    if (!tileset) {
      console.error("Tileset not found. Check tileset name.");
      return null;
    }

    // Create layers
    const floor = map.createLayer("floor", tileset);
    const walls = map.createLayer("walls", tileset);
    const furniture = map.createLayer("furniture", tileset);
    const collision = map.createLayer("collision", tileset);

    // Enable collision
    if (collision) {
      collision.setCollisionByProperty({ collides: true });
    }

    // World bounds
    this.scene.physics.world.setBounds(
      0,
      0,
      map.widthInPixels,
      map.heightInPixels
    );

    return {
      map,
      layers: {
        floor,
        walls,
        furniture,
        collision
      }
    };
  }
} */
export default class TileMapLoader {
  constructor(scene) {
    this.scene = scene;
  }

  load() {
    const map = this.scene.make.tilemap({
      key: 'office_map'
    });

    const tileset = map.addTilesetImage(
      'Modern_Office_32x32', // MUST match tileset name in Tiled
      'office-tiles'
    );

    const floor = map.createLayer('floor', tileset, 0, 0);
    const wall = map.createLayer('wall', tileset, 0, 0);
    const furniture = map.createLayer('furniture', tileset, 0, 0);
    const collision = map.createLayer('collision', tileset, 0, 0);

    // Collision
    collision.setCollisionByExclusion([-1]);

    return {
      map,
      layers: { floor, wall, furniture, collision }
    };
  }
}

