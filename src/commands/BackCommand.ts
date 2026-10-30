import { Arguments } from '../application/Arguments.js';
import { EditCommand } from '../application/EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';
export class BackCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super('back'); }
  protected override change(document: SvgDocument): string {
    this.args.count(1, 1, 'back <id>'); document.reorder(this.args.at(0), false);
    return `${document.require(this.args.at(0)).label} sent to back`;
  }
}
