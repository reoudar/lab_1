import { Arguments } from '../application/Arguments.js';
import { Command } from '../application/Command.js';
import { Editor } from '../application/Editor.js';
export class UndoCommand extends Command {
  constructor(private readonly args: Arguments) { super(); }
  override execute(editor: Editor): string[] { this.args.count(0, 0, 'undo'); return editor.undo(); }
}
