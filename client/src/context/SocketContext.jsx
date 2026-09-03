import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

const SOCKET_SERVER_URL = "http://localhost:5511";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, updateCredits } = useAuth();

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected to server:", newSocket.id);
      if (user?._id) {
        newSocket.emit("join_room", `user_${user._id}`);
      }
    });

    // Listen for global real-time credit update push
    newSocket.on("credits_updated", (data) => {
      if (typeof data.credits === "number") {
        updateCredits(data.credits);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
