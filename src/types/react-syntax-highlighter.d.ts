declare module 'react-syntax-highlighter' {
  import type { ComponentType, ReactNode } from 'react';

  interface SyntaxHighlighterProps {
    language?: string;
    style?: Record<string, unknown>;
    customStyle?: Record<string, unknown>;
    children?: ReactNode;
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const vscDarkPlus: Record<string, unknown>;
}
