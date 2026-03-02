# readRecordMetadata()

Read the metadata associated with a record.

## Signature

```javascript
_Pict.Bibliograph.readRecordMetadata(pSourceHash, pRecordGUID, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pSourceHash` | `string` | Source containing the record |
| `pRecordGUID` | `string` | Record identifier |
| `fCallback` | `Function` | Callback invoked as `fCallback(pError, pMetadata)` |

## Callback Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `pError` | `Error\|null` | Error object if the read failed |
| `pMetadata` | `object\|false` | Parsed metadata object, or `false` if no metadata exists |

## Description

Delegates to the storage provider's `readRecordMetadata()` method. Returns the metadata object that was automatically generated during the last `write()` operation.

## Metadata Format

```json
{
	"GUID": "apple-001",
	"Length": 45,
	"QHash": "HSH-1024085287",
	"MD5": "461d65fea865254459a3c57f2f554ccf",
	"Ingest": 1706900000000
}
```

| Field | Description |
|-------|-------------|
| `GUID` | The record identifier |
| `Length` | Character count of the serialized JSON |
| `QHash` | Fast insecure hash for quick comparison |
| `MD5` | Full MD5 hash of the serialized JSON |
| `Ingest` | Epoch millisecond timestamp of the last write |

## Example

```javascript
_Pict.Bibliograph.readRecordMetadata('FruitData', 'apple-001',
	function (pError, pMetadata)
	{
		if (pError) { return console.error(pError); }

		if (pMetadata)
		{
			console.log('Last ingested:', new Date(pMetadata.Ingest));
			console.log('Content hash:', pMetadata.MD5);
			console.log('Size:', pMetadata.Length, 'chars');
		}
		else
		{
			console.log('No metadata found.');
		}
	});
```

## Deleted Record Metadata

When a record is deleted, the metadata is updated with a `Deleted` timestamp:

```json
{
	"GUID": "apple-001",
	"Length": 45,
	"QHash": "HSH-1024085287",
	"MD5": "461d65fea865254459a3c57f2f554ccf",
	"Ingest": 1706900000000,
	"Deleted": 1706900500000
}
```

## Notes

- Returns `false` (not `undefined`) when no metadata exists
- Metadata is generated automatically by the `write()` operation
- The metadata object is independent of the record data -- it can exist even if the record was deleted
