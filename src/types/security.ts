// Security Types for Morris IDE

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityIssue {
  id: string;
  severity: SecuritySeverity;
  message: string;
  description: string;
  filePath: string;
  line: number;
  column: number;
  code: string;
  suggestion?: string;
  cweId?: string;
}

export interface SecurityScanResult {
  issues: SecurityIssue[];
  scannedFiles: number;
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  scanDuration: number;
  timestamp: number;
}

export interface SecurityPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: SecuritySeverity;
  message: string;
  description: string;
  suggestion: string;
  cweId?: string;
  languages?: string[];
}

export interface SecurityState {
  lastScan: SecurityScanResult | null;
  isScanning: boolean;
  autoScan: boolean;
  ignoredIssues: string[];
}

// Severity colors for UI
export const SEVERITY_COLORS: Record<SecuritySeverity, string> = {
  critical: '#ef4444', // red-500
  high: '#f97316',     // orange-500
  medium: '#eab308',   // yellow-500
  low: '#3b82f6',      // blue-500
  info: '#6b7280',     // gray-500
};

// Severity icons for UI
export const SEVERITY_ICONS: Record<SecuritySeverity, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
  info: 'ℹ️',
};

// Generate unique issue ID
export const generateIssueId = (): string => {
  return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
