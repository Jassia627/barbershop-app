// Copia y pega este código en la consola del navegador para verificar el estado del usuario

(async function verificarUsuario() {
  try {
    // Obtener el usuario actual
    const auth = firebase.auth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error("No hay usuario autenticado");
      return;
    }
    
    console.log("Usuario autenticado:", {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
    
    // Obtener datos adicionales del usuario desde Firestore
    const db = firebase.firestore();
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      console.error("El documento del usuario no existe en Firestore");
      return;
    }
    
    const userData = userDoc.data();
    console.log("Datos del usuario en Firestore:", userData);
    
    // Verificar el rol
    if (userData.role !== 'admin') {
      console.error(`El usuario tiene rol '${userData.role}', no 'admin'`);
    } else {
      console.log("✅ El usuario tiene rol 'admin'");
    }
    
    // Verificar shopId
    if (!userData.shopId) {
      console.error("El usuario no tiene shopId asignado");
    } else {
      console.log(`✅ El usuario tiene shopId: ${userData.shopId}`);
    }
    
    // Intentar acceder a la colección de inventario
    try {
      const inventoryQuery = await db.collection('inventory')
        .where('shopId', '==', userData.shopId)
        .limit(1)
        .get();
      
      console.log(`✅ Acceso a la colección 'inventory' exitoso. Documentos encontrados: ${inventoryQuery.docs.length}`);
    } catch (error) {
      console.error("❌ Error al acceder a la colección 'inventory':", error);
    }
    
  } catch (error) {
    console.error("Error al verificar usuario:", error);
  }
})(); 