
let socket;

export function connectChat(onMsg) {
  socket = new WebSocket("ws://localhost:8080/ws/chat");
  socket.onmessage = (e) => onMsg(e.data);
}

export function sendChat(msg) {
  socket.send(msg);
}
