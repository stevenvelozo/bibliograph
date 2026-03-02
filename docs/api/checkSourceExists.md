# checkSourceExists()

Check whether a source exists.

## Signature

```javascript
_Pict.Bibliograph.checkSourceExists(pSourceHash, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pSourceHash` | `string` | Source identifier to check. Must be a non-empty string. |
| `fCallback` | `Function` | Callback invoked as `fCallback(pError, pExists)` |

## Callback Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `pError` | `Error\|null` | Error object if the check failed |
| `pExists` | `boolean` | `true` if the source exists, `false` otherwise |

## Description

Validates that `pSourceHash` is a non-empty string, then delegates to the storage provider's `checkSourceExists()` method.

For the file system provider, this checks whether the source folder exists on disk. For database-backed providers, this queries the source registry.

## Example

```javascript
_Pict.Bibliograph.checkSourceExists('product-catalog',
	function (pError, pExists)
	{
		if (pError) { return console.error(pError); }

		if (pExists)
		{
			console.log('Source exists.');
		}
		else
		{
			console.log('Source not found -- creating...');
			_Pict.Bibliograph.createSource('product-catalog',
				function (pCreateError)
				{
					if (pCreateError) { return console.error(pCreateError); }
					console.log('Source created.');
				});
		}
	});
```

## Notes

- The source hash must be a non-empty string
- Returns `false` (not an error) when no matching source is found
