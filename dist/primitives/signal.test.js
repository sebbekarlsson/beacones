import assert from "node:assert";
import { it } from "node:test";
import { createSignal, signal } from "./signal";
it("Updates a derived state", () => {
    const count = signal(0);
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
    const map = signal(new Map());
    const x = signal(() => map.get().get("x"));
    assert.equal(x.peek(), undefined);
    map.peek().set("x", 7);
    assert.equal(x.peek(), 7);
    map.peek().set("x", 42);
    assert.equal(x.peek(), 42);
    map.peek().delete("x");
    assert.equal(x.peek(), undefined);
});
it('Custom Signal get & set works correctly', () => {
    const data = {
        firstname: 'john',
        lastname: 'doe',
        age: 47,
        pet: {
            name: 'boo',
            age: 7
        }
    };
    const firstname = createSignal({
        get: () => data.firstname,
        set: (value) => {
            data['firstname'] = value;
            return value;
        }
    });
    const lastname = createSignal({
        get: () => data.lastname,
        set: (value) => {
            data['lastname'] = value;
            return value;
        }
    });
    const age = createSignal({
        get: () => data.age,
        set: (value) => {
            data['age'] = value;
            return value;
        }
    });
    const ageTimesTwo = signal(() => age.get() * 2);
    assert.equal(ageTimesTwo.peek(), data.age * 2);
    const petName = createSignal({
        get: () => data.pet.name,
        set: (value) => {
            data.pet['name'] = value;
            return value;
        }
    });
    firstname.set('david');
    assert.equal(data.firstname, 'david');
    assert.equal(firstname.peek(), data.firstname);
    lastname.set('kent');
    assert.equal(data.lastname, 'kent');
    assert.equal(lastname.peek(), data.lastname);
    age.set(33);
    assert.equal(data.age, 33);
    assert.equal(age.peek(), data.age);
    assert.equal(ageTimesTwo.peek(), 33 * 2);
    petName.set('foo');
    assert.equal(data.pet.name, 'foo');
    assert.equal(petName.peek(), data.pet.name);
});
