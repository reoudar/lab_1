import { Arguments } from '../application/Arguments.js';
import { EditCommand } from '../application/EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';
export class DeleteCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super('delete'); }
  protected override change(document: SvgDocument): string {
    this.args.count(1, 1, 'delete <id>');
    const shape = document.require(this.args.at(0)); document.delete(shape.id);
    return `${shape.label} deleted`;
  }
}
