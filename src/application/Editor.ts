import { SvgDocument } from '../domain/SvgDocument.js';
import { CommandHistory } from './CommandHistory.js';
import type { EditCommand } from './EditCommand.js';
import type { DocumentStore } from './DocumentStore.js';

export class Editor {
  private current?: SvgDocument;
  private readonly history = new CommandHistory();
  private currentPath?: string;
  constructor(private readonly store?: DocumentStore) {}
  get document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  initialize(width: number, height: number): void {
    const next = new SvgDocument(width, height);
    this.current = next;
    this.currentPath = undefined;
    this.history.barrier();
  }
  resize(width: number, height: number): void {
    const next = this.document.clone(); next.resize(width, height);
    this.current = next; this.history.barrier();
  }
  edit(command: EditCommand): string[] {
    const [next, message] = this.history.execute(command, this.document);
    this.current = next; return [message];
  }
  undo(): string[] {
    void this.document;
    const [next, message] = this.history.undo(); this.current = next; return [message];
  }
  redo(): string[] {
    void this.document;
    const [next, message] = this.history.redo(); this.current = next; return [message];
  }
  read(path: string): string[] {
    if (!this.store) throw new Error('document store is not configured');
    const [next, warnings] = this.store.read(path);
    this.current = next; this.currentPath = path; this.history.barrier();
    return [...warnings, `read ${path} (${next.all().length} elements)`];
  }
  save(path?: string): string[] {
    const document = this.document;
    const destination = path ?? this.currentPath;
    if (destination === undefined || destination === '') throw new Error('no file path. use save <file.svg>');
    if (!this.store) throw new Error('document store is not configured');
    this.store.write(destination, document);
    this.currentPath = destination; this.history.barrier();
    return [`saved to ${destination} (${document.all().length} elements)`];
  }
}
