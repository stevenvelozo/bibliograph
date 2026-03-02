# readRecordKeys()

List all record GUIDs in a source.

## Signature

```javascript
_Pict.Bibliograph.readRecordKeys(pSourceHash, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pSourceHash` | `string` | Source to enumerate. Must be a non-empty string. |
| `fCallback` | `Function` | Callback invoked as `fCallback(pError, pKeys)` |

## Callback Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `pError` | `Error\|null` | Error object if the enumeration failed |
| `pKeys` | `string[]` | Array of record GUID strings |

## Description

Validates the source hash, then delegates to the storage provider's `readRecordKeys()` method. Returns an array of all record GUIDs stored in the given source.

For the file system provider, this reads the `record/` directory and strips the `.json` extension from file names. For database-backed providers, this queries the record table.

## Example

```javascript
_Pict.Bibliograph.readRecordKeys('FruitData',
	function (pError, pKeys)
	{
		if (pError) { return console.error(pError); }

		console.log(`Found ${pKeys.length} records:`);
		pKeys.forEach(
			function (pKey)
			{
				console.log(' -', pKey);
			});
		// => apple-001, banana-002, cherry-003
	});
```

## Iterating All Records

```javascript
_Pict.Bibliograph.readRecordKeys('FruitData',
	function (pError, pKeys)
	{
		if (pError) { return console.error(pError); }

		let tmpAnticipate = _Pict.newAnticipate();

		pKeys.forEach(
			function (pKey)
			{
				tmpAnticipate.anticipate(
					function (fNext)
					{
						_Pict.Bibliograph.read('FruitData', pKey,
							function (pReadError, pRecord)
							{
								if (pReadError) { return fNext(pReadError); }
								console.log(pKey, ':', pRecord.Name);
								fNext();
							});
					});
			});

		tmpAnticipate.wait(
			function (pWaitError)
			{
				console.log('All records processed.');
			});
	});
```

## Notes

- The source hash must be a non-empty string
- Returns an empty array (not an error) when no records exist
- Only record GUIDs are returned, not full record data
- Deleted records are excluded (for FS provider, the file is physically removed on delete)
