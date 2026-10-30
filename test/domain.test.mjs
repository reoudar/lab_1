import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ShapeFactory } from '../dist/domain/ShapeFactory.js';
import { SvgDocument } from '../dist/domain/SvgDocument.js';

const factory = new ShapeFactory();
test('all leaf types move and scale their own geometry polymorphically', () => {
  const cases = [
    ['rect', ['1','2','3','4'], {x:'8',y:'12',width:'6',height:'8'}],
    ['circle', ['1','2','3'], {cx:'8',cy:'12',r:'6'}],
    ['ellipse', ['1','2','3','4'], {cx:'8',cy:'12',rx:'6',ry:'8'}],
    ['line', ['1','2','3','4'], {x1:'8',y1:'12',x2:'12',y2:'16'}],
    ['text', ['1','2','开始'], {x:'8',y:'12'}],
  ];
  for (const [type,args,expected] of cases) {
    const shape = factory.create(type, type, args); shape.move(3,4); shape.scale(2);
    for (const [name,value] of Object.entries(expected)) assert.equal(shape.attributes().get(name),value);
    assert.equal(shape.attributes().has('fill'),false);
  }
});
test('nested groups recurse, copy deeply, and inherit styles without rewriting children', () => {
  const doc = new SvgDocument();
  doc.add(factory.create('g','outer',[])); doc.add(factory.create('g','inner',[]),'outer');
  doc.add(factory.create('rect','r',['1','2','3','4']),'inner');
  const copy = doc.clone(); copy.require('outer').move(4,5); copy.require('outer').scale(2);
  copy.require('outer').set('fill','red');
  assert.equal(copy.require('r').attributes().get('x'),'10');
  assert.equal(doc.require('r').attributes().get('x'),'1');
  assert.equal(copy.require('r').attributes().has('fill'),false);
  assert.equal(copy.require('outer').attributes().get('fill'),'red');
});
test('IDs are globally unique and case-sensitive; failed insertion preserves document', () => {
  const doc = new SvgDocument(); doc.add(factory.create('g','A',[])); doc.add(factory.create('g','a',[]));
  doc.add(factory.create('g','__internal_canvas__',[]));
  assert.throws(() => doc.add(factory.create('circle','A',['0','0','1'])), /id already exists: A/);
  assert.throws(() => doc.add(factory.create('g','b',[]),'missing'),/no such container/);
  assert.equal(doc.all().length,3);
  const children = doc.children; children.pop(); assert.equal(doc.children.length,3);
});
test('unknown type, invalid numbers, negative sizes, whitelist and cycles are rejected', () => {
  assert.throws(() => factory.create('box','x',[]),/unknown shape type: box/);
  for (const value of ['NaN','Infinity','1px','0xff','']) assert.throws(() => factory.create('circle','x',[value,'0','1']),/finite number/);
  assert.throws(() => factory.create('rect','r',['0','0','-1','2']),/non-negative/);
  const group = factory.create('g','g',[]); assert.throws(() => group.asGroup().insert(group),/own descendant/);
  assert.throws(() => group.set('x','1'),/unknown attribute: x/);
  assert.throws(() => group.scale(0),/scale factor must be positive/);
});
