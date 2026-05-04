// Secure storage utility for API keys
export class SecureStorage {
  private static instance: SecureStorage;
  private inMemoryCache: Record<string, string> = {};
  
  private get isElectron(): boolean {
    return typeof window !== 'undefined' &&
           window.electronAPI !== undefined &&
           window.electronAPI.isElectron === true;
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  // Store API key securely
  async setApiKey(provider: string, key: string): Promise<boolean> {
    try {
      // Cache in memory
      this.inMemoryCache[provider] = key;

      if (this.isElectron) {
        // Use Electron's safeStorage for desktop
        try {
          const success = await window.electronAPI?.safeStorage.encrypt(provider, key);
          if (success) {
            return true;
          }
        } catch (electronError) {
          console.warn('Electron safeStorage failed, falling back to localStorage:', electronError);
        }
      }

      // Fallback to encrypted localStorage (for web or if Electron storage fails)
      const encrypted = await this.encrypt(key, this.getStorageKey());
      localStorage.setItem(this.getStorageKey(provider), encrypted);
      return true;
    } catch (error) {
      console.error('Failed to store API key securely:', error);
      return false;
    }
  }

  // Retrieve API key securely
  async getApiKey(provider: string): Promise<string | null> {
    try {
      // Check memory cache first
      if (this.inMemoryCache[provider]) {
        return this.inMemoryCache[provider];
      }

      // Check environment variables first (for development)
      const envKey = this.getEnvKey(provider);
      if (envKey) {
        this.inMemoryCache[provider] = envKey;
        return envKey;
      }

      if (this.isElectron) {
        // Use Electron's safeStorage
        try {
          const key = await window.electronAPI?.safeStorage.decrypt(provider);
          if (key) {
            this.inMemoryCache[provider] = key;
            return key;
          }
        } catch (electronError) {
          console.warn('Electron safeStorage failed, falling back to localStorage:', electronError);
        }
      }

      // Fallback to encrypted localStorage (for web or if Electron storage fails)
      const encrypted = localStorage.getItem(this.getStorageKey(provider));
      if (!encrypted) return null;
      
      const key = await this.decrypt(encrypted, this.getStorageKey());
      if (key) {
        this.inMemoryCache[provider] = key;
        return key;
      }
      return null;
    } catch (error) {
      console.error('Failed to retrieve API key securely:', error);
      return null;
    }
  }

  // Remove API key
  async removeApiKey(provider: string): Promise<boolean> {
    try {
      delete this.inMemoryCache[provider];
      
      if (this.isElectron) {
        return await window.electronAPI?.safeStorage.remove(provider) || false;
      } else {
        localStorage.removeItem(this.getStorageKey(provider));
        return true;
      }
    } catch (error) {
      console.error('Failed to remove API key:', error);
      return false;
    }
  }

  // Clear all API keys
  async clearAllApiKeys(): Promise<boolean> {
    try {
      this.inMemoryCache = {};
      
      if (this.isElectron) {
        return await window.electronAPI?.safeStorage.clear() || false;
      } else {
        // Clear all provider keys from localStorage
        const providers = ['groq', 'moonshot', 'openai'];
        providers.forEach(provider => {
          localStorage.removeItem(this.getStorageKey(provider));
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to clear API keys:', error);
      return false;
    }
  }

  // Check if API key exists
  async hasApiKey(provider: string): Promise<boolean> {
    const key = await this.getApiKey(provider);
    return !!key;
  }

  // Generic storage methods for usage tracking and other data
  async setData(key: string, data: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(data);
      if (this.isElectron) {
        const success = await window.electronAPI?.safeStorage.encrypt(key, serialized);
        return success || false;
      } else {
        localStorage.setItem(key, serialized);
        return true;
      }
    } catch (error) {
      console.error('Failed to store data:', error);
      return false;
    }
  }

  async getData(key: string): Promise<any> {
    try {
      if (this.isElectron) {
        const data = await window.electronAPI?.safeStorage.decrypt(key);
        return data ? JSON.parse(data) : null;
      } else {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  async removeData(key: string): Promise<boolean> {
    try {
      if (this.isElectron) {
        return await window.electronAPI?.safeStorage.remove(key) || false;
      } else {
        localStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      console.error('Failed to remove data:', error);
      return false;
    }
  }

  private getStorageKey(provider?: string): string {
    const base = 'morris_ide_secure';
    return provider ? `${base}_${provider}` : base;
  }

  private getEnvKey(provider: string): string | null {
    const envMap: Record<string, string> = {
      groq: import.meta.env.VITE_GROQ_API_KEY,
      moonshot: import.meta.env.VITE_MOONSHOT_API_KEY,
      openai: import.meta.env.VITE_OPENAI_API_KEY,
      deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY,
    };
    const key = envMap[provider];
    return key && key !== 'gsk_your_actual_groq_api_key_here' && key !== 'sk-your_moonshot_api_key_here' && key !== 'sk-your_openai_api_key_here' && key !== 'sk-your_actual_deepseek_api_key_here' ? key : null;
  }

  // Simple encryption for web storage (not as secure as Electron's safeStorage)
  private async encrypt(text: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const keyData = encoder.encode(key);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );
    
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...result));
  }

  private async decrypt(encryptedText: string, key: string): Promise<string | null> {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(key);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      const data = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }
}

export const secureStorage = SecureStorage.getInstance();
