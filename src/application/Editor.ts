import { SvgDocument } from '../domain/SvgDocument.js';
import { CommandHistory } from './CommandHistory.js';
import type { EditCommand } from './EditCommand.js';

export class Editor {
  private current?: SvgDocument;
  private readonly history = new CommandHistory();
  get document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  initialize(width: number, height: number): void {
    const next = new SvgDocument(width, height);
    this.current = next;
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
}
