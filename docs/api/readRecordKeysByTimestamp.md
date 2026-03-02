# readRecordKeysByTimestamp()

List record GUIDs within a specific time range.

## Signature

```javascript
_Pict.Bibliograph.readRecordKeysByTimestamp(pSourceHash, pStartTime, pEndTime, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pSourceHash` | `string` | Source to query. Must be a non-empty string. |
| `pStartTime` | `Date\|number` | Start of the time range (inclusive) |
| `pEndTime` | `Date\|number` | End of the time range (inclusive) |
| `fCallback` | `Function` | Callback invoked as `fCallback(pError, pKeys)` |

## Callback Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `pError` | `Error\|null` | Error object if the query failed |
| `pKeys` | `string[]` | Array of record GUID strings within the time range |

## Description

Validates the source hash, then delegates to the storage provider's `readRecordKeysByTimestamp()` method. Returns GUIDs of records whose ingest timestamps fall within the given range.

For the file system provider, this checks the modified time of metadata files. For database-backed providers (Meadow), this queries the `RecordTimestamp` column.

## Example

```javascript
let tmpStart = new Date('2025-01-01');
let tmpEnd = new Date();

_Pict.Bibliograph.readRecordKeysByTimestamp('FruitData', tmpStart, tmpEnd,
	function (pError, pKeys)
	{
		if (pError) { return console.error(pError); }

		console.log(`${pKeys.length} records ingested in range:`);
		pKeys.forEach(
			function (pKey)
			{
				console.log(' -', pKey);
			});
	});
```

## Incremental Sync

```javascript
// Track the last sync time
let tmpLastSync = loadLastSyncTime(); // from config or database
let tmpNow = new Date();

_Pict.Bibliograph.readRecordKeysByTimestamp('data-feed', tmpLastSync, tmpNow,
	function (pError, pKeys)
	{
		if (pError) { return console.error(pError); }

		console.log(`${pKeys.length} records changed since last sync.`);

		// Process only changed records
		pKeys.forEach(
			function (pKey)
			{
				_Pict.Bibliograph.read('data-feed', pKey,
					function (pReadError, pRecord)
					{
						syncToExternal(pKey, pRecord);
					});
			});

		saveLastSyncTime(tmpNow);
	});
```

## Notes

- The source hash must be a non-empty string
- Timestamps can be `Date` objects or epoch millisecond numbers
- Both range boundaries are inclusive
- Returns an empty array when no records match the range
- The timestamp used for comparison depends on the storage provider (file modification time for FS, `RecordTimestamp` for Meadow)
