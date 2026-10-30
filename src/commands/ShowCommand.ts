import { Arguments } from '../application/Arguments.js';
import { Command } from '../application/Command.js';
import { Editor } from '../application/Editor.js';
import { TreeFormatter } from '../application/TreeFormatter.js';
export class ShowCommand extends Command {
  constructor(private readonly args: Arguments) { super(); }
  override execute(editor: Editor): string[] {
    this.args.count(1, 1, 'show <id>'); return new TreeFormatter().show(editor.document, this.args.at(0));
  }
}
