let socket;
let scene;
export function connectMovement(gameScene, onMessage) {
  scene = gameScene;
  socket = new WebSocket("ws://localhost:8080/movement");
  socket.onmessage = (e) => {
    if (onMessage) onMessage(e.data);
  };
  socket.onopen = () => {
    console.log("Movement Socket Connected");
    if (gameScene.debugText) gameScene.debugText.setText("Connected! ID: " + (gameScene.myPlayerId || '?'));
  };
}
export function sendMovement(message) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(message);
  }
}