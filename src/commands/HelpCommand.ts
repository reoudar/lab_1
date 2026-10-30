import { Arguments } from '../application/Arguments.js';
import { Command } from '../application/Command.js';
export class HelpCommand extends Command {
  constructor(private readonly args: Arguments) { super(); }
  override execute(): string[] {
    this.args.count(0, 0, 'help');
    return [
      'help', 'init [w] [h]', 'canvas [w] [h]',
      'create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]',
      'create circle <id> <cx> <cy> <r> [fill] [in <containerId>]',
      'create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]',
      'create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]',
      'create text <id> <x> <y> "content" [in <containerId>]',
      'create g <id> [in <containerId>]',
      'delete <id>', 'move <id> <dx> <dy>', 'scale <id> <factor>',
      'set <id> <attr> <value>', 'undo', 'redo',
      'group <newGid> <id1> <id2>...', 'ungroup <gid>', 'addto <gid> <id>',
      'front <id>', 'back <id>', 'tree [id]', 'show <id>',
      'read <file.svg>', 'save [file.svg]',
      'set whitelist: fill, stroke, stroke-width, own geometry; text content via text',
      'init w: height defaults to 600; canvas w: current height is retained',
      'Positive canvas dimensions and scale factors; shape dimensions may be zero.',
      'Use double quotes for spaces, # at line start for comments, EOF to exit.',
    ];
  }
}
