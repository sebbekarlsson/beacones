import assert from "node:assert";
import { it } from "node:test";
import { signal } from "./signal";

it("Updates a derived state", () => {
  const count = signal<number>(0);

  assert.equal(count.peek(), 0);

  const timesTwo = signal(() => count.get() * 2);

  signal(() => {
    console.log(timesTwo.get());
  });

  assert.equal(timesTwo.peek(), 0);
  count.set((x) => x + 1);
  assert.equal(timesTwo.peek(), 2);
  count.set((x) => x + 1);
  assert.equal(timesTwo.peek(), 4);
});

it("Tracks Map changes", () => {
  const map = signal<Map<string, number>>(new Map());
  const x = signal(() => map.get().get("x"));

  assert.equal(x.peek(), undefined);
  map.peek().set("x", 7);
  assert.equal(x.peek(), 7);
  map.peek().set("x", 42);
  assert.equal(x.peek(), 42);
  map.peek().delete("x");
  assert.equal(x.peek(), undefined);
});
