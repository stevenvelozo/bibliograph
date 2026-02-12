# Diff and Deltas

Bibliograph tracks changes to records at the field level. When a write modifies an existing record, a delta is generated containing only the changed fields and stored in a history log.

## How Deltas Work

On each write, if `Bibliograph-Store-Deltas` is enabled (the default):

1. The old record is compared to the new merged record
2. Changed fields are identified
3. A delta object containing only the new values of changed fields is created
4. The delta is appended to the record's delta history with an ingest timestamp

If nothing changed, no delta is stored.

## Diff Result Format

The diff service uses a compressed format to save space across millions of records:

```javascript
// Records match:
{ "M": 1, "V": [] }

// Records differ (Age changed):
{ "M": 0, "V": ["Age"] }

// Multiple fields changed:
{ "M": 0, "V": ["Age", "Height"] }
```

- `M` -- Match flag. `1` = identical, `0` = modified.
- `V` -- Value array. Field names that differ between old and new.

## Using the Diff Service Directly

The `BibliographRecordDiff` service is available at `_Pict.BibliographRecordDiff`.

### diffRecords(pOldRecord, pNewRecord)

Compare two records and get a diff result.

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 42 }
);
console.log(tmpDiff);
// { M: 0, V: ['Age'] }
```

**Identical records:**

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 41 }
);
console.log(tmpDiff);
// { M: 1, V: [] }
```

**New fields added:**

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 42, Height: 5.4 }
);
console.log(tmpDiff);
// { M: 0, V: ['Age', 'Height'] }
```

**Only new fields (no changes to existing):**

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 41, Height: 5.4 }
);
console.log(tmpDiff);
// { M: 0, V: ['Height'] }
```

**Fields set to undefined:**

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: undefined, Height: 5.4, Weight: 150 }
);
console.log(tmpDiff);
// { M: 0, V: ['Age', 'Height', 'Weight'] }
```

### generateDelta(pOldRecord, pNewRecord)

Combines comparison and extraction into one call. Returns an object with only the changed field values, or `false` if nothing changed.

```javascript
let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 42 }
);
console.log(tmpDelta);
// { Age: 42 }
```

**No changes returns false:**

```javascript
let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 41 }
);
console.log(tmpDelta);
// false
```

**Multiple fields changed:**

```javascript
let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 42, Height: 5.4 }
);
console.log(tmpDelta);
// { Age: 42, Height: 5.4 }
```

**Subset write with no effective change:**

```javascript
let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice' }
);
console.log(tmpDelta);
// false (the new record's fields are all the same)
```

### generateDiffDelta(pOldRecord, pNewRecord, pDiff)

For when you already have a diff result and want to extract the delta separately.

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(oldRecord, newRecord);
let tmpDelta = _Pict.BibliographRecordDiff.generateDiffDelta(oldRecord, newRecord, tmpDiff);
console.log(tmpDelta);
// { Age: 42 }
```

## Reading Delta History

### Signature

```javascript
_Pict.Bibliograph.readRecordDelta(pSourceHash, pRecordGUID, fCallback)
```

- `pSourceHash` -- String. The source containing the record.
- `pRecordGUID` -- String. The record GUID.
- `fCallback` -- Function. Called with `(pError, pDeltaContainer)`.

### Delta Container Structure

```json
{
	"RecordGUID": "OverwriteMe",
	"Deltas": [
		{
			"Delta": { "Color": "Green" },
			"Ingest": 1706900050000
		},
		{
			"Delta": { "Color": "Beautiful" },
			"Ingest": 1706900100000
		}
	]
}
```

Each entry in `Deltas` captures the fields that changed and the timestamp of that change.

### Example: Tracking Color Changes

From the debug Subsequent Writes exercise, a record is written three times:

```javascript
// Write 1: { Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Pink' }
_Pict.Bibliograph.write('SubsequentWrites', 'OverwriteMe',
	{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Pink' }, fCallback);

// Write 2: Color changes to Green
_Pict.Bibliograph.write('SubsequentWrites', 'OverwriteMe',
	{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Green' }, fCallback);

// Write 3: Color changes to Beautiful
_Pict.Bibliograph.write('SubsequentWrites', 'OverwriteMe',
	{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Beautiful' }, fCallback);
```

Reading the delta history after all three writes:

```javascript
_Pict.Bibliograph.readRecordDelta('SubsequentWrites', 'OverwriteMe',
	function (pError, pDeltaContainer)
	{
		console.log(pDeltaContainer.Deltas.length); // 2
		// Delta 0: { Color: 'Green' }
		// Delta 1: { Color: 'Beautiful' }
		// The first write has no delta (it created the record)
	});
```

## File System Storage

In the FS provider, delta files are stored in the `history/` subfolder:

```
data/SubsequentWrites/history/_OverwriteMe_deltas.json
```

## Disabling Delta Tracking

Set `Bibliograph-Store-Deltas` to `false` to skip delta storage.

```javascript
let _Pict = new libPict(
	{
		"Bibliograph-Store-Deltas": false
	});
```

This reduces storage overhead and write time for scenarios where change history is not needed.
