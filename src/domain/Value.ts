export class Value {
  static number(raw: string | number, label: string): number {
    if (typeof raw === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
      throw new Error(`${label} must be a finite number`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new Error(`${label} must be a finite number`);
    return Object.is(value, -0) ? 0 : value;
  }
  static nonnegative(raw: string | number, label: string): number {
    const value = this.number(raw, label);
    if (value < 0) throw new Error(`${label} must be non-negative`);
    return value;
  }
  static positive(raw: string | number, label: string): number {
    const value = this.number(raw, label);
    if (value <= 0) throw new Error(`${label} must be positive`);
    return value;
  }
  static id(id: string): string {
    if (!id || /[\s\x00-\x1f]/u.test(id)) throw new Error('id must be non-empty and contain no whitespace');
    return this.xmlText(id);
  }
  static xmlText(value: string): string {
    if (/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/u.test(value)) {
      throw new Error('value contains an invalid XML character');
    }
    return value;
  }
}
