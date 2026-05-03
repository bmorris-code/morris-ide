import type { CodeContext } from '../../types/ai';
import { logger } from '../../utils/logger';

// Token estimation: ~4 chars per token on average
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

// File relevance scoring for context prioritization
interface FileScore {
  path: string;
  content: string;
  relevance: number;
  tokenCount: number;
}

// Calculate file relevance based on imports and exports
const calculateRelevance = (
  filePath: string,
  fileContent: string,
  currentFilePath: string
): number => {
  let score = 0;
  const normalizedCurrent = currentFilePath.replace(/\\/g, '/');
  const normalizedFile = filePath.replace(/\\/g, '/');

  // Same directory bonus
  const currentDir = normalizedCurrent.substring(0, normalizedCurrent.lastIndexOf('/'));
  const fileDir = normalizedFile.substring(0, normalizedFile.lastIndexOf('/'));
  if (currentDir === fileDir) score += 50;

  // Check for imports referencing current file
  const currentFileName = normalizedCurrent.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
  if (fileContent.includes(currentFileName)) score += 30;

  // Check if current file imports this file
  // (simplified - in production, you'd analyze imports across all files)

  // Language similarity bonus
  const currentExt = normalizedCurrent.split('.').pop();
  const fileExt = normalizedFile.split('.').pop();
  if (currentExt === fileExt) score += 20;

  // Config and type definition files are often relevant
  if (normalizedFile.includes('types') || normalizedFile.includes('interface')) score += 25;
  if (normalizedFile.includes('config')) score += 15;
  if (normalizedFile.includes('utils') || normalizedFile.includes('helpers')) score += 10;

  return score;
};

// Build project-wide context for Kimi's 2M token window
export interface ProjectContext {
  context: string;
  includedFiles: string[];
  totalTokens: number;
  remainingTokens: number;
}

export const buildProjectContext = async (
  files: { path: string; content: string }[],
  currentFilePath: string,
  maxTokens: number = 2000000
): Promise<ProjectContext> => {
  const startTime = Date.now();
  logger.info('Building project context', 'AI', { fileCount: files.length, maxTokens });

  // Score and sort all files by relevance
  const scoredFiles: FileScore[] = files.map(file => {
    const tokenCount = estimateTokens(file.content);
    const relevance = calculateRelevance(file.path, file.content, currentFilePath);
    
    return {
      path: file.path,
      content: file.content,
      relevance,
      tokenCount
    };
  });

  // Sort by relevance (descending)
  scoredFiles.sort((a, b) => b.relevance - a.relevance);

  // Build context, fitting within token limit (leave 20% for response)
  const availableTokens = Math.floor(maxTokens * 0.8);
  let totalTokens = 0;
  const includedFiles: string[] = [];
  const contextParts: string[] = [];

  // Always include current file first if it exists
  const currentFileIndex = scoredFiles.findIndex(f => 
    f.path.replace(/\\/g, '/') === currentFilePath.replace(/\\/g, '/')
  );
  
  if (currentFileIndex !== -1) {
    const currentFile = scoredFiles.splice(currentFileIndex, 1)[0];
    totalTokens += currentFile.tokenCount;
    includedFiles.push(currentFile.path);
    contextParts.push(`// Current File: ${currentFile.path}\n${currentFile.content}`);
  }

  // Add other files by relevance until we hit the limit
  for (const file of scoredFiles) {
    // Skip very large files that would consume too much context
    if (file.tokenCount > availableTokens * 0.3) {
      logger.info('Skipping large file', 'AI', { path: file.path, tokens: file.tokenCount });
      continue;
    }

    if (totalTokens + file.tokenCount > availableTokens) {
      break;
    }

    totalTokens += file.tokenCount;
    includedFiles.push(file.path);
    contextParts.push(`// File: ${file.path}\n${file.content}`);
  }

  const result: ProjectContext = {
    context: contextParts.join('\n\n'),
    includedFiles,
    totalTokens,
    remainingTokens: maxTokens - totalTokens
  };

  logger.info('Project context built', 'AI', {
    duration: Date.now() - startTime,
    includedFiles: includedFiles.length,
    totalTokens,
    remainingTokens: result.remainingTokens
  });

  return result;
};

// Get context for specific code with project awareness
export const buildEnhancedCodeContext = async (
  baseContext: CodeContext,
  projectFiles?: { path: string; content: string }[],
  maxContextTokens: number = 100000 // 100K tokens for context
): Promise<{ contextMessage: string; tokenCount: number }> => {
  const parts: string[] = [];
  let totalTokens = 0;

  // Add project context if available and using Kimi (2M tokens)
  if (projectFiles && projectFiles.length > 0 && maxContextTokens > 50000) {
    const projectContext = await buildProjectContext(
      projectFiles,
      baseContext.filePath,
      maxContextTokens
    );

    if (projectContext.includedFiles.length > 1) {
      parts.push('📁 **Project Context:**');
      parts.push(`This codebase contains ${projectContext.includedFiles.length} files.`);
      parts.push(`Using ${projectContext.totalTokens.toLocaleString()} of ${maxContextTokens.toLocaleString()} available tokens.`);
      parts.push('');
      parts.push(projectContext.context);
      parts.push('');
      parts.push('---');
      parts.push('');
      totalTokens += projectContext.totalTokens;
    }
  }

  // Add current file context
  parts.push(`🎯 **Current File:** ${baseContext.fileName}`);
  parts.push(`📂 Path: ${baseContext.filePath}`);
  parts.push(`🔤 Language: ${baseContext.language}`);

  if (baseContext.cursorLine) {
    parts.push(`🎯 Cursor: Line ${baseContext.cursorLine}`);
  }

  if (baseContext.selectedCode) {
    parts.push('');
    parts.push('📝 **Selected Code:**');
    parts.push(`\`\`\`${baseContext.language}`);
    parts.push(baseContext.selectedCode);
    parts.push('```');
    totalTokens += estimateTokens(baseContext.selectedCode);
  } else if (baseContext.fullCode) {
    parts.push('');
    parts.push('📄 **Full File Content:**');
    parts.push(`\`\`\`${baseContext.language}`);
    parts.push(baseContext.fullCode);
    parts.push('```');
    totalTokens += estimateTokens(baseContext.fullCode);
  }

  return {
    contextMessage: parts.join('\n'),
    tokenCount: totalTokens
  };
};

// Simple tokenizer-based approximation
export const countTokensApprox = (text: string): number => {
  // Simple approximation: 1 token ≈ 4 characters for code
  // This is conservative for most programming languages
  return Math.ceil(text.length / 4);
};

// Format token count for display
export const formatTokenCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(2)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};
