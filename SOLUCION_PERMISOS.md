# Solución para el problema de permisos en Firestore

## Problema detectado

El usuario con rol "admin" no puede acceder a la colección de productos debido a un problema con las reglas de seguridad de Firestore. El error específico es:

```
Error de permisos: El usuario juan123@gmail.com (admin) no tiene acceso a la colección de productos
```

## Información del usuario

- **Email**: juan123@gmail.com
- **Rol**: admin
- **ID de tienda**: q91AhML14DXvpvO6BkJ9Nh5naEk1
- **UID**: q91AhML14DXvpvO6BkJ9Nh5naEk1

## Causas posibles

1. **Reglas de seguridad restrictivas**: Las reglas actuales requieren que el `shopId` del usuario coincida exactamente con el `shopId` del producto.
2. **Problema con la verificación inicial**: Al listar productos, Firestore no puede evaluar `resource.data.shopId` porque aún no hay un recurso específico.
3. **Inconsistencia en los datos**: El `shopId` en los documentos de productos puede no coincidir con el `shopId` en el documento de usuario.

## Soluciones implementadas

### 1. Modificación de las reglas de seguridad de Firestore

Hemos actualizado las reglas para permitir que los administradores accedan a todos los productos, independientemente del `shopId`:

```javascript
// Reglas para la colección de productos (inventario)
match /products/{productId} {
  // Los administradores pueden leer y escribir todos los productos
  allow read, write: if isAdmin();
  
  // Los usuarios no administradores solo pueden leer productos de su tienda
  allow read: if isAuthenticated() && !isAdmin() && 
              (resource == null || belongsToShop(resource.data.shopId));
}
```

### 2. Mejoras en el hook useInventory

Hemos mejorado el hook para:
- Manejar mejor la verificación del rol de administrador
- Proporcionar más información de depuración
- Manejar correctamente los casos en que el usuario no tiene `shopId`

### 3. Mejoras en el servicio de inventario

Hemos mejorado el servicio para:
- Validar los datos antes de realizar operaciones
- Proporcionar más información de depuración
- Manejar mejor los errores

## Pasos para implementar la solución

### 1. Actualizar las reglas de seguridad de Firestore

1. Ve a la [consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a "Firestore Database" > "Rules"
4. Reemplaza las reglas actuales con las nuevas reglas proporcionadas en el archivo `firestore.rules`
5. Haz clic en "Publicar"

### 2. Verificar y actualizar el rol de usuario

Puedes usar el script `verificar-permisos.js` para verificar y actualizar el rol de usuario:

1. Instala las dependencias:
   ```
   npm install firebase-admin
   ```

2. Descarga el archivo de credenciales de servicio:
   - Ve a la consola de Firebase > Configuración del proyecto > Cuentas de servicio
   - Haz clic en "Generar nueva clave privada"
   - Guarda el archivo JSON en un lugar seguro

3. Actualiza la ruta al archivo de credenciales en el script:
   ```javascript
   const serviceAccount = require('./ruta-a-tu-archivo-de-credenciales.json');
   ```

4. Ejecuta el script:
   ```
   node verificar-permisos.js
   ```

5. Sigue las instrucciones para verificar y actualizar el usuario

### 3. Actualizar el código de la aplicación

1. Actualiza el archivo `src/modules/inventory/hooks/useInventory.js` con el nuevo código
2. Actualiza el archivo `src/modules/inventory/services/inventoryService.js` con el nuevo código

## Verificación

Después de implementar estas soluciones, deberías poder:

1. Acceder a la página de inventario sin errores de permisos
2. Ver la lista de productos
3. Agregar, editar y eliminar productos

## Solución de problemas adicionales

Si sigues experimentando problemas:

1. **Verifica la consola del navegador** para ver mensajes de error detallados
2. **Verifica que el usuario tenga el rol correcto** en la base de datos
3. **Asegúrate de que los productos tengan el `shopId` correcto** en la base de datos
4. **Verifica que las reglas de seguridad se hayan publicado correctamente** en Firestore

## Contacto para soporte

Si necesitas ayuda adicional, contacta al equipo de desarrollo en [soporte@tuempresa.com](mailto:soporte@tuempresa.com). 