# initialize()

Initialize the storage provider. Must be called before any read/write operations.

## Signature

```javascript
_Pict.Bibliograph.initialize(fCallback)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `fCallback` | `Function` | Callback invoked as `fCallback(pError)` when initialization is complete |

## Description

Delegates to `BibliographStorage.initialize()`. For the built-in file system provider, this creates the storage folder (defaulting to `./data`) and verifies write permissions. For custom providers (Meadow, LMDB, etc.), the behavior depends on the provider implementation.

Must be called once before any other Bibliograph operation. Attempting to read or write before initialization will result in errors from the storage provider.

## Example

```javascript
const libPict = require('pict');
const libBibliograph = require('bibliograph');

let _Pict = new libPict();
_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
_Pict.instantiateServiceProvider('Bibliograph', {});

_Pict.Bibliograph.initialize(
	function (pError)
	{
		if (pError) { return console.error('Init failed:', pError); }
		console.log('Bibliograph ready.');
	});
```

## With Anticipate

```javascript
let tmpAnticipate = _Pict.newAnticipate();

tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));

tmpAnticipate.anticipate(
	function (fNext)
	{
		// Storage is ready -- safe to create sources and write records
		_Pict.Bibliograph.createSource('MySource', fNext);
	});

tmpAnticipate.wait(
	function (pError)
	{
		if (pError) console.error(pError);
	});
```

## Notes

- Must be called once before any other Bibliograph method
- For the FS provider, creates the storage directory if it does not exist
- For database-backed providers (Meadow), may create tables or verify schema
- Safe to call multiple times -- the provider determines idempotency
