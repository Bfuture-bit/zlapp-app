'use strict';

const batches = [
  require('./b1'),
  require('./b2'),
  require('./b3'),
  require('./b4'),
  require('./b5'),
  require('./b6'),
];

const glyphs = batches.flat();
const byId = Object.fromEntries(glyphs.map((g) => [g.id, g]));

module.exports = { glyphs, byId };
