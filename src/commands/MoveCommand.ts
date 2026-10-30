import { Arguments } from '../application/Arguments.js';
import { EditCommand } from '../application/EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';
export class MoveCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super('move'); }
  protected override change(document: SvgDocument): string {
    this.args.count(3, 3, 'move <id> <dx> <dy>');
    const shape = document.require(this.args.at(0));
    const dx = this.args.number(1, 'dx'), dy = this.args.number(2, 'dy');
    shape.move(dx, dy);
    return `${shape.label} moved${shape.position() ? ` to ${shape.position()}` : ` by (${dx},${dy})`}`;
  }
}
