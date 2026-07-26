import assert from 'node:assert/strict';
import { fetchAllRows } from '../src/utils/supabasePagination.js';

const sourceRows = Array.from({ length: 2890 }, (_, index) => ({ id: index + 1 }));
const requestedRanges = [];

const rows = await fetchAllRows(async (from, to) => {
  requestedRanges.push([from, to]);
  return {
    data: sourceRows.slice(from, to + 1),
    error: null
  };
});

assert.equal(rows.length, sourceRows.length);
assert.deepEqual(requestedRanges, [
  [0, 999],
  [1000, 1999],
  [2000, 2999]
]);
assert.equal(rows[0].id, 1);
assert.equal(rows.at(-1).id, 2890);

await assert.rejects(
  () => fetchAllRows(async () => ({ data: null, error: new Error('query failed') })),
  /query failed/
);

console.log('message reaction pagination verification passed');
