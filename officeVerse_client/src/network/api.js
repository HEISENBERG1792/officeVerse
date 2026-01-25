export async function registerPlayer(name, roomId) {
  const res = await fetch(
    `http://localhost:8080/auth/register?name=${name}&roomId=${roomId}`,
    { method: "POST" }
  );
  return res.json();
}