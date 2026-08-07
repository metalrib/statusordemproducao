import { ChatMessage, ProductionOrder } from '../types';
import { SAMPLE_ORDERS } from '../data/sampleOrders';
import { sanitizeOrderQuantity } from './nomusParser';

const ORDERS_STORAGE_KEY = 'metalrib_pcp_orders_v2';
const MESSAGES_STORAGE_KEY = 'metalrib_pcp_messages_v2';
const THEME_STORAGE_KEY = 'metalrib_pcp_darkmode';
const FILE_STORAGE_KEY = 'metalrib_pcp_uploaded_file';

export const storage = {
  getOrders(): ProductionOrder[] {
    try {
      const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(sanitizeOrderQuantity);
        }
      }
    } catch (e) {
      console.error('Error reading orders from localStorage', e);
    }
    return SAMPLE_ORDERS.map(sanitizeOrderQuantity);
  },

  saveOrders(orders: ProductionOrder[]): void {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders to localStorage', e);
    }
  },

  getMessages(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading messages from localStorage', e);
    }
    return [];
  },

  saveMessages(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Error saving messages to localStorage', e);
    }
  },

  getDarkMode(): boolean {
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw !== null) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading dark mode state', e);
    }
    return false;
  },

  saveDarkMode(isDark: boolean): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(isDark));
    } catch (e) {
      console.error('Error saving dark mode state', e);
    }
  },

  getUploadedFileName(): string | null {
    return localStorage.getItem(FILE_STORAGE_KEY) || null;
  },

  saveUploadedFileName(name: string): void {
    localStorage.setItem(FILE_STORAGE_KEY, name);
  },

  exportBackupData(): string {
    const backup = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      orders: this.getOrders(),
      messages: this.getMessages(),
      uploadedFile: this.getUploadedFileName(),
    };
    return JSON.stringify(backup, null, 2);
  },

  restoreBackupData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.orders)) {
        this.saveOrders(data.orders);
        if (Array.isArray(data.messages)) {
          this.saveMessages(data.messages);
        }
        if (data.uploadedFile) {
          this.saveUploadedFileName(data.uploadedFile);
        }
        return true;
      }
    } catch (e) {
      console.error('Invalid backup JSON format', e);
    }
    return false;
  },

  resetToSampleData(): void {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
    localStorage.removeItem(FILE_STORAGE_KEY);
  },
};
