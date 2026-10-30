import { Arguments } from '../application/Arguments.js';
import { EditCommand } from '../application/EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';
export class SetCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super('set'); }
  protected override change(document: SvgDocument): string {
    this.args.count(3, 3, 'set <id> <attr> <value>');
    const shape = document.require(this.args.at(0));
    shape.set(this.args.at(1), this.args.at(2));
    return `${shape.label} updated: ${this.args.at(1)}=${JSON.stringify(this.args.at(2))}`;
  }
}
