import { Arguments } from '../application/Arguments.js';
import { Command } from '../application/Command.js';
import { Editor } from '../application/Editor.js';
export class InitCommand extends Command {
  constructor(private readonly args: Arguments) { super(); }
  override execute(editor: Editor): string[] {
    this.args.count(0, 2, 'init [w] [h]');
    const width = this.args.length > 0 ? this.args.number(0, 'width') : 800;
    const height = this.args.length > 1 ? this.args.number(1, 'height') : 600;
    editor.initialize(width, height);
    return [`canvas ${width}x${height} created`];
  }
}
