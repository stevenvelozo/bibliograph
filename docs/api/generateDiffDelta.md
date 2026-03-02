# generateDiffDelta()

Given two records and a diff result, extract an object containing only the changed field values.

## Service

`BibliographRecordDiff` -- available at `_Pict.BibliographRecordDiff` after Bibliograph instantiation.

## Signature

```javascript
let tmpDelta = _Pict.BibliographRecordDiff.generateDiffDelta(pOldRecord, pNewRecord, pDiff)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pOldRecord` | `object` | The original record (must be a non-null object) |
| `pNewRecord` | `object` | The updated record (must be a non-null object) |
| `pDiff` | `object` | A diff result from `diffRecords()` (must be a non-null object with `V` array) |

## Returns

| Type | Description |
|------|-------------|
| `object\|false` | An object with changed fields and their new values, or `false` if no changes |

## Description

Takes a diff result (from `diffRecords()`) and extracts the actual changed values from the new record. This produces a minimal delta object that can be stored as part of the change history.

Returns `false` if the diff's `V` array is empty (no changes).

## Example

```javascript
let tmpOld = { Name: 'Alice', Age: 41, City: 'Portland' };
let tmpNew = { Name: 'Alice', Age: 42, City: 'Portland' };

let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOld, tmpNew);
// { M: 0, V: ['Age'] }

let tmpDelta = _Pict.BibliographRecordDiff.generateDiffDelta(tmpOld, tmpNew, tmpDiff);
console.log(tmpDelta);
// { Age: 42 }
```

## No Changes

```javascript
let tmpOld = { Name: 'Alice', Age: 41 };
let tmpNew = { Name: 'Alice', Age: 41 };

let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOld, tmpNew);
let tmpDelta = _Pict.BibliographRecordDiff.generateDiffDelta(tmpOld, tmpNew, tmpDiff);

console.log(tmpDelta);
// false
```

## Multiple Changes

```javascript
let tmpOld = { Name: 'Alice', Age: 41, City: 'Portland' };
let tmpNew = { Name: 'Alice', Age: 42, City: 'Seattle' };

let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOld, tmpNew);
let tmpDelta = _Pict.BibliographRecordDiff.generateDiffDelta(tmpOld, tmpNew, tmpDiff);

console.log(tmpDelta);
// { Age: 42, City: 'Seattle' }
```

## Notes

- This is a synchronous method -- no callback needed
- All three arguments must be non-null objects; passing `null` or non-objects throws an `Error`
- Returns `false` when no changes are detected (empty `V` array)
- The returned object contains only the new values -- not the old values
- For most use cases, prefer `generateDelta()` which combines diff and extraction in one call
