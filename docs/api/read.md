# read()

Read a record from a source.

## Signature

```javascript
_Pict.Bibliograph.read(pSourceHash, pRecordGUID, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pSourceHash` | `string` | Source to read from. Must be a non-empty string. |
| `pRecordGUID` | `string` | Record identifier. Must be a non-empty string. |
| `fCallback` | `Function` | Callback invoked as `fCallback(pError, pRecord)` |

## Callback Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `pError` | `Error\|null` | Error object if the read failed |
| `pRecord` | `object\|undefined` | Parsed record object, or `undefined` if not found |

## Description

Validates the source hash and record GUID, then delegates to the storage provider's `read()` method. The storage provider deserializes the stored JSON and returns the parsed JavaScript object.

If the record does not exist, the callback receives `undefined` as the second argument -- no error is raised.

## Example

```javascript
_Pict.Bibliograph.read('FruitData', 'apple-001',
	function (pError, pRecord)
	{
		if (pError) { return console.error(pError); }

		if (pRecord)
		{
			console.log('Name:', pRecord.Name);
			console.log('Color:', pRecord.Color);
		}
		else
		{
			console.log('Record not found.');
		}
	});
```

## Read-Modify-Write Pattern

```javascript
_Pict.Bibliograph.read('FruitData', 'apple-001',
	function (pError, pRecord)
	{
		if (pError) { return console.error(pError); }

		// Modify the record
		pRecord.Weight = 195;
		pRecord.LastUpdated = new Date().toISOString();

		// Write it back (merge semantics)
		_Pict.Bibliograph.write('FruitData', 'apple-001', pRecord,
			function (pWriteError)
			{
				console.log('Record updated.');
			});
	});
```

## Notes

- Both `pSourceHash` and `pRecordGUID` must be non-empty strings
- Returns `undefined` (not an error) when the record does not exist
- The returned object is the full record (all fields), not a partial record
- To access metadata or change history, use `readRecordMetadata()` or `readRecordDelta()`
