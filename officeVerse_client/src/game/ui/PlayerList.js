export default class PlayerList {
  constructor(scene, x = 460, y = 200, width = 160) {
    this.scene = scene;
    this.players = {};

    this.background = scene.add.rectangle(
      x,
      y,
      width,
      200,
      0x000000,
      0.6
    ).setOrigin(0).setScrollFactor(0);

    this.title = scene.add.text(
      x + 10,
      y + 10,
      'Players',
      { fontSize: '16px', color: '#ffffff' }
    ).setScrollFactor(0);

    this.text = scene.add.text(
      x + 10,
      y + 40,
      '',
      { fontSize: '14px', color: '#ffffff' }
    ).setScrollFactor(0);
  }

  addPlayer(id, name) {
    this.players[id] = name;
    this.refresh();
  }

  removePlayer(id) {
    delete this.players[id];
    this.refresh();
  }

  refresh() {
    this.text.setText(Object.values(this.players).join('\n'));
  }

  setVisible(value) {
    this.background.setVisible(value);
    this.title.setVisible(value);
    this.text.setVisible(value);
  }
}
