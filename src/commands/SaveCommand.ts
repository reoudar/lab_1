import { Arguments } from '../application/Arguments.js';
import { Command } from '../application/Command.js';
import { Editor } from '../application/Editor.js';
export class SaveCommand extends Command {
  constructor(private readonly args: Arguments) { super(); }
  override execute(editor: Editor): string[] { this.args.count(0, 1, 'save [file.svg]'); return editor.save(this.args.optional(0)); }
}
