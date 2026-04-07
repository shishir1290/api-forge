import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9110";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});
