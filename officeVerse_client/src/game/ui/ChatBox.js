export default class ChatBox {
  constructor(scene, x = 20, y = 300, width = 300, height = 160) {
    this.scene = scene;

    // Background
    this.background = scene.add.rectangle(
      x,
      y,
      width,
      height,
      0x000000,
      0.6
    ).setOrigin(0).setScrollFactor(0).setDepth(10000);

    // Text display
    this.text = scene.add.text(x + 10, y + 10, '', {
      fontSize: '14px',
      color: '#e5e7eb',
      wordWrap: { width: width - 20 }
    }).setScrollFactor(0).setDepth(10001);

    this.messages = [];
  }

  addMessage(username, message) {
    const line = `${username}: ${message}`;
    this.messages.push(line);

    if (this.messages.length > 10) {
      this.messages.shift();
    }

    this.text.setText(this.messages.join('\n'));
  }

  clear() {
    this.messages = [];
    this.text.setText('');
  }

  setVisible(value) {
    this.background.setVisible(value);
    this.text.setVisible(value);
  }
}
