'use strict'

module.exports = function newObject (entries) {
  const obj = {}
  if (entries) {
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') {
        throw new TypeError('Iterator value ' + String(entry) + ' is not an entry object')
      }
      obj[entry[0]] = entry[1]
    }
  }
  return obj
}
