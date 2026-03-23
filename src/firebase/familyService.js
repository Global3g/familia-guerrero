import { db, storage } from './config'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// ── Grandparents ──────────────────────────────────────────────

export async function getGrandparents() {
  try {
    const snap = await getDoc(doc(db, 'grandparents', 'main'))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (error) {
    console.error('Error getting grandparents:', error)
    return null
  }
}

export async function saveGrandparents(data) {
  try {
    await setDoc(doc(db, 'grandparents', 'main'), data, { merge: true })
    return true
  } catch (error) {
    console.error('Error saving grandparents:', error)
    return false
  }
}

// ── Family Members ────────────────────────────────────────────

export async function getFamilyMembers() {
  try {
    const q = query(collection(db, 'familyMembers'), orderBy('name'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('Error getting family members:', error)
    return []
  }
}

export async function saveFamilyMember(id, data) {
  try {
    const docId = id || doc(collection(db, 'familyMembers')).id
    await setDoc(doc(db, 'familyMembers', docId), data, { merge: true })
    return docId
  } catch (error) {
    console.error('Error saving family member:', error)
    return null
  }
}

export async function deleteFamilyMember(id) {
  try {
    await deleteDoc(doc(db, 'familyMembers', id))
    return true
  } catch (error) {
    console.error('Error deleting family member:', error)
    return false
  }
}

// ── Photo Upload ──────────────────────────────────────────────

export async function uploadPhoto(file, path) {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error('Error uploading photo:', error)
    return null
  }
}

// ── Timeline Events ───────────────────────────────────────────

export async function getTimelineEvents() {
  try {
    const q = query(collection(db, 'timelineEvents'), orderBy('date'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('Error getting timeline events:', error)
    return []
  }
}

export async function saveTimelineEvent(id, data) {
  try {
    const docId = id || doc(collection(db, 'timelineEvents')).id
    await setDoc(doc(db, 'timelineEvents', docId), data, { merge: true })
    return docId
  } catch (error) {
    console.error('Error saving timeline event:', error)
    return null
  }
}

export async function deleteTimelineEvent(id) {
  try {
    await deleteDoc(doc(db, 'timelineEvents', id))
    return true
  } catch (error) {
    console.error('Error deleting timeline event:', error)
    return false
  }
}

// ── Gallery Photos ───────────────────────────────────────────

export async function getGalleryPhotos() {
  try {
    const q = query(collection(db, 'galleryPhotos'), orderBy('year'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('Error getting gallery photos:', error)
    return []
  }
}

export async function saveGalleryPhoto(id, data) {
  try {
    const docId = id || doc(collection(db, 'galleryPhotos')).id
    await setDoc(doc(db, 'galleryPhotos', docId), data, { merge: true })
    return docId
  } catch (error) {
    console.error('Error saving gallery photo:', error)
    return null
  }
}

export async function deleteGalleryPhoto(id) {
  try {
    await deleteDoc(doc(db, 'galleryPhotos', id))
    return true
  } catch (error) {
    console.error('Error deleting gallery photo:', error)
    return false
  }
}

// ── Upcoming Events ──────────────────────────────────────────

export async function getUpcomingEvents() {
  try {
    const q = query(collection(db, 'upcomingEvents'), orderBy('date'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('Error getting upcoming events:', error)
    return []
  }
}

export async function saveUpcomingEvent(id, data) {
  try {
    const docId = id || doc(collection(db, 'upcomingEvents')).id
    await setDoc(doc(db, 'upcomingEvents', docId), data, { merge: true })
    return docId
  } catch (error) {
    console.error('Error saving upcoming event:', error)
    return null
  }
}

export async function deleteUpcomingEvent(id) {
  try {
    await deleteDoc(doc(db, 'upcomingEvents', id))
    return true
  } catch (error) {
    console.error('Error deleting upcoming event:', error)
    return false
  }
}

// ── Memorials ────────────────────────────────────────────────

export async function getMemorials() {
  try {
    const snap = await getDocs(collection(db, 'memorials'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('Error getting memorials:', error)
    return []
  }
}

export async function saveMemorial(id, data) {
  try {
    const docId = id || doc(collection(db, 'memorials')).id
    await setDoc(doc(db, 'memorials', docId), data, { merge: true })
    return docId
  } catch (error) {
    console.error('Error saving memorial:', error)
    return null
  }
}

export async function deleteMemorial(id) {
  try {
    await deleteDoc(doc(db, 'memorials', id))
    return true
  } catch (error) {
    console.error('Error deleting memorial:', error)
    return false
  }
}
