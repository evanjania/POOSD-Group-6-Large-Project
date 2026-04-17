import { io } from "socket.io-client";

const URL = "https://ugotta.space"; 

export const socket = io(URL, {
    path: "/api/socket.io",
    autoConnect: false
});