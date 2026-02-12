# Metadata

Every record in Bibliograph has an associated metadata object that is generated automatically on each write. Metadata enables deduplication and provides an audit trail of when records were ingested.

## Metadata Structure

```json
{
	"GUID": "A",
	"Length": 25,
	"QHash": "HSH-1024085287",
	"MD5": "461d65fea865254459a3c57f2f554ccf",
	"Ingest": 1706900000000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `GUID` | string | The record's unique identifier |
| `Length` | number | Character count of the serialized JSON string |
| `QHash` | string | A fast insecure CRC-like hash, prefixed with `HSH-` |
| `MD5` | string | Full MD5 hash of the serialized JSON string |
| `Ingest` | number | Millisecond timestamp of when the record was last written |

When a record is deleted, a `Deleted` field is added:

```json
{
	"GUID": "A",
	"Length": 25,
	"QHash": "HSH-1024085287",
	"MD5": "461d65fea865254459a3c57f2f554ccf",
	"Ingest": 1706900000000,
	"Deleted": 1706900500000
}
```

## Read Metadata

### Signature

```javascript
_Pict.Bibliograph.readRecordMetadata(pSourceHash, pRecordGUID, fCallback)
```

- `pSourceHash` -- String. The source containing the record.
- `pRecordGUID` -- String. The record GUID.
- `fCallback` -- Function. Called with `(pError, pMetadata)`.

### Basic Usage

```javascript
_Pict.Bibliograph.readRecordMetadata('UnitTestManual', 'A',
	function (pError, pMetadata)
	{
		console.log(pMetadata.GUID);    // 'A'
		console.log(pMetadata.Length);   // 25
		console.log(pMetadata.QHash);   // 'HSH-1024085287'
		console.log(pMetadata.MD5);     // '461d65fea865254459a3c57f2f554ccf'
		console.log(pMetadata.Ingest);  // 1706900000000
	});
```

## Metadata Changes on Update

When a record is updated, the metadata reflects the new content. The unit tests demonstrate this by writing a record, checking its metadata, updating it, and checking again:

```javascript
// Write: { Name: 'Alice', Age: 41 }
_Pict.Bibliograph.write('UnitTestManual', 'A',
	{ Name: 'Alice', Age: 41 },
	function (pError)
	{
		_Pict.Bibliograph.readRecordMetadata('UnitTestManual', 'A',
			function (pError, pMetadata)
			{
				console.log(pMetadata.MD5);    // '461d65fea865254459a3c57f2f554ccf'
				console.log(pMetadata.Length);  // 25
				console.log(pMetadata.QHash);  // 'HSH-1024085287'

				// Update Age to 870
				_Pict.Bibliograph.write('UnitTestManual', 'A',
					{ Age: 870 },
					function (pError)
					{
						_Pict.Bibliograph.readRecordMetadata('UnitTestManual', 'A',
							function (pError, pMetadata)
							{
								console.log(pMetadata.MD5);    // 'e67ddd09559f12dc1740bfb11212b3bf'
								console.log(pMetadata.Length);  // 26
								console.log(pMetadata.QHash);  // 'HSH-1681750157'
								// All three values changed because the record content changed
							});
					});
			});
	});
```

## How Deduplication Uses Metadata

When `Bibliograph-Check-Metadata-On-Write` is enabled, the write operation compares new metadata against existing metadata in this order:

1. **Length** -- If the serialized lengths differ, the record has changed (fast check)
2. **QHash** -- If lengths match but QHash differs, the record has changed (fast hash)
3. **MD5** -- If both length and QHash match but MD5 differs, the record has changed (definitive)
4. **All match** -- The record is unchanged; skip the write

This tiered approach provides fast rejection for obviously different records while still catching subtle changes through MD5.

## File System Storage

In the FS provider, metadata files are stored alongside record files:

```
data/MySource/metadata/_rec-001_metadata.json
```

The metadata file contains the JSON metadata object and is updated on every successful write.

## Generating a Hash Manually

The `recordHash()` method on the Bibliograph service produces the same MD5 hash used internally:

```javascript
let tmpHash = _Pict.Bibliograph.recordHash(JSON.stringify({ Name: 'Alice', Age: 41 }));
console.log(tmpHash); // '461d65fea865254459a3c57f2f554ccf'
```

This is useful for pre-computing record hashes or generating content-based GUIDs.
