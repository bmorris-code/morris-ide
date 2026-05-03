import type { SecurityIssue, SecurityPattern, SecurityScanResult, SecuritySeverity } from '../../types/security';
import { generateIssueId, SEVERITY_COLORS } from '../../types/security';

// Comprehensive security patterns
const SECURITY_PATTERNS: SecurityPattern[] = [
  // Critical: Code Execution
  {
    id: 'eval-usage',
    name: 'Unsafe eval',
    pattern: /\beval\s*\(/g,
    severity: 'critical',
    message: 'Unsafe eval() usage detected',
    description: 'eval() executes arbitrary code and is a major security risk',
    suggestion: 'Use JSON.parse() for JSON data or Function constructor with caution',
    cweId: 'CWE-95',
  },
  {
    id: 'function-constructor',
    name: 'Function constructor',
    pattern: /new\s+Function\s*\(/g,
    severity: 'high',
    message: 'Function constructor usage detected',
    description: 'Function constructor can execute arbitrary code similar to eval',
    suggestion: 'Avoid dynamic code execution when possible',
    cweId: 'CWE-95',
  },
  // Critical: Hardcoded Secrets
  {
    id: 'hardcoded-api-key',
    name: 'Hardcoded API Key',
    pattern: /(api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi,
    severity: 'critical',
    message: 'Hardcoded API key detected',
    description: 'API keys should not be hardcoded in source code',
    suggestion: 'Use environment variables or a secrets manager',
    cweId: 'CWE-798',
  },
  {
    id: 'hardcoded-password',
    name: 'Hardcoded Password',
    pattern: /(password|passwd|pwd|secret)\s*[:=]\s*['"][^'"]{4,}['"]/gi,
    severity: 'critical',
    message: 'Hardcoded password or secret detected',
    description: 'Passwords and secrets should never be hardcoded',
    suggestion: 'Use environment variables or a secrets manager',
    cweId: 'CWE-798',
  },
  {
    id: 'private-key',
    name: 'Private Key',
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
    severity: 'critical',
    message: 'Private key detected in code',
    description: 'Private keys should never be committed to source code',
    suggestion: 'Store private keys in secure key management systems',
    cweId: 'CWE-321',
  },
  // High: XSS Vulnerabilities
  {
    id: 'innerhtml-assignment',
    name: 'innerHTML Assignment',
    pattern: /\.innerHTML\s*=/g,
    severity: 'high',
    message: 'innerHTML assignment detected',
    description: 'Direct innerHTML assignment can lead to XSS attacks',
    suggestion: 'Use textContent, or sanitize HTML with DOMPurify',
    cweId: 'CWE-79',
  },
  {
    id: 'dangerously-set-html',
    name: 'dangerouslySetInnerHTML',
    pattern: /dangerouslySetInnerHTML/g,
    severity: 'high',
    message: 'dangerouslySetInnerHTML usage detected',
    description: 'Can lead to XSS if content is not properly sanitized',
    suggestion: 'Ensure content is sanitized with DOMPurify before use',
    cweId: 'CWE-79',
  },
  // High: Command Injection
  {
    id: 'exec-command',
    name: 'Command Execution',
    pattern: /\b(exec|execSync|spawn|spawnSync)\s*\(/g,
    severity: 'high',
    message: 'Command execution function detected',
    description: 'Command execution can lead to injection attacks',
    suggestion: 'Validate and sanitize all inputs, use parameterized commands',
    cweId: 'CWE-78',
  },
  // Medium: SQL Injection
  {
    id: 'sql-concatenation',
    name: 'SQL String Concatenation',
    pattern: /(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*\+\s*['"]/gi,
    severity: 'medium',
    message: 'Potential SQL injection via string concatenation',
    description: 'Building SQL queries with string concatenation is dangerous',
    suggestion: 'Use parameterized queries or prepared statements',
    cweId: 'CWE-89',
  },
  // Medium: Insecure Protocols
  {
    id: 'http-url',
    name: 'Insecure HTTP URL',
    pattern: /['"]http:\/\/(?!localhost|127\.0\.0\.1)[^'"]+['"]/g,
    severity: 'medium',
    message: 'Insecure HTTP URL detected',
    description: 'HTTP traffic can be intercepted. Use HTTPS instead',
    suggestion: 'Change http:// to https:// for external URLs',
    cweId: 'CWE-319',
  },
  // Low: Console Logging
  {
    id: 'console-log',
    name: 'Console Log',
    pattern: /console\.(log|debug|info)\s*\(/g,
    severity: 'low',
    message: 'Console logging detected',
    description: 'Console logs should be removed in production',
    suggestion: 'Remove console logs or use a proper logging library',
  },
  // Info: TODO Comments
  {
    id: 'todo-comment',
    name: 'TODO Comment',
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX):/gi,
    severity: 'info',
    message: 'TODO/FIXME comment found',
    description: 'Unresolved TODO comments may indicate incomplete code',
    suggestion: 'Review and address TODO comments before deployment',
  },
];

// Scan a single piece of code
export const securityScan = (
  code: string,
  filePath: string = 'unknown'
): SecurityIssue[] => {
  const issues: SecurityIssue[] = [];
  const lines = code.split('\n');

  for (const pattern of SECURITY_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);

    while ((match = regex.exec(code)) !== null) {
      // Find line number
      const lineIndex = code.substring(0, match.index).split('\n').length - 1;
      const line = lines[lineIndex] || '';
      const column = match.index - code.lastIndexOf('\n', match.index - 1) - 1;

      issues.push({
        id: generateIssueId(),
        severity: pattern.severity,
        message: pattern.message,
        description: pattern.description,
        filePath,
        line: lineIndex + 1,
        column: column + 1,
        code: line.trim(),
        suggestion: pattern.suggestion,
        cweId: pattern.cweId,
      });
    }
  }

  return issues;
};

// Scan multiple files
export const scanProject = (
  files: { path: string; content: string }[]
): SecurityScanResult => {
  const startTime = Date.now();
  const allIssues: SecurityIssue[] = [];

  for (const file of files) {
    const fileIssues = securityScan(file.content, file.path);
    allIssues.push(...fileIssues);
  }

  // Count by severity
  const counts = {
    critical: 0, high: 0, medium: 0, low: 0, info: 0
  };

  for (const issue of allIssues) {
    counts[issue.severity]++;
  }

  return {
    issues: allIssues,
    scannedFiles: files.length,
    totalIssues: allIssues.length,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    infoCount: counts.info,
    scanDuration: Date.now() - startTime,
    timestamp: Date.now(),
  };
};

// Get severity color for UI
export const getSeverityColor = (severity: SecuritySeverity): string => {
  return SEVERITY_COLORS[severity];
};

// Export patterns for testing
export { SECURITY_PATTERNS };