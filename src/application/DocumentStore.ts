import type { SvgDocument } from '../domain/SvgDocument.js';
export interface DocumentStore {
  read(path: string): [SvgDocument, string[]];
  write(path: string, document: SvgDocument): void;
}
