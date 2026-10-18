#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname;
const version=require(path.join(root,'english/version.js'));
const core=require(path.join(root,'english/little-e-core.js'));

assert.equal(version.release,'2026.10.18-v38');
assert.equal(version.cache,'edan-english-coach-20261018-v38');

const hello=core.directReply('你好',[]);
assert.ok(hello);assert.match(hello.zh,/你好/);assert.doesNotMatch(hello.en,/24|book|Edan|dais/i);
assert.equal(core.classifyIntent('幫我翻譯：我晚點回覆你'),'translation');
assert.equal(core.classifyIntent('這個網站怎麼用？'),'site_help');
assert.equal(core.classifyIntent('你生日幾號？'),'persona');
assert.match(core.directReply('你生日幾號？',[]).en,/April 6, 2026/);
assert.match(core.directReply('你最喜歡誰？',[]).en,/Edan/);
assert.match(core.directReply('你平常喜歡做什麼？',[]).en,/reading/i);

const daisy=core.directReply('你喜歡雛菊嗎？',[]);
const why=core.directReply('為什麼？',[{role:'assistant',en:daisy.en,zh:daisy.zh,...daisy.meta}]);
assert.equal(daisy.meta.personaTopic,'daisies');assert.ok(why);assert.equal(why.meta.personaTopic,'daisies');assert.match(why.zh,/雛菊/);
assert.match(core.fallbackReply('我今天很累',[]).zh,/累|疲/);

const html=fs.readFileSync(path.join(root,'english/challenge.html'),'utf8');
const qb=fs.readFileSync(path.join(root,'english/question-bank.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'english/sw.js'),'utf8');
const le=fs.readFileSync(path.join(root,'english/little-e.js'),'utf8');
const css=fs.readFileSync(path.join(root,'english/styles.css'),'utf8');

assert.ok(html.includes('<script src="version.js"></script>'));
assert.ok(html.includes('<script src="little-e-core.js"></script>'));
assert.ok(html.indexOf('version.js')<html.indexOf('question-bank.js'));
assert.doesNotMatch(html,/20261018v\d+/);
assert.match(qb,/contentVersion:\s*window\.EDAN_APP_VERSION\.release/);
assert.match(sw,/importScripts\('\.\/version\.js'\)/);
assert.match(sw,/EDAN_APP_VERSION\.cache/);
assert.match(le,/normalizePetAsset/);
assert.match(le,/CORE\.directReply/);
assert.doesNotMatch(css,/transform:scale\([23]\./);
assert.ok(html.includes('appUpdateBanner'));
console.log('PASS: Little E v38 routing, persona, context, versioning, update UX, mobile UX and pose normalization.');
