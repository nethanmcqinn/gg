import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut 
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account' // Always show account picker
});

/**
 * Sign in with Google popup
 * @returns {Promise<Object>} Firebase user credential
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Get the ID token from Firebase
    const idToken = await result.user.getIdToken();
    
    return {
      user: result.user,
      idToken,
      credential: GoogleAuthProvider.credentialFromResult(result)
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

/**
 * Sign out from Firebase
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Get current Firebase user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

export { auth, googleProvider };
export default app;
