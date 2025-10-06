# WebSocket Server Implementation Guide

## 🚀 **Quick Setup for Backend WebSocket Server**

Since your backend is running on `localhost:3000`, here's how to add WebSocket support to your existing Express server.

### **1. Install WebSocket Dependencies**

```bash
cd your-backend-directory
npm install ws @types/ws
```

### **2. Create WebSocket Manager**

Create `src/socket/WebSocketManager.ts`:

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket[]> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      console.log('New WebSocket connection attempt');

      // Extract token from query parameters
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'No authentication token provided');
        return;
      }

      try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        ws.userId = decoded.userId;
        ws.isAlive = true;

        // Add client to user's client list
        if (!this.clients.has(ws.userId)) {
          this.clients.set(ws.userId, []);
        }
        this.clients.get(ws.userId)!.push(ws);

        console.log(`WebSocket authenticated for user: ${ws.userId}`);

        // Send connection established message
        this.sendToClient(ws, {
          type: 'CONNECTION_ESTABLISHED',
          userId: ws.userId,
          data: { message: 'WebSocket connection established' },
          timestamp: new Date().toISOString(),
        });

        // Handle ping/pong for connection health
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        // Handle client disconnect
        ws.on('close', () => {
          console.log(`WebSocket disconnected for user: ${ws.userId}`);
          if (ws.userId) {
            const userClients = this.clients.get(ws.userId);
            if (userClients) {
              const index = userClients.indexOf(ws);
              if (index > -1) {
                userClients.splice(index, 1);
              }
              if (userClients.length === 0) {
                this.clients.delete(ws.userId);
              }
            }
          }
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });

      } catch (error) {
        console.error('WebSocket authentication failed:', error);
        ws.close(1008, 'Invalid authentication token');
      }
    });

    // Ping clients every 30 seconds to check connection health
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  // Send message to specific client
  private sendToClient(ws: AuthenticatedWebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast message to all clients of a specific user
  public broadcastToUser(userId: string, message: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach(client => {
        this.sendToClient(client, message);
      });
    }
  }

  // Broadcast message to all connected clients
  public broadcastToAll(message: any) {
    this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      this.sendToClient(ws, message);
    });
  }

  // Get connection count for a user
  public getUserConnectionCount(userId: string): number {
    const userClients = this.clients.get(userId);
    return userClients ? userClients.length : 0;
  }

  // Get total connection count
  public getTotalConnectionCount(): number {
    return this.wss.clients.size;
  }
}
```

### **3. Integrate with Express Server**

Update your main server file (e.g., `src/index.ts` or `src/app.ts`):

```typescript
import express from 'express';
import { createServer } from 'http';
import { WebSocketManager } from './socket/WebSocketManager';

const app = express();
const server = createServer(app);

// Initialize WebSocket manager
const wsManager = new WebSocketManager(server);

// Make WebSocket manager available to services
export { wsManager };

// Your existing Express routes and middleware...

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws`);
});
```

### **4. Update Services to Use WebSocket**

Update your existing services to broadcast WebSocket messages:

#### **Task Service Example**

```typescript
// src/services/taskService.ts
import { wsManager } from '../index'; // or wherever you export it

export class TaskService {
  static async createTask(userId: string, taskData: any) {
    // ... existing task creation logic ...
    
    // Broadcast task creation
    wsManager.broadcastToUser(userId, {
      type: 'TASK_CREATED',
      userId,
      data: task,
      timestamp: new Date().toISOString(),
    });

    return task;
  }

  static async updateTask(taskId: string, userId: string, updateData: any) {
    // ... existing update logic ...
    
    // Broadcast task update
    wsManager.broadcastToUser(userId, {
      type: 'TASK_UPDATED',
      userId,
      data: updatedTask,
      timestamp: new Date().toISOString(),
    });

    return updatedTask;
  }

  static async deleteTask(taskId: string, userId: string) {
    // ... existing delete logic ...
    
    // Broadcast task deletion
    wsManager.broadcastToUser(userId, {
      type: 'TASK_DELETED',
      userId,
      data: { taskId },
      timestamp: new Date().toISOString(),
    });
  }

  static async updateTaskStatus(taskId: string, userId: string, status: string) {
    // ... existing status update logic ...
    
    // Broadcast status change
    wsManager.broadcastToUser(userId, {
      type: 'TASK_STATUS_CHANGED',
      userId,
      data: { taskId, status: updatedTask.status },
      timestamp: new Date().toISOString(),
    });

    return updatedTask;
  }
}
```

