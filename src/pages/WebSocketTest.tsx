import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WebSocketMessage } from "@/types/websocket";
import React, { useState } from "react";

export const WebSocketTest: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [testMessage, setTestMessage] = useState("");

  const { isConnected, connectionStatus, sendMessage } = useWebSocket({
    token: user?.accessToken || "",
    onMessage: (message: WebSocketMessage) => {
      console.log("Test page received message:", message);
      setMessages((prev) => [...prev, message]);
    },
    onConnect: () => {
      console.log("WebSocket connected in test page");
    },
    onDisconnect: () => {
      console.log("WebSocket disconnected in test page");
    },
    onError: (error) => {
      console.error("WebSocket error in test page:", error);
    },
  });

  const sendTestMessage = () => {
    if (testMessage.trim()) {
      sendMessage({
        type: "NOTIFICATION",
        userId: user?.id || "",
        data: {
          title: "Test Message",
          message: testMessage,
          type: "info",
        },
        timestamp: new Date().toISOString(),
      });
      setTestMessage("");
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-white mb-4">
            WebSocket Test Page
          </h1>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-white">
                Status: {connectionStatus}{" "}
                {isConnected ? "(Connected)" : "(Disconnected)"}
              </span>
            </div>

            <div className="flex gap-2">
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter test message..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button
                onClick={sendTestMessage}
                disabled={!isConnected || !testMessage.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                Send Test Message
              </Button>
              <Button
                onClick={clearMessages}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Clear Messages
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Received Messages
          </h2>

          {messages.length === 0 ? (
            <p className="text-white/70">No messages received yet...</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-primary">
                      {message.type}
                    </span>
                    <span className="text-xs text-white/50">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-white/90">
                    {message.message || JSON.stringify(message.data, null, 2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
