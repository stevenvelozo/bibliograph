# delete()

Delete a record from a source.

## Signature

```javascript
_Pict.Bibliograph.delete(pSourceHash, pRecordGUID, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pSourceHash` | `string` | Source containing the record. Must be a non-empty string. |
| `pRecordGUID` | `string` | Record identifier. Must be a non-empty string. |
| `fCallback` | `Function` | Callback invoked as `fCallback(pError)` |

## Description

The delete operation performs these steps:

1. Reads the existing metadata for the record
2. If metadata exists, sets a `Deleted` timestamp on it and persists the updated metadata
3. Calls the storage provider's `persistDelete()` to remove the record data

For the file system provider, this physically removes the record JSON file. For database-backed providers (Meadow), this typically performs a soft delete.

The metadata is preserved with the `Deleted` timestamp so you can tell that the record existed and when it was removed.

## Example

```javascript
_Pict.Bibliograph.delete('FruitData', 'apple-001',
	function (pError)
	{
		if (pError) { return console.error(pError); }
		console.log('Record deleted.');
	});
```

## Verifying Deletion

```javascript
_Pict.Bibliograph.delete('FruitData', 'apple-001',
	function (pError)
	{
		if (pError) { return console.error(pError); }

		_Pict.Bibliograph.exists('FruitData', 'apple-001',
			function (pExistsError, pExists)
			{
				console.log('Still exists:', pExists);
				// false (for FS provider)
			});
	});
```

## Notes

- Both `pSourceHash` and `pRecordGUID` must be non-empty strings
- The metadata is updated with a `Deleted` timestamp before the record is removed
- If the record does not exist, the operation completes without error
- The delta history is not deleted -- change history is preserved
