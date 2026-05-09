import { ChatData } from '../App';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const vaultDbTools = {
  async getItems() {
    if (!auth.currentUser) return [];
    
    const pathForList = `users/${auth.currentUser.uid}/vault`;
    try {
      const q = query(collection(db, pathForList), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const items: {id: string, date: number, data: ChatData}[] = [];
      snapshot.forEach(doc => {
        items.push(doc.data() as {id: string, date: number, data: ChatData});
      });
      return items;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, pathForList);
      return [];
    }
  },
  
  async saveItem(item: {id: string, date: number, data: ChatData}) {
    if (!auth.currentUser) throw new Error("Must be logged in");
    
    const pathForWrite = `users/${auth.currentUser.uid}/vault/${item.id}`;
    try {
      await setDoc(doc(db, `users/${auth.currentUser.uid}/vault`, item.id), item);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, pathForWrite);
    }
  },
  
  async deleteItem(id: string) {
    if (!auth.currentUser) throw new Error("Must be logged in");
    
    const pathForDelete = `users/${auth.currentUser.uid}/vault/${id}`;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/vault`, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, pathForDelete);
    }
  }
};
