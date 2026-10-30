import { Arguments } from '../application/Arguments.js';
import { EditCommand } from '../application/EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';
export class UngroupCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super('ungroup'); }
  protected override change(document: SvgDocument): string {
    this.args.count(1, 1, 'ungroup <gid>');
    const id = this.args.at(0), count = document.ungroup(id);
    return `g#${id} ungrouped (${count} children promoted)`;
  }
}
