import { Arguments } from '../application/Arguments.js';
import { Command } from '../application/Command.js';
import { Editor } from '../application/Editor.js';
export class CanvasCommand extends Command {
  constructor(private readonly args: Arguments) { super(); }
  override execute(editor: Editor): string[] {
    const doc = editor.document;
    if (this.args.length === 0) return [`canvas ${doc.width}x${doc.height}`];
    this.args.count(1, 2, 'canvas [w] [h]');
    const width = this.args.number(0, 'width');
    const height = this.args.length === 2 ? this.args.number(1, 'height') : doc.height;
    editor.resize(width, height);
    return [`canvas resized to ${width}x${height}`];
  }
}
