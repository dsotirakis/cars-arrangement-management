# sort-map

Sorts a Map by its keys and/or values.

Unlike [`Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Sort), `sort-map` does **not** sort the Map in-place. It creates a new, sorted Map and returns it.

## Installation

Requires [Node.js](https://nodejs.org/) 7.0.0 or above.

```bash
npm install sort-map --save
```

The module exports a single function.

## Usage

### Maps

By default, `sort-map` sorts a Map by its keys:

```javascript
const sortMap = require('sort-map')

const map = new Map([['b', 2], ['a', 1]])
const sortedMap = sortMap(map)
Array.from(sortedMap.keys()) // ['a', 'b']
```

You can provide a callback if your sorting needs are more complex. This example sorts the Map by its values:

```javascript
const compare = require('3')
const sortMap = require('sort-map')

const map = new Map([['b', 2], ['a', 1]])
const sortedMap = sortMap(map, ([k1, v1], [k2, v2]) => compare(v1, v2))
Array.from(sortedMap.values()) // [1, 2]
```

The above example makes use of the [`3`](https://github.com/lamansky/3) module in the sort callback.

### Objects

`sort-map` can also sort an Object (but remember that JavaScript technically does not guarantee that Object keys will be enumerated in any particular order).

```javascript
const sortMap = require('sort-map')
sortMap({b: 2, a: 1}) // {a: 1, b: 2}
```
