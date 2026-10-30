import { DOMParser, DOMImplementation, XMLSerializer } from '@xmldom/xmldom';
import type { Document, Element, Node } from '@xmldom/xmldom';
import { SvgDocument } from '../domain/SvgDocument.js';
import { Shape } from '../domain/Shape.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { Value } from '../domain/Value.js';
import { SvgTransform } from './SvgTransform.js';

export class SvgCodec {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  private readonly factory = new ShapeFactory();
  decode(xml: string): [SvgDocument, string[]] {
    if (/<!\s*(?:DOCTYPE|ENTITY)/i.test(xml)) throw new Error('invalid SVG: DTD and entities are not supported');
    Value.xmlText(xml);
    let dom: Document;
    try {
      dom = new DOMParser({ onError: (_level, message) => { throw new Error(message); } }).parseFromString(xml, 'image/svg+xml');
    } catch { throw new Error('invalid SVG: malformed XML'); }
    const root = dom.documentElement;
    if (!root || root.localName !== 'svg' || (root.namespaceURI && root.namespaceURI !== this.namespace)) throw new Error('invalid SVG: expected <svg> root');
    const viewBox = root.getAttribute('viewBox');
    const bounds = viewBox === null ? undefined : viewBox.trim().split(/[\s,]+/).map(value => Value.number(value, 'viewBox'));
    if (bounds && (bounds.length !== 4 || bounds[2]! <= 0 || bounds[3]! <= 0)) throw new Error('invalid SVG viewBox');
    const document = new SvgDocument(
      this.length(root.getAttribute('width') ?? String(bounds?.[2] ?? 800), 'width'),
      this.length(root.getAttribute('height') ?? String(bounds?.[3] ?? 600), 'height'),
    );
    for (let index = 0; index < root.attributes.length; index++) {
      const attribute = root.attributes.item(index)!;
      if (attribute.namespaceURI === 'http://www.w3.org/2000/xmlns/' || ['width', 'height', 'transform'].includes(attribute.name)) continue;
      document.importAttribute(attribute.name, attribute.value);
    }
    // Reserve every explicit ID before assigning any generated ID.
    const reserved = new Set<string>();
    const elements = [root, ...Array.from(root.getElementsByTagName('*'))];
    for (const element of elements) {
      const id = element.getAttribute('id');
      if (id !== null && id !== '') {
        Value.id(id);
        if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
        reserved.add(id);
      }
    }
    const warnings: string[] = [];
    const transform = SvgTransform.parse(root.getAttribute('transform') ?? '');
    const stroke = this.length(root.getAttribute('stroke-width') ?? '1', 'stroke-width');
    const font = this.length(root.getAttribute('font-size') ?? '16', 'font-size');
    for (const child of this.elements(root, false)) document.add(this.readShape(child, reserved, warnings, transform, stroke, font));
    return [document, warnings];
  }
  private length(value: string, name: string): number { return Value.nonnegative(value.replace(/px$/, ''), name); }
  private elements(element: Element, allowText: boolean): Element[] {
    const result: Element[] = [];
    for (let child = element.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 1) result.push(child as Element);
      else if ([3, 4].includes(child.nodeType) && !allowText && child.nodeValue?.trim()) throw new Error('invalid SVG: unexpected text content');
      else if (![3, 4, 8].includes(child.nodeType)) throw new Error('unsupported SVG node');
    }
    return result;
  }
  private readShape(element: Element, reserved: Set<string>, warnings: string[], parentTransform: SvgTransform, inheritedStroke: number, inheritedFont: number): Shape {
    if (element.namespaceURI && element.namespaceURI !== this.namespace) throw new Error('unsupported SVG namespace');
    const type = element.localName ?? element.tagName;
    let id = element.getAttribute('id');
    if (!id) {
      let ordinal = 1;
      while (reserved.has(`${type}${ordinal}`)) ordinal++;
      id = `${type}${ordinal}`; reserved.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
    }
    const shape = this.factory.empty(type, id);
    const transform = parentTransform.compose(SvgTransform.parse(element.getAttribute('transform') ?? ''));
    const stroke = this.length(element.getAttribute('stroke-width') ?? String(inheritedStroke), 'stroke-width');
    const font = this.length(element.getAttribute('font-size') ?? String(inheritedFont), 'font-size');
    for (let index = 0; index < element.attributes.length; index++) {
      const attribute = element.attributes.item(index)!;
      if (attribute.namespaceURI === 'http://www.w3.org/2000/xmlns/' || ['id', 'transform'].includes(attribute.name)) continue;
      const value = ['font-size', 'stroke-width'].includes(attribute.name) ? String(this.length(attribute.value, attribute.name)) : attribute.value;
      shape.importAttribute(attribute.name, value);
    }
    const children = this.elements(element, shape.textContent !== undefined);
    if (shape.textContent !== undefined) shape.set('text', element.textContent ?? '');
    for (const child of children) shape.asGroup().insert(this.readShape(child, reserved, warnings, transform, stroke, font));
    shape.normalizeImport(transform.scale, transform.dx, transform.dy, stroke, font);
    return shape;
  }
  encode(document: SvgDocument): string {
    const dom = new DOMImplementation().createDocument(this.namespace, 'svg', null);
    const root = dom.documentElement!;
    for (const [key, value] of document.attributes()) root.setAttribute(key, value);
    for (const shape of document.children) this.writeShape(dom, root, shape, 1);
    if (document.children.length) root.appendChild(dom.createTextNode('\n'));
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(dom)}\n`;
  }
  private writeShape(dom: Document, parent: Node, shape: Shape, depth: number): void {
    parent.appendChild(dom.createTextNode('\n' + '  '.repeat(depth)));
    const element = dom.createElementNS(this.namespace, shape.tag);
    for (const [name, value] of shape.attributes()) element.setAttribute(name, value);
    if (shape.textContent !== undefined) element.appendChild(dom.createTextNode(shape.textContent));
    for (const child of shape.children) this.writeShape(dom, element, child, depth + 1);
    if (shape.children.length) element.appendChild(dom.createTextNode('\n' + '  '.repeat(depth)));
    parent.appendChild(element);
  }
}
