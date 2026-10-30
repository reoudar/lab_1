import { Value } from '../domain/Value.js';

/** Positive uniform scale and translation, normalized into geometry on import. */
export class SvgTransform {
  constructor(private readonly factor = 1, private readonly offsetX = 0, private readonly offsetY = 0) {}
  get scale(): number { return this.factor; }
  get dx(): number { return this.offsetX; }
  get dy(): number { return this.offsetY; }
  compose(local: SvgTransform): SvgTransform {
    return new SvgTransform(
      Value.positive(this.scale * local.scale, 'transform scale'),
      Value.number(this.dx + this.scale * local.dx, 'transform x'),
      Value.number(this.dy + this.scale * local.dy, 'transform y'),
    );
  }
  static parse(raw: string): SvgTransform {
    let result = new SvgTransform();
    let remaining = raw.trim();
    while (remaining) {
      const translation = /^translate\s*\(([^()]*)\)/.exec(remaining);
      const scaling = /^scale\s*\(([^()]*)\)/.exec(remaining);
      const match = translation ?? scaling;
      if (!match) throw new Error('unsupported transform: use translate and positive uniform scale');
      const values = match[1]!.trim().split(/[\s,]+/).map(value => Value.number(value, 'transform'));
      if (values.length < 1 || values.length > 2) throw new Error('invalid transform parameters');
      if (translation) result = result.compose(new SvgTransform(1, values[0]!, values[1] ?? 0));
      else {
        const factor = Value.positive(values[0]!, 'transform scale');
        if (values.length === 2 && factor !== values[1]) throw new Error('unsupported non-uniform scale');
        result = result.compose(new SvgTransform(factor));
      }
      remaining = remaining.slice(match[0].length).replace(/^[\s,]+/, '');
    }
    return result;
  }
}
