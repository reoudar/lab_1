import { Arguments } from '../application/Arguments.js';
import { Command } from '../application/Command.js';
import { Editor } from '../application/Editor.js';
import { TreeFormatter } from '../application/TreeFormatter.js';
export class TreeCommand extends Command {
  constructor(private readonly args: Arguments) { super(); }
  override execute(editor: Editor): string[] {
    this.args.count(0, 1, 'tree [id]'); return new TreeFormatter().tree(editor.document, this.args.optional(0));
  }
}
