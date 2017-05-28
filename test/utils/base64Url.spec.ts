import test from 'ava';
import { decode, encode, escape, unescape } from '../../src/utils/base64Url';

test('base64Url#encode', (t) => {
    const text = 'vismooc is awesome';
    const encodeText = encode(text);
    t.truthy(encodeText, `encode: ${encodeText}`);

    const decodeText = decode(encodeText);
    t.deepEqual(decodeText, text, `decode: ${decodeText}`);
});

test('base64Url#decode', (t) => {
    const text = 'vismooc is awesome';
    const encodeText = encode(text);
    t.truthy(encodeText, `encode: ${encodeText}`);

    const decodeText = decode(encodeText);
    t.deepEqual(decodeText, text, `decode: ${decodeText}`);
});

test('base64Url#escape', (t) => {
    const text = 'This+is/goingto+escape==';
    const escapeText = escape(text);
    t.is(escapeText.match(/\+|\//g), null, `escape (omit + and /): ${escapeText}`);

    const unescapeText = unescape(escapeText);
    t.is(unescapeText.match(/\-|_/g), null, `unescape (back to first form): ${unescapeText}`);
    t.is(unescape('1234'), '1234', 'unescape should print 1234');
    t.is(unescape('123'), '123=', 'unescape should print 123=');
});

test('base64Url#unescape', (t) => {
    const text = 'This+is/goingto+escape==';
    const escapeText = escape(text);
    t.is(escapeText.match(/\+|\//g), null, `escape (omit + and /): ${escapeText}`);

    const unescapeText = unescape(escapeText);
    t.is(unescapeText.match(/\-|_/g), null, `unescape (back to first form): ${unescapeText}`);
    t.is(unescape('1234'), '1234', 'unescape should print 1234');
    t.is(unescape('123'), '123=', 'unescape should print 123=');
});
