# new-object

Creates an object from an array of entries.

The [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) constructor lets you specify initial keys and values via an `iterable` collection (e.g. an array) of key-value pairs, whereas the `Object` constructor does not. This simple module fills that gap, approximating [the ECMA-defined behavior for the Map constructor](https://tc39.github.io/ecma262/#sec-map-iterable) but for Objects.

Remember that, unlike Maps, Objects can only use strings and symbols as keys.

## Installation

```bash
npm install new-object --save
```

## Usage Example

```javascript
const newObject = require('new-object')

const entries = [['a', 1], ['b', 2]]

// What was possible for a Map...
const map = new Map(entries)
map.get('a') // 1

// ...is now also possible for an Object:
const obj = newObject(entries)
obj.a // 1
```

In short, you can think of the `new-object` module as doing the opposite of [`Object.entries()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries):

```JavaScript
newObject(Object.entries({a: 1, b: 2})) // {a: 1, b: 2}
```
