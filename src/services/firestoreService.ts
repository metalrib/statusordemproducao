import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProductionOrder, ChatMessage } from '../types';

const ORDERS_COLLECTION = 'orders';
const MESSAGES_COLLECTION = 'messages';

// Helper to sanitize document IDs (slashes are forbidden in Firestore doc IDs)
function sanitizeDocId(id: string): string {
  return id ? id.replace(/\//g, '_') : Date.now().toString(36);
}

/**
 * Real-time listener for Orders collection.
 * Triggers callback whenever orders change in Firestore from any client (PCP or Produção).
 */
export function subscribeToOrders(
  callback: (orders: ProductionOrder[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, ORDERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const orders: ProductionOrder[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ProductionOrder;
        orders.push(data);
      });
      callback(orders);
    },
    (err) => {
      console.error('Error listening to Firestore orders:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for Messages collection.
 * Triggers callback whenever chat messages change in Firestore from any client.
 */
export function subscribeToMessages(
  callback: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, MESSAGES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ChatMessage;
        messages.push(data);
      });
      // Sort messages by timestamp ascending
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(messages);
    },
    (err) => {
      console.error('Error listening to Firestore messages:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Saves or updates a single order in Firestore.
 */
export async function saveOrderToFirestore(order: ProductionOrder): Promise<void> {
  try {
    const docId = sanitizeDocId(order.id);
    const docRef = doc(db, ORDERS_COLLECTION, docId);
    await setDoc(docRef, order, { merge: true });
  } catch (err) {
    console.error('Failed to save order to Firestore:', err);
  }
}

/**
 * Batch saves multiple orders (e.g., after Nomus ERP import or full sync).
 */
export async function saveOrdersBatchToFirestore(orders: ProductionOrder[]): Promise<void> {
  try {
    const batchSize = 400; // Firestore limit is 500
    for (let i = 0; i < orders.length; i += batchSize) {
      const chunk = orders.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((order) => {
        const docId = sanitizeDocId(order.id);
        const docRef = doc(db, ORDERS_COLLECTION, docId);
        batch.set(docRef, order, { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to batch save orders to Firestore:', err);
  }
}

/**
 * Saves or updates a chat message in Firestore.
 */
export async function saveMessageToFirestore(message: ChatMessage): Promise<void> {
  try {
    const docId = sanitizeDocId(message.id);
    const docRef = doc(db, MESSAGES_COLLECTION, docId);
    await setDoc(docRef, message, { merge: true });
  } catch (err) {
    console.error('Failed to save message to Firestore:', err);
  }
}

/**
 * Deletes a chat message from Firestore.
 */
export async function deleteMessageFromFirestore(messageId: string): Promise<void> {
  try {
    const docId = sanitizeDocId(messageId);
    const docRef = doc(db, MESSAGES_COLLECTION, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete message from Firestore:', err);
  }
}

/**
 * Seeds initial sample data to Firestore if the orders collection is empty.
 */
export async function seedInitialFirestoreData(
  sampleOrders: ProductionOrder[],
  sampleMessages: ChatMessage[] = []
): Promise<void> {
  try {
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const snapshot = await getDocs(query(ordersCol));
    if (snapshot.empty && sampleOrders.length > 0) {
      console.log('Firestore orders collection is empty. Seeding initial data...');
      await saveOrdersBatchToFirestore(sampleOrders);

      if (sampleMessages.length > 0) {
        for (const msg of sampleMessages) {
          await saveMessageToFirestore(msg);
        }
      }
    }
  } catch (err) {
    console.error('Failed to seed initial Firestore data:', err);
  }
}
