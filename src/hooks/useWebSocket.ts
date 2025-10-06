import {
  UseWebSocketOptions,
  WebSocketConnectionStatus,
  WebSocketMessage,
} from "@/types/websocket";
import { useCallback, useEffect, useRef, useState } from "react";

export const useWebSocket = ({
  token,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<WebSocketConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus("connecting");

    try {
      // Use the same base URL as the API client
      const wsUrl =
        process.env.NODE_ENV === "production"
          ? `wss://your-production-domain.com/ws?token=${token}`
          : `ws://localhost:3000/ws?token=${token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("WebSocket message received:", message);
          onMessage?.(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onDisconnect?.();

        // Attempt to reconnect if not a clean close
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          console.log(
            `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("error");
        onError?.(error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionStatus("error");
    }
  }, [
    token,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval,
    maxReconnectAttempts,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User initiated disconnect");
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
  }, []);

  const sendMessage = useCallback((message: Partial<WebSocketMessage>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
  };
};
