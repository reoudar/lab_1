import { Token } from './Token.js';

export class Tokenizer {
  tokenize(line: string): Token[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: Token[] = [];
    let cursor = 0;
    while (cursor < line.length) {
      if (/\s/.test(line[cursor]!)) { cursor++; continue; }
      const quoted = line[cursor] === '"';
      let value = '';
      if (quoted) {
        cursor++;
        while (cursor < line.length && line[cursor] !== '"') {
          const character = line[cursor++]!;
          if (character === '\\' && ['"', '\\'].includes(line[cursor] ?? '')) {
            value += line[cursor++]!;
          } else value += character;
        }
        if (line[cursor] !== '"') throw new Error('unterminated double quote');
        cursor++;
        if (cursor < line.length && !/\s/.test(line[cursor]!)) {
          throw new Error('expected whitespace after quoted argument');
        }
      } else {
        while (cursor < line.length && !/\s/.test(line[cursor]!)) {
          if (line[cursor] === '"') throw new Error('quote must start an argument');
          value += line[cursor++]!;
        }
      }
      tokens.push(new Token(value, quoted));
    }
    return tokens;
  }
}
