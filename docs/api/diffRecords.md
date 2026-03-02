# diffRecords()

Compare two record objects and return a compressed diff result.

## Service

`BibliographRecordDiff` -- available at `_Pict.BibliographRecordDiff` after Bibliograph instantiation.

## Signature

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(pOldRecord, pNewRecord)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pOldRecord` | `object` | The original record (must be a non-null object) |
| `pNewRecord` | `object` | The updated record (must be a non-null object) |

## Returns

| Type | Description |
|------|-------------|
| `object` | Compressed diff result with `M` (match flag) and `V` (changed field names) |

## Description

Compares all keys in the new record against the old record using strict inequality (`!==`). Returns a compressed diff object optimized for storage at scale.

The diff only examines keys present in the **new** record. Keys that exist only in the old record are not reported as changes.

## Diff Format

```javascript
// Records match:
{ M: 1, V: [] }

// Records differ:
{ M: 0, V: ['Age', 'Height'] }
```

- `M` -- Match flag. `1` = identical, `0` = different.
- `V` -- Array of field names from the new record whose values differ from the old record.

## Example

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
	{ Name: 'Alice', Age: 41, City: 'Portland' },
	{ Name: 'Alice', Age: 42, City: 'Portland' }
);

console.log(tmpDiff);
// { M: 0, V: ['Age'] }
```

## Identical Records

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 41 }
);

console.log(tmpDiff);
// { M: 1, V: [] }
```

## Multiple Changes

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
	{ Name: 'Alice', Age: 41, City: 'Portland' },
	{ Name: 'Alice', Age: 42, City: 'Seattle' }
);

console.log(tmpDiff);
// { M: 0, V: ['Age', 'City'] }
```

## Notes

- This is a synchronous method -- no callback needed
- Both arguments must be non-null objects; passing `null` or non-objects throws an `Error`
- Uses strict inequality (`!==`) for comparison -- type matters
- Only new record keys are checked; removed keys are not detected
- The compressed format (`M`, `V`) is designed to minimize storage when tracking millions of records
