import { Arguments } from '../application/Arguments.js';
import { EditCommand } from '../application/EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';
export class GroupCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super('group'); }
  protected override change(document: SvgDocument): string {
    this.args.count(2, Number.MAX_SAFE_INTEGER, 'group <newGid> <id1> <id2>...');
    const group = document.group(this.args.at(0), this.args.slice(1));
    return `${group.label} created with ${group.children.length} children`;
  }
}
