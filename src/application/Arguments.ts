import { Value } from '../domain/Value.js';

export class Arguments {
  constructor(private readonly values: readonly string[], private readonly quoted: readonly boolean[] = []) {}
  get length(): number { return this.values.length; }
  at(index: number): string {
    const value = this.values[index];
    if (value === undefined) throw new Error('missing argument; see help');
    return value;
  }
  optional(index: number): string | undefined { return this.values[index]; }
  isKeyword(index: number, keyword: string): boolean { return !this.quoted[index] && this.values[index] === keyword; }
  slice(start: number, end = this.length): string[] { return this.values.slice(start, end); }
  number(index: number, label: string): number { return Value.number(this.at(index), label); }
  count(min: number, max: number, usage: string): void {
    if (this.length < min || this.length > max) throw new Error(`usage: ${usage}`);
  }
}
