import { Arguments } from '../application/Arguments.js';
import { EditCommand } from '../application/EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';
export class FrontCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super('front'); }
  protected override change(document: SvgDocument): string {
    this.args.count(1, 1, 'front <id>'); document.reorder(this.args.at(0), true);
    return `${document.require(this.args.at(0)).label} brought to front`;
  }
}
