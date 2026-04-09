# Guía de Backup de Firestore

Este documento explica cómo hacer backup de la base de datos Firestore del proyecto Familia Guerrero.

## 🚀 Método Rápido (Recomendado)

### Desde el Navegador

1. **Abre tu sitio web**: https://familia-guerrero.vercel.app
2. **Abre la consola del navegador**:
   - Chrome/Edge: Presiona `F12` o `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - Firefox: Presiona `F12` o `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - Safari: Presiona `Cmd+Option+C`
3. **Pega este comando en la consola**:
   ```javascript
   backupFirestore()
   ```
4. **Presiona Enter**
5. El backup se descargará automáticamente como archivo JSON

El archivo descargado contendrá todas las colecciones:
- `familyMembers` - Todos los miembros de la familia
- `events` - Eventos familiares
- `quotes` - Frases de la familia

## 📋 Métodos Alternativos

### Desde Firebase Console

1. Ve a: https://console.firebase.google.com/project/guerrero-65fa4/firestore
2. Haz clic en "Importar/Exportar" en el menú superior
3. Selecciona "Exportar"
4. Elige tu bucket de Cloud Storage: `guerrero-65fa4.firebasestorage.app`
5. Haz clic en "Exportar"

**Nota**: Este método requiere tener configurado Cloud Storage.

### Usando Firebase CLI

Si tienes acceso a la línea de comandos y permisos de administrador:

```bash
# Configurar proyecto
gcloud config set project guerrero-65fa4

# Exportar a Cloud Storage
gcloud firestore export gs://guerrero-65fa4.firebasestorage.app/backups/$(date +%Y-%m-%d)
```

## 📅 Recomendaciones

- **Frecuencia**: Haz backup al menos una vez por semana
- **Antes de cambios importantes**: Siempre haz backup antes de editar muchos datos
- **Almacenamiento**: Guarda los backups en Google Drive o Dropbox
- **Nombrado**: Los archivos se guardan con timestamp: `firestore-backup-2026-04-09T15-30-00.json`

## 🔄 Restaurar Backup

Para restaurar un backup, necesitarás:

1. El archivo JSON del backup
2. Acceso a Firebase Console o permisos de administrador
3. Contactar al desarrollador para ejecutar el script de restauración

**⚠️ IMPORTANTE**: La restauración sobrescribe datos existentes. Úsalo con precaución.

## 🆘 Soporte

Si tienes problemas con el backup:
1. Verifica que estés logueado en el sitio web
2. Revisa que la consola no muestre errores en rojo
3. Intenta refrescar la página (Ctrl+F5 / Cmd+Shift+R)
4. Si persiste el problema, contacta al desarrollador
