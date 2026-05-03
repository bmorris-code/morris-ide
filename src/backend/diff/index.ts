import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

export interface DiffResult {
  // Array of diff operations: [-1, "removed"], [0, "unchanged"], [1, "added"]
  diffs: Array<[number, string]>;
  // Patch text that can be applied to transform a into b
  patches: string;
  // Statistics
  stats: {
    added: number;
    removed: number;
    unchanged: number;
    addedLines: number;
    removedLines: number;
  };
}

export interface LineDiff {
  type: 'added' | 'removed' | 'unchanged';
  lineNumber: number;
  content: string;
}

/**
 * Compute the difference between two strings
 */
export const diffFiles = (oldText: string, newText: string): DiffResult => {
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  // Create patches
  const patches = dmp.patch_make(oldText, diffs);
  const patchText = dmp.patch_toText(patches);

  // Calculate statistics
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  let addedLines = 0;
  let removedLines = 0;

  for (const [op, text] of diffs) {
    const lineCount = (text.match(/\n/g) || []).length;
    if (op === 1) {
      added += text.length;
      addedLines += lineCount;
    } else if (op === -1) {
      removed += text.length;
      removedLines += lineCount;
    } else {
      unchanged += text.length;
    }
  }

  return {
    diffs: diffs as Array<[number, string]>,
    patches: patchText,
    stats: {
      added,
      removed,
      unchanged,
      addedLines,
      removedLines,
    },
  };
};

/**
 * Apply a patch to transform text
 */
export const applyPatch = (text: string, patchText: string): { result: string; success: boolean } => {
  const patches = dmp.patch_fromText(patchText);
  const [result, success] = dmp.patch_apply(patches, text);
  return {
    result,
    success: success.every(Boolean),
  };
};

/**
 * Get line-by-line diff for display
 */
export const getLineDiff = (oldText: string, newText: string): LineDiff[] => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: LineDiff[] = [];

  // Use diff on lines instead of characters for better line-level comparison
  const diffs = dmp.diff_main(oldLines.join('\n'), newLines.join('\n'));
  dmp.diff_cleanupSemantic(diffs);

  let lineNumber = 1;

  for (const [op, text] of diffs) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (op === 0) {
        result.push({ type: 'unchanged', lineNumber: lineNumber++, content: line });
      } else if (op === 1) {
        result.push({ type: 'added', lineNumber: lineNumber++, content: line });
      } else {
        result.push({ type: 'removed', lineNumber: lineNumber, content: line });
      }
    }
  }

  return result;
};

/**
 * Check if two strings are identical
 */
export const areIdentical = (a: string, b: string): boolean => {
  return a === b;
};

/**
 * Get similarity ratio between two strings (0-1)
 */
export const getSimilarity = (a: string, b: string): number => {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const diffs = dmp.diff_main(a, b);
  let commonLength = 0;

  for (const [op, text] of diffs) {
    if (op === 0) {
      commonLength += text.length;
    }
  }

  return (2 * commonLength) / (a.length + b.length);
};

export default {
  diffFiles,
  applyPatch,
  getLineDiff,
  areIdentical,
  getSimilarity,
};