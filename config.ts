
/**
 * Global Configuration for DesignMuse
 * Handles environment variable extraction and sanitization.
 */

// Global constant defined in vite.config.ts as a backup
declare const __VITE_API_URL__: string | undefined;

const getEnv = (key: string): string => {
  // 1. Try URL parameters (highest priority for debugging)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const paramVal = params.get(key);
    if (paramVal) return paramVal;
  }

  // 2. Try standard Vite environment variable
  const viteEnv = (import.meta as any).env?.[key];
  if (viteEnv) return viteEnv;
  
  // 3. Try global define from vite.config.ts
  if (key === 'VITE_API_URL' && typeof __VITE_API_URL__ !== 'undefined' && __VITE_API_URL__) {
    return __VITE_API_URL__;
  }
  
  // 4. Try localStorage override
  if (typeof window !== 'undefined') {
    const localOverride = localStorage.getItem(`DEBUG_${key}`);
    if (localOverride) return localOverride;
  }
  
  return '';
};

export const CONFIG = {
  API_URL: getEnv('VITE_API_URL'),
  MODE: (import.meta as any).env?.MODE || 'development',
  IS_PROD: (import.meta as any).env?.PROD || false,
  
  get API_BASE() {
    if (this.API_URL) {
      const base = this.API_URL.replace(/\/$/, '');
      return base.endsWith('/api') ? base : `${base}/api`;
    }
    // Final fallback for local development
    if (typeof window !== 'undefined' && 
       (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:3001/api';
    }
    return '';
  },

  DIAGNOSTICS: {
    rawViteEnv: (import.meta as any).env?.VITE_API_URL || 'MISSING',
    definedVal: typeof __VITE_API_URL__ !== 'undefined' ? __VITE_API_URL__ : 'NOT_DEFINED',
    urlParam: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('VITE_API_URL') : 'N/A',
    buildTime: new Date().toISOString(),
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
  }
};

export default CONFIG;
