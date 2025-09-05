import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { subscribeToTopic } from "@/app/announcements/actions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = firebaseConfig.projectId && !getApps().length ? initializeApp(firebaseConfig) : getApps().length > 0 ? getApp() : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;
const messaging = app && typeof window !== 'undefined' ? getMessaging(app) : null;

if (db) {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one.
        console.warn('Firestore persistence failed: multiple tabs open.');
      } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firestore persistence not available in this browser.');
      }
    });
}

export const requestNotificationPermission = async () => {
  if (!messaging || !auth) {
    console.log("Firebase messaging or auth is not initialized.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const fcmToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
      
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          await subscribeToTopic(idToken, fcmToken);
        }
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
};

if (messaging) {
    onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // You can handle foreground messages here, e.g., by showing a custom toast notification.
    });
}


export { app, db, auth, messaging };
