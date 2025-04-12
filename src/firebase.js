
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyB5KoprNyVlF1AFDqgbZRfp78xUL_IzfUI",
    authDomain: "sbh-proj.firebaseapp.com",
    projectId: "sbh-proj",
    storageBucket: "sbh-proj.firebasestorage.app",
    messagingSenderId: "400233085252",
    appId: "1:400233085252:web:73de3e1a7bccb49834bf11"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebase Authentication

export { auth }; // Export auth instance