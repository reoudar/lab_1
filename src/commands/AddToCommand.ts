import { Arguments } from '../application/Arguments.js';
import { EditCommand } from '../application/EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';
export class AddToCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super('addto'); }
  protected override change(document: SvgDocument): string {
    this.args.count(2, 2, 'addto <gid> <id>');
    document.addTo(this.args.at(0), this.args.at(1));
    return `${document.require(this.args.at(1)).label} moved into ${document.requireContainer(this.args.at(0)).label}`;
  }
}
