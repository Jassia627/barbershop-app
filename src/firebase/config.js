// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

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

// Inicializar Cloud Messaging (solo en navegadores que lo soportan)
let messaging = null;

// Función asíncrona para inicializar messaging
const initMessaging = async () => {
    try {
        const isSupportedBrowser = await isSupported();
        if (isSupportedBrowser && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            messaging = getMessaging(app);
            console.log('Firebase Messaging inicializado correctamente');
            return messaging;
        } else {
            console.log('Este navegador no soporta Firebase Cloud Messaging');
            return null;
        }
    } catch (error) {
        console.error("Error al inicializar Firebase Messaging:", error);
        return null;
    }
};

// Inicializar messaging inmediatamente si estamos en el navegador
if (typeof window !== 'undefined') {
    initMessaging();
}

// Optional: Set language for auth errors
auth.languageCode = 'es';

export { auth, secondaryAuth, db, storage, messaging, initMessaging, app as default };