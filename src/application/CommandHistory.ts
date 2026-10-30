import type { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class CommandHistory {
  private readonly past: EditCommand[] = [];
  private readonly future: EditCommand[] = [];
  private blocked = true;
  execute(command: EditCommand, document: SvgDocument): [SvgDocument, string] {
    const result = command.apply(document);
    this.past.push(command);
    this.future.length = 0;
    this.blocked = false;
    return result;
  }
  barrier(): void { this.past.length = 0; this.future.length = 0; this.blocked = true; }
  undo(): [SvgDocument, string] {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.past.at(-1);
    if (!command) throw new Error('nothing to undo');
    const result = command.undo();
    this.past.pop(); this.future.push(command);
    return result;
  }
  redo(): [SvgDocument, string] {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.future.at(-1);
    if (!command) throw new Error('nothing to redo');
    const result = command.redo();
    this.future.pop(); this.past.push(command);
    return result;
  }
}
