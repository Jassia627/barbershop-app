// verificar-permisos.js
// Este script debe ejecutarse con Node.js y Firebase Admin SDK
// Instala las dependencias con: npm install firebase-admin

const admin = require('firebase-admin');
const serviceAccount = require('./ruta-a-tu-archivo-de-credenciales.json'); // Reemplaza con la ruta a tu archivo de credenciales

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Función para verificar y actualizar un usuario
async function verificarYActualizarUsuario(uid) {
  try {
    console.log(`Verificando usuario con UID: ${uid}`);
    
    // Obtener el documento del usuario
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.error(`Error: No se encontró el usuario con UID ${uid}`);
      return;
    }
    
    const userData = userDoc.data();
    console.log('Datos actuales del usuario:', userData);
    
    // Verificar si el usuario tiene el rol de admin
    if (userData.role !== 'admin') {
      console.log(`El usuario no tiene rol de admin. Rol actual: ${userData.role}`);
      
      // Preguntar si desea actualizar el rol
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('¿Deseas actualizar el rol a "admin"? (s/n): ', async (answer) => {
        if (answer.toLowerCase() === 's') {
          await db.collection('users').doc(uid).update({
            role: 'admin'
          });
          console.log('Rol actualizado a "admin" correctamente');
        } else {
          console.log('No se realizaron cambios en el rol');
        }
        readline.close();
      });
    } else {
      console.log('El usuario ya tiene el rol de admin');
      
      // Verificar si el usuario tiene shopId
      if (!userData.shopId) {
        console.log('El usuario no tiene shopId asignado');
        
        // Preguntar si desea asignar un shopId
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        readline.question('Ingresa el ID de la tienda a asignar: ', async (shopId) => {
          if (shopId.trim()) {
            await db.collection('users').doc(uid).update({
              shopId: shopId.trim()
            });
            console.log(`ShopId "${shopId.trim()}" asignado correctamente`);
          } else {
            console.log('No se asignó ningún shopId');
          }
          readline.close();
        });
      } else {
        console.log(`El usuario tiene el shopId: ${userData.shopId}`);
        console.log('Verificación completa. El usuario tiene los permisos correctos.');
      }
    }
  } catch (error) {
    console.error('Error al verificar/actualizar usuario:', error);
  }
}

// Función para listar todos los usuarios
async function listarUsuarios() {
  try {
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No se encontraron usuarios');
      return;
    }
    
    console.log('Lista de usuarios:');
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      console.log(`- UID: ${doc.id}, Email: ${user.email}, Rol: ${user.role}, ShopId: ${user.shopId || 'No asignado'}`);
    });
    
    // Preguntar qué usuario verificar
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Ingresa el UID del usuario a verificar (o "salir" para terminar): ', (uid) => {
      if (uid.toLowerCase() === 'salir') {
        console.log('Operación cancelada');
        readline.close();
        return;
      }
      
      verificarYActualizarUsuario(uid);
      readline.close();
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
  }
}

// Iniciar el script
console.log('=== Herramienta de verificación de permisos ===');
listarUsuarios(); 