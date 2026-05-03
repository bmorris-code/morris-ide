declare module 'diff-match-patch' {
  export type Diff = [number, string];
  
  export interface Patch {
    diffs: Diff[];
    start1: number;
    start2: number;
    length1: number;
    length2: number;
  }

  export default class DiffMatchPatch {
    constructor();
    
    // Diff operations
    diff_main(text1: string, text2: string, opt_checklines?: boolean): Diff[];
    diff_cleanupSemantic(diffs: Diff[]): void;
    diff_cleanupEfficiency(diffs: Diff[]): void;
    diff_levenshtein(diffs: Diff[]): number;
    diff_prettyHtml(diffs: Diff[]): string;
    
    // Match operations
    match_main(text: string, pattern: string, loc: number): number;
    
    // Patch operations
    patch_make(text1: string, diffs: Diff[]): Patch[];
    patch_make(text1: string, text2: string): Patch[];
    patch_toText(patches: Patch[]): string;
    patch_fromText(textline: string): Patch[];
    patch_apply(patches: Patch[], text: string): [string, boolean[]];
  }
}
