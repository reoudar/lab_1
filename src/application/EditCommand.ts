import { Command } from './Command.js';
import type { Editor } from './Editor.js';
import { SvgDocument } from '../domain/SvgDocument.js';

export abstract class EditCommand extends Command {
  private before?: SvgDocument;
  private after?: SvgDocument;
  private result = '';
  protected constructor(private readonly description: string) { super(); }
  protected abstract change(document: SvgDocument): string;
  override execute(editor: Editor): string[] { return editor.edit(this); }
  apply(document: SvgDocument): [SvgDocument, string] {
    const working = document.clone();
    const message = this.change(working);
    // Publish command state only after all validation and mutation succeed.
    this.before = document.clone();
    this.after = working.clone();
    this.result = message;
    return [working, message];
  }
  undo(): [SvgDocument, string] {
    if (!this.before) throw new Error('command has not executed');
    return [this.before.clone(), `undone: ${this.description}`];
  }
  redo(): [SvgDocument, string] {
    if (!this.after) throw new Error('command has not executed');
    return [this.after.clone(), this.result];
  }
}
