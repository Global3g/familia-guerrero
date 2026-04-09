import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export async function backupFirestore() {
  console.log('🔄 Iniciando backup de Firestore...');

  const backup = {
    timestamp: new Date().toISOString(),
    collections: {}
  };

  try {
    // Backup familyMembers
    console.log('📦 Exportando familyMembers...');
    const familySnapshot = await getDocs(collection(db, 'familyMembers'));
    backup.collections.familyMembers = [];
    familySnapshot.forEach(doc => {
      const data = doc.data();
      // Convertir Timestamps de Firebase a strings para JSON
      const cleanData = JSON.parse(JSON.stringify(data));
      backup.collections.familyMembers.push({ id: doc.id, ...cleanData });
    });
    console.log(`   ✅ ${backup.collections.familyMembers.length} documentos exportados`);

    // Backup events
    try {
      console.log('📦 Exportando events...');
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      backup.collections.events = [];
      eventsSnapshot.forEach(doc => {
        const data = doc.data();
        const cleanData = JSON.parse(JSON.stringify(data));
        backup.collections.events.push({ id: doc.id, ...cleanData });
      });
      console.log(`   ✅ ${backup.collections.events.length} documentos exportados`);
    } catch (e) {
      console.log('   ⚠️  Colección events no existe o está vacía');
      backup.collections.events = [];
    }

    // Backup quotes
    try {
      console.log('📦 Exportando quotes...');
      const quotesSnapshot = await getDocs(collection(db, 'quotes'));
      backup.collections.quotes = [];
      quotesSnapshot.forEach(doc => {
        const data = doc.data();
        const cleanData = JSON.parse(JSON.stringify(data));
        backup.collections.quotes.push({ id: doc.id, ...cleanData });
      });
      console.log(`   ✅ ${backup.collections.quotes.length} documentos exportados`);
    } catch (e) {
      console.log('   ⚠️  Colección quotes no existe o está vacía');
      backup.collections.quotes = [];
    }

    // Descargar backup como archivo JSON
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `firestore-backup-${timestamp}.json`;

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Backup completado exitosamente!');
    console.log(`📁 Archivo descargado: ${filename}`);
    console.log(`📊 Total de colecciones: ${Object.keys(backup.collections).length}`);

    return backup;
  } catch (error) {
    console.error('❌ Error durante el backup:', error);
    throw error;
  }
}

// Hacer disponible globalmente para testing desde consola
if (typeof window !== 'undefined') {
  window.backupFirestore = backupFirestore;
}
