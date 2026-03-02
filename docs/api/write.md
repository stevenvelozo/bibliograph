# write()

Write a record to a source. Merges with existing data, deduplicates by hash, and tracks field-level changes.

## Signature

```javascript
_Pict.Bibliograph.write(pSourceHash, pRecordGUID, pRecord, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pSourceHash` | `string` | Source to write into. Must be a non-empty string. |
| `pRecordGUID` | `string` | Unique record identifier. Must be a non-empty string. |
| `pRecord` | `object` | JavaScript object to store. Must be a non-null object. |
| `fCallback` | `Function` | Callback invoked as `fCallback(pError)` |

## Description

The write operation is the most feature-rich method in Bibliograph. It performs:

1. **Read** -- Fetches the existing record (if any)
2. **Merge** -- Spreads the new partial record over the existing record (`{ ...existing, ...new }`)
3. **Serialize** -- Converts the merged record to a JSON string
4. **Metadata** -- Generates metadata (GUID, Length, QHash, MD5, Ingest timestamp)
5. **Deduplication** (if enabled) -- Compares new metadata with existing metadata; skips the write if content is identical
6. **Delta tracking** (if enabled) -- Diffs the old and new records, stores changed fields
7. **Persist** -- Writes the record, metadata, and updates the timestamp

## Example

```javascript
_Pict.Bibliograph.write('FruitData', 'apple-001',
	{ Name: 'Apple', Color: 'Red', Weight: 182 },
	function (pError)
	{
		if (pError) { return console.error(pError); }
		console.log('Record written.');
	});
```

## Partial Update

Writes are merged with the existing record. You only need to send the fields that changed:

```javascript
// Original: { Name: 'Apple', Color: 'Red', Weight: 182 }

_Pict.Bibliograph.write('FruitData', 'apple-001',
	{ Color: 'Green' },
	function (pError)
	{
		// Record is now: { Name: 'Apple', Color: 'Green', Weight: 182 }
	});
```

## Deduplication

When `Bibliograph-Check-Metadata-On-Write` is `true` (default), writes are skipped if the merged content has not changed. The check compares Length, QHash, then MD5 in order, stopping early for performance.

```javascript
// First write -- persisted
_Pict.Bibliograph.write('FruitData', 'apple-001',
	{ Name: 'Apple', Color: 'Red' },
	function (pError) { });

// Identical write -- skipped (no I/O)
_Pict.Bibliograph.write('FruitData', 'apple-001',
	{ Name: 'Apple', Color: 'Red' },
	function (pError) { });
```

## Delta Tracking

When `Bibliograph-Store-Deltas` is `true` (default), the diff engine identifies changed fields and appends them to the delta container:

```javascript
// After updating Color from 'Red' to 'Green':
// Delta stored: { Delta: { Color: 'Green' }, Ingest: 1706900050000 }
```

## Notes

- The `pRecord` parameter must be an **object** (not a string) -- serialization is handled internally
- Partial records are merged with the existing record via object spread
- New records (no existing data) are created from scratch with metadata and a timestamp
- Deduplication and delta tracking are controlled by configuration settings
- All three parameters (source hash, GUID, record) are validated before the operation proceeds