#### **Session Service Example**

```typescript
// src/services/sessionService.ts
import { wsManager } from '../index';

export class SessionService {
  static async startSession(userId: string, sessionData: any) {
    // ... existing session creation logic ...
    
    // Broadcast session start
    wsManager.broadcastToUser(userId, {
      type: 'SESSION_START',
      userId,
      data: {
        sessionId: session.id,
        type: session.type,
        duration: session.duration,
        startTime: session.startTime,
        taskId: session.taskId,
      },
      timestamp: new Date().toISOString(),
    });

    return session;
  }

  static async endSession(sessionId: string, userId: string) {
    // ... existing session ending logic ...
    
    // Broadcast session end
    wsManager.broadcastToUser(userId, {
      type: 'SESSION_END',
      userId,
      data: {
        sessionId,
        completedPomodoros: updatedTask.completedPomodoros,
        isCompleted: session.isCompleted,
        taskId: session.taskId,
      },
      timestamp: new Date().toISOString(),
    });

    return session;
  }
}
```

### **5. Test WebSocket Connection**

#### **Using wscat (Command Line)**

```bash
# Install wscat globally
npm install -g wscat

# Test connection (replace with your actual JWT token)
wscat -c "ws://localhost:3000/ws?token=your-jwt-token-here"

# Send test message
{"type": "NOTIFICATION", "userId": "user-id", "data": {"message": "Test message"}, "timestamp": "2025-01-06T12:00:00.000Z"}
```

#### **Using Browser Console**

```javascript
// Open browser console on your frontend
const ws = new WebSocket('ws://localhost:3000/ws?token=your-jwt-token');
ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Message:', JSON.parse(event.data));
ws.onclose = () => console.log('Disconnected');
ws.onerror = (error) => console.error('Error:', error);
```

### **6. Environment Variables**

Make sure your `.env` file includes:

```env
JWT_SECRET=your-jwt-secret-key
PORT=3000
```

### **7. Testing the Integration**

1. **Start your backend server** with WebSocket support
2. **Open your frontend** and check the WebSocket status indicator
3. **Navigate to `/websocket-test`** to test the connection
4. **Create/update/delete tasks** to see real-time updates
5. **Start/stop timer sessions** to see session events

### **8. Production Considerations**

For production deployment:

```typescript
// Update WebSocket URL in useWebSocket.ts
const wsUrl = process.env.NODE_ENV === 'production' 
  ? `wss://your-domain.com/ws?token=${token}`
  : `ws://localhost:3000/ws?token=${token}`;
```

### **9. Monitoring and Debugging**

Add logging to track WebSocket activity:

```typescript
// In WebSocketManager constructor
console.log(`WebSocket server started on port ${PORT}`);
console.log(`Total connections: ${this.getTotalConnectionCount()}`);
```

## 🎯 **Expected Results**

After implementing this:

1. ✅ **Real-time Task Updates**: Tasks appear/disappear instantly across tabs
2. ✅ **Live Timer Sync**: Timer state syncs across multiple devices
3. ✅ **Instant Notifications**: Get notified of session completions
4. ✅ **Connection Status**: See WebSocket connection status in UI
5. ✅ **Auto-reconnection**: Automatically reconnect if connection drops

## 🚀 **Next Steps**

1. Implement the WebSocket server in your backend
2. Test the connection using the WebSocket test page
3. Verify real-time updates work for tasks, sessions, and settings
4. Deploy with production WebSocket URL

Your Pomofocus app now has comprehensive real-time WebSocket support! 🍅✨
