import { Arguments } from '../application/Arguments.js';
import { Command } from '../application/Command.js';
import { Editor } from '../application/Editor.js';
export class ReadCommand extends Command {
  constructor(private readonly args: Arguments) { super(); }
  override execute(editor: Editor): string[] { this.args.count(1, 1, 'read <file.svg>'); return editor.read(this.args.at(0)); }
}
