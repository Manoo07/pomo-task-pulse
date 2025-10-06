import { useWebSocket } from "@/hooks/useWebSocket";
import { WebSocketConnectionStatus } from "@/types/websocket";
import React from "react";

interface WebSocketStatusProps {
  token: string;
  className?: string;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  token,
  className = "",
}) => {
  const { isConnected, connectionStatus } = useWebSocket({
    token,
    onConnect: () => {
      console.log("WebSocket connected");
    },
    onDisconnect: () => {
      console.log("WebSocket disconnected");
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
    },
  });

  const getStatusColor = (status: WebSocketConnectionStatus): string => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-gray-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: WebSocketConnectionStatus): string => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)}`}
      ></div>
      <span className="text-sm text-white/70">
        {getStatusText(connectionStatus)}
      </span>
    </div>
  );
};
