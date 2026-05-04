import { logger } from '../../utils/logger';
import { secureStorage } from '../../utils/secureStorage';

// Privacy settings interface
export interface PrivacySettings {
  warnBeforeSending: boolean;
  anonymizeData: boolean;
  excludePatterns: string[];
  sensitiveKeywords: string[];
  enablePrivacyMode: boolean;
}

// Default privacy settings
const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  warnBeforeSending: true,
  anonymizeData: false,
  excludePatterns: [
    '*.pem',
    '*.key',
    '*.p12',
    '*.pfx',
    'id_rsa',
    'id_ed25519',
    '*.env',
    '.env.local',
    '.env.production',
    'secrets.json',
    'config/secrets.json'
  ],
  sensitiveKeywords: [
    'password',
    'secret',
    'token',
    'api_key',
    'private_key',
    'access_token',
    'refresh_token',
    'credential',
    'auth_key',
    'jwt_secret',
    'database_url',
    'connection_string'
  ],
  enablePrivacyMode: false
};

export class PrivacyGuard {
  private static instance: PrivacyGuard;
  private settings: PrivacySettings;

  static getInstance(): PrivacyGuard {
    if (!PrivacyGuard.instance) {
      PrivacyGuard.instance = new PrivacyGuard();
    }
    return PrivacyGuard.instance;
  }

  constructor() {
    this.settings = { ...DEFAULT_PRIVACY_SETTINGS };
    this.loadSettings();
  }

  // Load privacy settings from storage
  private async loadSettings(): Promise<void> {
    try {
      const stored = await secureStorage.getData('privacy_settings');
      if (stored) {
        this.settings = { ...DEFAULT_PRIVACY_SETTINGS, ...stored };
      }
    } catch (error) {
      logger.warn('Failed to load privacy settings, using defaults', 'Privacy', { error });
    }
  }

  // Save privacy settings
  async saveSettings(): Promise<void> {
    try {
      await secureStorage.setData('privacy_settings', this.settings);
      logger.info('Privacy settings saved', 'Privacy');
    } catch (error) {
      logger.error('Failed to save privacy settings', 'Privacy', { error });
    }
  }

  // Get current settings
  getSettings(): PrivacySettings {
    return { ...this.settings };
  }

  // Update settings
  async updateSettings(updates: Partial<PrivacySettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    await this.saveSettings();
  }

  // Check if file path should be excluded
  shouldExcludeFile(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    return this.settings.excludePatterns.some(pattern => {
      // Simple glob pattern matching
      const regex = new RegExp(
        pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.')
      );
      
      return regex.test(normalizedPath);
    });
  }

  // Detect sensitive content in code
  detectSensitiveContent(code: string): { detected: boolean; issues: string[] } {
    const issues: string[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      
      // Check for sensitive keywords
      for (const keyword of this.settings.sensitiveKeywords) {
        if (lowerLine.includes(keyword)) {
          // Additional check for actual values (not just variable names)
          const hasValue = line.includes('=') && line.includes('"') || line.includes("'");
          if (hasValue) {
            issues.push(`Line ${index + 1}: Potential ${keyword} detected`);
          }
        }
      }

      // Check for base64 encoded data (might be secrets)
      const base64Pattern = /[A-Za-z0-9+/]{40,}={0,2}/;
      if (base64Pattern.test(line) && line.length > 50) {
        issues.push(`Line ${index + 1}: Potential base64 encoded data`);
      }

      // Check for hex strings that might be keys
      const hexPattern = /[0-9a-fA-F]{32,}/;
      if (hexPattern.test(line) && !line.includes('color') && !line.includes('#')) {
        issues.push(`Line ${index + 1}: Potential hex key/data`);
      }
    });

    return {
      detected: issues.length > 0,
      issues
    };
  }

  // Anonymize sensitive data
  anonymizeCode(code: string): string {
    if (!this.settings.anonymizeData) {
      return code;
    }

    let anonymized = code;
    const lines = anonymized.split('\n');

    const anonymizedLines = lines.map(line => {
      let newLine = line;

      // Replace email addresses
      newLine = newLine.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'email@example.com');

      // Replace IP addresses
      newLine = newLine.replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, 'xxx.xxx.xxx.xxx');

      // Replace URLs with domain
      newLine = newLine.replace(/https?:\/\/[^\s]+/g, 'https://example.com');

      // Replace potential API keys (keep format but change content)
      newLine = newLine.replace(/(sk-[a-zA-Z0-9]+)/g, 'sk-xxxxxxxxxxxx');
      newLine = newLine.replace(/(gsk_[a-zA-Z0-9]+)/g, 'gsk_xxxxxxxxxxxx');

      // Replace passwords/tokens in quotes
      newLine = newLine.replace(/(["'])(password|secret|token|key)["']\s*:\s*["'][^"']+["']/gi, '$1$2$3: "********"');

      return newLine;
    });

    return anonymizedLines.join('\n');
  }

  // Process code before sending to AI
  async processCodeForAI(
    filePath: string,
    code: string,
    selectedCode?: string
  ): Promise<{
    processedCode: string;
    processedSelectedCode?: string;
    warnings: string[];
    shouldProceed: boolean;
  }> {
    const warnings: string[] = [];
    let shouldProceed = true;

    // Check if file should be excluded
    if (this.shouldExcludeFile(filePath)) {
      warnings.push(`File excluded by privacy settings: ${filePath}`);
      return {
        processedCode: '// File excluded for privacy reasons',
        warnings,
        shouldProceed: false
      };
    }

    // Detect sensitive content
    const fullCodeCheck = this.detectSensitiveContent(code);
    if (fullCodeCheck.detected) {
      warnings.push(`Sensitive content detected in full file: ${fullCodeCheck.issues.join(', ')}`);
      
      if (this.settings.enablePrivacyMode) {
        code = this.anonymizeCode(code);
        warnings.push('Sensitive content has been anonymized');
      }
    }

    // Check selected code separately
    let processedSelectedCode = selectedCode;
    if (selectedCode) {
      const selectedCheck = this.detectSensitiveContent(selectedCode);
      if (selectedCheck.detected) {
        warnings.push(`Sensitive content detected in selection: ${selectedCheck.issues.join(', ')}`);
        
        if (this.settings.enablePrivacyMode) {
          processedSelectedCode = this.anonymizeCode(selectedCode);
          warnings.push('Selected content has been anonymized');
        }
      }
    }

    // Privacy warning before sending
    if (this.settings.warnBeforeSending && warnings.length > 0) {
      shouldProceed = false; // Require user confirmation
      warnings.push('⚠️ Privacy warning: Review sensitive content before sending');
    }

    return {
      processedCode: code,
      processedSelectedCode,
      warnings,
      shouldProceed
    };
  }

  // Generate privacy warning message
  generatePrivacyWarning(warnings: string[]): string {
    return `
🔒 Privacy Notice

Your code contains potentially sensitive information:
${warnings.map(w => `• ${w}`).join('\n')}

Before sending to AI:
• Review the content above
• Remove any sensitive information
• Consider enabling anonymization in settings

Options:
• Proceed anyway (not recommended for sensitive data)
• Cancel and review code
• Enable privacy mode to auto-anonymize

Remember: Code sent to AI services leaves your machine and is processed by external servers.
    `.trim();
  }
}

export const privacyGuard = PrivacyGuard.getInstance();
