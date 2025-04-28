
import { toast } from 'sonner';
import type { Notification } from './types';

// WebSocket connection state
let socket: WebSocket | null = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000; // 3 seconds

// Callbacks for notification events
type NotificationCallback = (notification: Notification) => void;
const notificationCallbacks: NotificationCallback[] = [];

// Function to add a notification callback
export const onNotification = (callback: NotificationCallback): (() => void) => {
  notificationCallbacks.push(callback);
  
  // Return function to remove this callback
  return () => {
    const index = notificationCallbacks.indexOf(callback);
    if (index !== -1) {
      notificationCallbacks.splice(index, 1);
    }
  };
};

// Initialize WebSocket connection
export const initializeNotificationSocket = (userId: string | number): void => {
  if (socket) {
    socket.close();
  }
  
  try {
    // In production, this would be a real WebSocket endpoint
    // For now, we'll use a mock URL
    const wsUrl = `wss://api.example.com/notifications/${userId}`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('Notification WebSocket connected');
      isConnected = true;
      reconnectAttempts = 0;
    };
    
    socket.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as Notification;
        // Notify all callbacks
        notificationCallbacks.forEach(callback => callback(notification));
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('Notification WebSocket error:', error);
      toast.error('Notification service encountered an error');
    };
    
    socket.onclose = () => {
      console.log('Notification WebSocket closed');
      isConnected = false;
      
      // Attempt to reconnect
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
          initializeNotificationSocket(userId);
        }, RECONNECT_INTERVAL);
      } else {
        toast.error('Could not connect to notification service. Please refresh the page.');
      }
    };
  } catch (error) {
    console.error('Failed to initialize notification socket:', error);
    toast.error('Failed to initialize notification service');
  }
};

// Send data through WebSocket
export const sendNotificationData = (data: any): void => {
  if (socket && isConnected) {
    socket.send(JSON.stringify(data));
  } else {
    console.error('WebSocket is not connected');
  }
};

// Close WebSocket connection
export const closeNotificationSocket = (): void => {
  if (socket) {
    socket.close();
    socket = null;
    isConnected = false;
  }
};
