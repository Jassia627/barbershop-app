// src/core/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyB2xtx9PNSs_yAFice9jbkxzdahzzf3yoY",
  authDomain: "barbershop-9810d.firebaseapp.com",
  projectId: "barbershop-9810d",
  storageBucket: "barbershop-9810d.appspot.com",
  messagingSenderId: "678061957866",
  appId: "1:678061957866:web:9cd1c7e7742451f4186d93",
  measurementId: "G-5Q1DXP7L23"
};

const app = initializeApp(firebaseConfig);
console.log("Firebase: App inicializado", app);

const secondaryApp = initializeApp(firebaseConfig, 'secondary');

const auth = getAuth(app);
const secondaryAuth = getAuth(secondaryApp);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Inicializar Firebase Cloud Messaging solo si es compatible
let messaging = null;
isSupported().then(isSupported => {
  if (isSupported) {
    try {
      messaging = getMessaging(app);
      console.log("Firebase: Messaging inicializado");
    } catch (error) {
      console.error("Firebase: Error al inicializar Messaging", error);
    }
  } else {
    console.log("Firebase: Messaging no es compatible en este navegador");
  }
}).catch(error => {
  console.error("Firebase: Error al verificar compatibilidad de Messaging", error);
});

auth.languageCode = 'es';

export { auth, secondaryAuth, db, storage, messaging, functions, app as default };