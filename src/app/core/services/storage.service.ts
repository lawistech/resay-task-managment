import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private prefix = 'lawis_task_manager_';

  constructor() {}

  /**
   * Set an item in local storage
   * @param key The storage key
   * @param value The value to store
   */
  setItem(key: string, value: string): void {
    localStorage.setItem(this.prefix + key, value);
  }

  /**
   * Get an item from local storage
   * @param key The storage key
   * @returns The stored value or null if not found
   */
  getItem(key: string): string | null {
    return localStorage.getItem(this.prefix + key);
  }

  /**
   * Remove an item from local storage
   * @param key The storage key
   */
  removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Store a JSON object in local storage
   * @param key The storage key
   * @param value The object to store
   */
  setObject(key: string, value: any): void {
    try {
      const jsonValue = JSON.stringify(value);
      this.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing object in localStorage:', error);
    }
  }

  /**
   * Get a JSON object from local storage
   * @param key The storage key
   * @returns The parsed object or null if not found or on error
   */
  getObject<T>(key: string): T | null {
    try {
      const value = this.getItem(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving object from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear all app-specific items from local storage
   */
  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}