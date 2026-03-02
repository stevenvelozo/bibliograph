# readRecordDelta()

Read the change history (delta container) for a record.

## Signature

```javascript
_Pict.Bibliograph.readRecordDelta(pSourceHash, pRecordGUID, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pSourceHash` | `string` | Source containing the record. Must be a non-empty string. |
| `pRecordGUID` | `string` | Record identifier. Must be a non-empty string. |
| `fCallback` | `Function` | Callback invoked as `fCallback(pError, pDeltaContainer)` |

## Callback Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `pError` | `Error\|null` | Error object if the read failed |
| `pDeltaContainer` | `object` | Delta container with `RecordGUID` and `Deltas` array |

## Description

Validates both parameters, then delegates to the storage provider's `readRecordDelta()` method. Returns a delta container that tracks all field-level changes made to the record over time.

If no delta history exists, a fresh empty container is returned.

## Delta Container Format

```json
{
	"RecordGUID": "apple-001",
	"Deltas": [
		{
			"Delta": { "Color": "Green" },
			"Ingest": 1706900050000
		},
		{
			"Delta": { "Weight": 195 },
			"Ingest": 1706900100000
		}
	]
}
```

Each delta entry contains:
- `Delta` -- An object with only the fields that changed and their new values
- `Ingest` -- Epoch millisecond timestamp of when the change occurred

## Example

```javascript
_Pict.Bibliograph.readRecordDelta('FruitData', 'apple-001',
	function (pError, pDeltaContainer)
	{
		if (pError) { return console.error(pError); }

		console.log('Record:', pDeltaContainer.RecordGUID);
		console.log('Changes:', pDeltaContainer.Deltas.length);

		pDeltaContainer.Deltas.forEach(
			function (pEntry)
			{
				console.log('At', new Date(pEntry.Ingest), ':', pEntry.Delta);
			});
	});
```

## Notes

- Both `pSourceHash` and `pRecordGUID` must be non-empty strings
- Always returns a valid container object -- never returns `undefined`
- Deltas are only recorded when `Bibliograph-Store-Deltas` is `true` (default)
- If delta tracking is disabled, the container will have an empty `Deltas` array
