import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Tu configuración de Firebase
// Puedes obtener esto desde la consola de Firebase:
// 1. Ve a la consola de Firebase (https://console.firebase.google.com)
// 2. Selecciona tu proyecto
// 3. Ve a Configuración del proyecto (el ícono de engranaje)
// 4. En la sección "Tus apps", selecciona el ícono de web (</>)
// 5. Registra tu app y copia la configuración
const firebaseConfig = {
    apiKey: "AIzaSyBYM1EErQ8zzDBFh34rRtsDR2lSDnPFtTI",
    authDomain: "nursecourse-952a4.firebaseapp.com",
    projectId: "nursecourse-952a4",
    storageBucket: "nursecourse-952a4.appspot.com",
    messagingSenderId: "509214863418",
    appId: "1:509214863418:android:fad27c370723bdbadc4503"
  };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener instancia de Storage
export const storage = getStorage(app); 