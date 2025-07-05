import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthProvider'; // Adjust path if needed
import { notificationClient } from '../../api/grpc/notificationClient'; // Adjust path
import { SubscribeRequest, PushSubscription, SubscribeResponse } from '../../api/gen/notification'; // Adjust path

// --- IMPORTANT ---
// Replace this with the VAPID Public Key you generated
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Helper function to convert the VAPID key
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const NotificationTester: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  // Automatically set the user ID if the user is logged in
  useEffect(() => {
    if (!authLoading && user) {
      setTargetUserId(String(user.id));
    }
  }, [user, authLoading]);

  // Check if the browser is already subscribed when the page loads
  useEffect(() => {
    const checkSubscription = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            setIsSubscribed(true);
            setStatusMessage("This browser is already subscribed to notifications.");
            setMessageType('info');
          } else {
            setStatusMessage("This browser is not yet subscribed. Click the button to subscribe.");
            setMessageType('info');
          }
        } catch (error) {
            console.error("Error checking for existing subscription:", error);
            setStatusMessage("Could not check for existing subscription. Make sure the service worker is active.");
            setMessageType('error');
        } finally {
            setIsCheckingSubscription(false);
        }
      }
    };
    checkSubscription();
  }, []);


  const handleSubscribe = async () => {
    if (!targetUserId) {
      setStatusMessage("Please enter a User ID to subscribe.");
      setMessageType('error');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatusMessage("Push notifications are not supported by this browser.");
      setMessageType('error');
      return;
    }
    
    if (VAPID_PUBLIC_KEY === "YOUR_VAPID_PUBLIC_KEY_HERE") {
        setStatusMessage("VAPID_PUBLIC_KEY is not set. Please replace the placeholder in the code.");
        setMessageType('error');
        return;
    }

    setStatusMessage("Requesting notification permission...");
    setMessageType('info');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatusMessage("Notification permission was not granted.");
        setMessageType('error');
        return;
      }

      setStatusMessage("Subscribing to push service...");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJSON = subscription.toJSON();
      if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
        setStatusMessage("Failed to get complete subscription details from the browser.");
        setMessageType('error');
        return;
      }

      setStatusMessage("Sending subscription to server...");
      
      const grpcSubscription: PushSubscription = {
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth,
      }
      
      const subscribeReq: SubscribeRequest = {
        userId: targetUserId,
        subscription: grpcSubscription,
      }
      
      const subscribeRes: SubscribeResponse = await notificationClient.Subscribe(subscribeReq);

      if (subscribeRes.success) {
        setStatusMessage(`Successfully subscribed this browser for User ID: ${targetUserId}`);
        setMessageType('success');
        setIsSubscribed(true);
      } else {
        setStatusMessage(`Server failed to process subscription: ${subscribeRes.message}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error("Subscription failed:", error);
      setStatusMessage(`An error occurred: ${error instanceof Error ? error.message : String(error)}`);
      setMessageType('error');
    }
  };

  const getStatusColor = () => {
    switch (messageType) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#17a2b8';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Push Notification Subscription Tester</h1>
        <p style={styles.instructions}>
          Use this page to subscribe the current browser to receive push notifications for a specific User ID.
        </p>
        
        <div style={styles.inputGroup}>
          <label htmlFor="userIdInput" style={styles.label}>User ID to Subscribe:</label>
          <input
            id="userIdInput"
            type="text"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="Enter User ID (e.g., 1, 2, 3)"
            style={styles.input}
            disabled={!user && authLoading}
          />
        </div>

        <button 
          onClick={handleSubscribe} 
          style={isSubscribed ? styles.buttonDisabled : styles.button}
          disabled={isSubscribed || isCheckingSubscription}
        >
          {isCheckingSubscription ? 'Checking...' : (isSubscribed ? 'Already Subscribed' : `Subscribe Browser for User ID: ${targetUserId || '...'}`)}
        </button>

        {statusMessage && (
          <div style={{ ...styles.statusBox, borderColor: getStatusColor() }}>
            <p style={{ ...styles.statusText, color: getStatusColor() }}>{statusMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '10px',
  },
  instructions: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
  },
  inputGroup: {
    marginBottom: '20px',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  buttonDisabled: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#6c757d',
    border: 'none',
    borderRadius: '8px',
    cursor: 'not-allowed',
  },
  statusBox: {
    marginTop: '30px',
    padding: '15px',
    border: '1px solid',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
  },

  statusText: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '500',
  }
};

export default NotificationTester;
