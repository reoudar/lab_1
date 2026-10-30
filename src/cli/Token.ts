export class Token {
  constructor(private readonly value: string, private readonly quoted = false) {}
  get text(): string { return this.value; }
  get isQuoted(): boolean { return this.quoted; }
}
