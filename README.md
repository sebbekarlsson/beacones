# Beacones
> Signal library for Typescript


## Install
```bash
npm install beacones
```


## Signal

### Introduction
In this library, a signal can be three things:  
- A reactive value
- A derived / computed value
- An effect

### Creating Signals
#### Reactive Value
```typescript
const name = signal<string>('');
name.set('john doe'); // Other signals that depend on this signal will be notified of this update.
```

#### Derived / Computed
```typescript
const numbers = signal<number[]>([1, 2, 3, 4]);
const reversed = signal(() => numbers.get().toReversed()); // Will automatically update when `numbers` changes.

console.log(reversed.peek()) // [4, 3, 2, 1];

numbers.set((numbers) => [...numbers, 5]);

console.log(reversed.peek()) // [5, 4, 3, 2, 1];
```

#### Effect
```typescript
const language = signal<string>('Typescript');

// An effect is just a signal that doesn't return anything.
// This will update whenever `language` changes.
signal(() => {
  console.log(language.get());
});

language.set('Haskell'); // Triggered the effect above to update.
```

### Examples

#### Counter
```typescript
const count = signal<number>(0);
const countTimesTwo = signal<number>(() => count.get() * 2);

// Will print the value of count and countTimesTwo whenever they update
signal(() => {
  console.log(count.get());
  console.log(countTimesTwo.get());
});

count.set(c => c + 1);
count.set(c => c + 1);
count.set(c => c + 1);
count.set(c => c + 1);
count.set(c => c + 1);
```

#### Track changes in a Map
```typescript
const map = signal<Map<string, number>>(new Map());
const x = signal(() => map.get().get("x"));

console.log(x.peek()); // undefined
map.peek().set("x", 7);
console.log(x.peek()); // 7
map.peek().set("x", 42);
console.log(x.peek()); // 42
map.peek().delete("x");
console.log(x.peek()); // undefined
```
