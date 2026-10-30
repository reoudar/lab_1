import { readFileSync, writeFileSync, renameSync, unlinkSync, openSync, closeSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DocumentStore } from '../application/DocumentStore.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import { SvgCodec } from './SvgCodec.js';

export class FileDocumentStore implements DocumentStore {
  constructor(private readonly codec = new SvgCodec()) {}
  read(path: string): [SvgDocument, string[]] {
    let xml: string;
    try { xml = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path)); }
    catch { throw new Error(`cannot read file: ${path}`); }
    return this.codec.decode(xml);
  }
  write(path: string, document: SvgDocument): void {
    const xml = this.codec.encode(document);
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    let created = false;
    let descriptor: number | undefined;
    try {
      descriptor = openSync(temporary, 'wx'); created = true;
      writeFileSync(descriptor, xml, { encoding: 'utf8' });
      closeSync(descriptor); descriptor = undefined;
      renameSync(temporary, path); created = false;
    } catch { throw new Error(`cannot write file: ${path}`); }
    finally {
      if (descriptor !== undefined) { try { closeSync(descriptor); } catch { /* Preserve the original IO error. */ } }
      if (created) { try { unlinkSync(temporary); } catch { /* Best-effort cleanup of our own temp file. */ } }
    }
  }
}
