# exists()

Check whether a specific record exists in a source.

## Signature

```javascript
_Pict.Bibliograph.exists(pSourceHash, pRecordGUID, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pSourceHash` | `string` | Source to check. Must be a non-empty string. |
| `pRecordGUID` | `string` | Record identifier. Must be a non-empty string. |
| `fCallback` | `Function` | Callback invoked as `fCallback(pError, pExists)` |

## Callback Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `pError` | `Error\|null` | Error object if the check failed |
| `pExists` | `boolean` | `true` if the record exists, `false` otherwise |

## Description

Validates both parameters, then delegates to the storage provider's `exists()` method.

For the file system provider, this checks whether the record's JSON file exists on disk. For database-backed providers, this queries the record table.

## Example

```javascript
_Pict.Bibliograph.exists('FruitData', 'apple-001',
	function (pError, pExists)
	{
		if (pError) { return console.error(pError); }
		console.log(pExists); // true or false
	});
```

## Conditional Write

```javascript
_Pict.Bibliograph.exists('FruitData', 'apple-001',
	function (pError, pExists)
	{
		if (pError) { return console.error(pError); }

		if (!pExists)
		{
			_Pict.Bibliograph.write('FruitData', 'apple-001',
				{ Name: 'Apple', Color: 'Red' },
				function (pWriteError)
				{
					console.log('Created new record.');
				});
		}
		else
		{
			console.log('Record already exists.');
		}
	});
```

## Notes

- Both `pSourceHash` and `pRecordGUID` must be non-empty strings
- Returns `false` (not an error) when the record does not exist
- This only checks for the record data -- metadata and delta files may exist independently
