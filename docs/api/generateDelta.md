# generateDelta()

Convenience method that diffs two records and extracts the delta in one step.

## Service

`BibliographRecordDiff` -- available at `_Pict.BibliographRecordDiff` after Bibliograph instantiation.

## Signature

```javascript
let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(pOldRecord, pNewRecord)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pOldRecord` | `object\|null` | The original record. If `null` or non-object, treated as `{}`. |
| `pNewRecord` | `object` | The updated record (must be a non-null object) |

## Returns

| Type | Description |
|------|-------------|
| `object\|false` | An object with changed fields and their new values, or `false` if no changes |

## Description

Combines `diffRecords()` and `generateDiffDelta()` into a single call. This is the method used internally by the write flow when delta tracking is enabled.

Unlike the individual methods, `generateDelta()` is forgiving of a `null` old record -- it treats it as an empty object `{}`, which means all fields in the new record are considered "changed."

## Example

```javascript
let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 42 }
);

console.log(tmpDelta);
// { Age: 42 }
```

## No Changes

```javascript
let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 41 }
);

console.log(tmpDelta);
// false
```

## New Record (No Old Record)

```javascript
let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
	null,
	{ Name: 'Alice', Age: 41 }
);

console.log(tmpDelta);
// { Name: 'Alice', Age: 41 }
// All fields are "changed" relative to an empty record
```

## Used by Write Flow

This method is called automatically during `write()` when `Bibliograph-Store-Deltas` is `true`:

```javascript
// Internally:
// 1. Read existing record
// 2. Merge: { ...existing, ...new }
// 3. generateDelta(existingRecord, mergedRecord)
// 4. Store the delta in the delta container
```

## Notes

- This is a synchronous method -- no callback needed
- The old record can be `null` or a non-object -- it is treated as `{}`
- Returns `false` when the records are identical
- This is the primary method used by Bibliograph's internal delta tracking
- For fine-grained control, use `diffRecords()` and `generateDiffDelta()` separately
