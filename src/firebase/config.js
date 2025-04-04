// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyB2xtx9PNSs_yAFice9jbkxzdahzzf3yoY",
    authDomain: "barbershop-9810d.firebaseapp.com",
    projectId: "barbershop-9810d",
    storageBucket: "barbershop-9810d.appspot.com",
    messagingSenderId: "678061957866",
    appId: "1:678061957866:web:9cd1c7e7742451f4186d93",
    measurementId: "G-5Q1DXP7L23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Crear una segunda instancia para el registro de barberos
const secondaryApp = initializeApp(firebaseConfig, 'secondary');

// Initialize services
const auth = getAuth(app);
const secondaryAuth = getAuth(secondaryApp);
const db = getFirestore(app);
const storage = getStorage(app);

// Optional: Set language for auth errors
auth.languageCode = 'es';

export { auth, secondaryAuth, db, storage, app as default };