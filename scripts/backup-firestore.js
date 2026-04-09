import admin from 'firebase-admin';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
// Nota: Para usar Firebase Admin necesitas credenciales de servicio
// Por ahora usaremos un enfoque alternativo con el SDK web

console.log('❌ Firebase Admin SDK requiere credenciales de servicio.');
console.log('\n📝 Para hacer backup de Firestore, usa uno de estos métodos:\n');
console.log('1. Exportar desde Firebase Console:');
console.log('   - Ve a https://console.firebase.google.com/project/guerrero-65fa4/firestore');
console.log('   - Haz clic en "Importar/Exportar" en el menú');
console.log('   - Exporta a Cloud Storage Bucket\n');
console.log('2. Usar Firebase CLI (requiere configuración de Cloud Storage):');
console.log('   gcloud config set project guerrero-65fa4');
console.log('   gcloud firestore export gs://guerrero-65fa4.firebasestorage.app/backups\n');
console.log('3. Crear un script web personalizado (más simple para este caso)...\n');
console.log('Creando script web alternativo...\n');

// Crear script alternativo usando fetch desde el navegador
const browserScript = `
// Script para ejecutar en la consola del navegador (Chrome DevTools)
// Abre tu sitio web en: https://familia-guerrero.vercel.app
// Luego abre DevTools (F12) y pega este código en la consola

async function backupFirestore() {
  console.log('🔄 Iniciando backup de Firestore...');

  const { db } = await import('/src/firebase/config.js');
  const { collection, getDocs } = await import('firebase/firestore');

  const backup = {
    timestamp: new Date().toISOString(),
    collections: {}
  };

  // Backup familyMembers
  console.log('📦 Exportando familyMembers...');
  const familySnapshot = await getDocs(collection(db, 'familyMembers'));
  backup.collections.familyMembers = [];
  familySnapshot.forEach(doc => {
    backup.collections.familyMembers.push({ id: doc.id, ...doc.data() });
  });
  console.log(\`✅ \${backup.collections.familyMembers.length} documentos\`);

  // Backup events
  try {
    console.log('📦 Exportando events...');
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    backup.collections.events = [];
    eventsSnapshot.forEach(doc => {
      backup.collections.events.push({ id: doc.id, ...doc.data() });
    });
    console.log(\`✅ \${backup.collections.events.length} documentos\`);
  } catch (e) {
    console.log('⚠️  No hay colección events');
  }

  // Backup quotes
  try {
    console.log('📦 Exportando quotes...');
    const quotesSnapshot = await getDocs(collection(db, 'quotes'));
    backup.collections.quotes = [];
    quotesSnapshot.forEach(doc => {
      backup.collections.quotes.push({ id: doc.id, ...doc.data() });
    });
    console.log(\`✅ \${backup.collections.quotes.length} documentos\`);
  } catch (e) {
    console.log('⚠️  No hay colección quotes');
  }

  // Descargar backup
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = \`firestore-backup-\${timestamp}.json\`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  console.log('✅ Backup descargado:', filename);
  return backup;
}

// Ejecutar backup
backupFirestore();
`;

writeFileSync(
  join(__dirname, 'backup-browser.js'),
  browserScript,
  'utf8'
);

console.log('✅ Script de navegador creado en: scripts/backup-browser.js');
console.log('\n📋 INSTRUCCIONES:');
console.log('1. Abre https://familia-guerrero.vercel.app en Chrome');
console.log('2. Presiona F12 para abrir DevTools');
console.log('3. Ve a la pestaña "Console"');
console.log('4. Copia y pega el contenido de scripts/backup-browser.js');
console.log('5. Presiona Enter');
console.log('6. El backup se descargará automáticamente\n');
