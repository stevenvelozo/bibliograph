# createSource()

Create a new source (record collection).

## Signature

```javascript
_Pict.Bibliograph.createSource(pSourceHash, fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pSourceHash` | `string` | Unique source identifier. Must be a non-empty string. |
| `fCallback` | `Function` | Callback invoked as `fCallback(pError)` |

## Description

Creates a named collection for storing records. A source acts as a namespace -- records in one source are isolated from records in another. Typical source names might represent data feeds, API endpoints, or batch imports.

Validates that `pSourceHash` is a non-empty string before delegating to the storage provider's `sourceCreate()` method.

For the file system provider, this creates a directory with three subfolders (`metadata/`, `record/`, `history/`). For database-backed providers, this creates a source registry entry.

## Example

```javascript
_Pict.Bibliograph.createSource('product-catalog',
	function (pError)
	{
		if (pError) { return console.error(pError); }
		console.log('Source created.');
	});
```

## Multiple Sources

```javascript
let tmpAnticipate = _Pict.newAnticipate();

tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));

tmpAnticipate.anticipate(
	function (fNext)
	{
		_Pict.Bibliograph.createSource('customers', fNext);
	});

tmpAnticipate.anticipate(
	function (fNext)
	{
		_Pict.Bibliograph.createSource('orders', fNext);
	});

tmpAnticipate.anticipate(
	function (fNext)
	{
		_Pict.Bibliograph.createSource('products', fNext);
	});

tmpAnticipate.wait(
	function (pError)
	{
		if (pError) console.error(pError);
		else console.log('All sources ready.');
	});
```

## Notes

- The source hash must be a non-empty string -- passing an empty string or non-string produces an error
- Does not check for duplicate sources -- call `checkSourceExists()` first if uniqueness matters
- A source must be created before writing records into it
