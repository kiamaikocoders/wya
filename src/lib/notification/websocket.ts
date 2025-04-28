
let notificationSocket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

export const connectWebSocket = (userId: number, onMessage: (data: any) => void) => {
  if (!userId) return null;
  
  console.log(`Creating mock WebSocket connection for user ${userId}`);
  
  const mockSocket = {
    send: (data: string) => {
      console.log('Mock WebSocket sent:', data);
    },
    close: () => {
      console.log('Mock WebSocket connection closed');
      notificationSocket = null;
    }
  };
  
  const mockNotificationInterval = setInterval(() => {
    if (Math.random() < 0.1) {
      const mockTypes = ['event_update', 'announcement', 'system', 'message'];
      const mockType = mockTypes[Math.floor(Math.random() * mockTypes.length)] as any;
      
      const mockNotification = {
        id: Math.floor(Math.random() * 1000),
        user_id: userId,
        title: `New ${mockType.replace('_', ' ')}`,
        message: `This is a mock ${mockType.replace('_', ' ')} notification.`,
        type: mockType,
        read: false,
        created_at: new Date().toISOString(),
      };
      
      onMessage({ type: 'notification', data: mockNotification });
    }
  }, 30000);
  
  (mockSocket as any).intervalId = mockNotificationInterval;
  
  return mockSocket as any;
};

export const setupWebSocketReconnection = (userId: number, onMessage: (data: any) => void) => {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    setTimeout(() => {
      reconnectAttempts++;
      console.log(`Attempting to reconnect WebSocket (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      notificationSocket = connectWebSocket(userId, onMessage);
    }, RECONNECT_DELAY * reconnectAttempts);
  } else {
    console.error('Maximum WebSocket reconnection attempts reached');
    toast.error('Failed to establish notification connection. Please refresh the page.');
  }
};

export const closeWebSocketConnection = () => {
  if (notificationSocket) {
    if ((notificationSocket as any).intervalId) {
      clearInterval((notificationSocket as any).intervalId);
    }
    
    notificationSocket.close();
    notificationSocket = null;
    reconnectAttempts = 0;
  }
};
