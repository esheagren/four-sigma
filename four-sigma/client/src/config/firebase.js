import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  // Add this for authentication

const firebaseConfig = {
  apiKey: "AIzaSyCNg_qa5NK9c-JxvnFOuFAhOXWClcKf5qQ",
  authDomain: "four-sigma2.firebaseapp.com",
  projectId: "four-sigma2",
  storageBucket: "four-sigma2.firebasestorage.app",
  messagingSenderId: "451278547952",
  appId: "1:451278547952:web:b9d9524cfb43ebcb958b35",
  measurementId: "G-TCP3KKRZPQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };