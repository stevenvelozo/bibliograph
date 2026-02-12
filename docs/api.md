# API Reference

## BibliographService

The main service class. Available at `_Pict.Bibliograph` after instantiation.

### Constructor

```javascript
const libPict = require('pict');
const libBibliograph = require('bibliograph');

let _Pict = new libPict();
_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
_Pict.instantiateServiceProvider('Bibliograph', pOptions);
```

If no `BibliographStorage` service exists on the Pict instance, the constructor automatically creates one using the file system provider. If no `BibliographRecordDiff` service exists, it creates that as well.

### initialize(fCallback)

Initializes the storage provider. Must be called before any read/write operations.

```javascript
_Pict.Bibliograph.initialize(function (pError) { });
```

### createSource(pSourceHash, fCallback)

Creates a new source (record collection). The source hash must be a non-empty string.

```javascript
_Pict.Bibliograph.createSource('FruitData', function (pError) { });
```

### checkSourceExists(pSourceHash, fCallback)

Checks whether a source exists.

```javascript
_Pict.Bibliograph.checkSourceExists('FruitData',
	function (pError, pExists)
	{
		console.log(pExists); // true or false
	});
```

### write(pSourceHash, pRecordGUID, pRecord, fCallback)

Writes a record to a source. If the record already exists, the new data is merged with the existing record. If the merged content is identical (by hash), the write is skipped.

- `pSourceHash` -- Non-empty string identifying the source
- `pRecordGUID` -- Non-empty string identifying the record
- `pRecord` -- A JavaScript object

```javascript
_Pict.Bibliograph.write('FruitData', 'apple-001',
	{ Name: 'Apple', Color: 'Red', Weight: 182 },
	function (pError) { });
```

### read(pSourceHash, pRecordGUID, fCallback)

Reads a record. Returns `undefined` if the record does not exist.

```javascript
_Pict.Bibliograph.read('FruitData', 'apple-001',
	function (pError, pRecord)
	{
		// pRecord is { Name: 'Apple', Color: 'Red', Weight: 182 }
		// or undefined if not found
	});
```

### delete(pSourceHash, pRecordGUID, fCallback)

Deletes a record. Updates the metadata with a `Deleted` timestamp.

```javascript
_Pict.Bibliograph.delete('FruitData', 'apple-001',
	function (pError) { });
```

### exists(pSourceHash, pRecordGUID, fCallback)

Checks whether a record exists.

```javascript
_Pict.Bibliograph.exists('FruitData', 'apple-001',
	function (pError, pExists)
	{
		console.log(pExists); // true or false
	});
```

### readRecordKeys(pSourceHash, fCallback)

Returns an array of all record GUIDs in a source.

```javascript
_Pict.Bibliograph.readRecordKeys('FruitData',
	function (pError, pKeys)
	{
		console.log(pKeys); // ['apple-001', 'banana-002', ...]
	});
```

### readRecordKeysByTimestamp(pSourceHash, pStartTime, pEndTime, fCallback)

Returns record GUIDs with ingest timestamps within the given range.

- `pStartTime` -- A `Date` object for the range start
- `pEndTime` -- A `Date` object for the range end

```javascript
let tmpStart = new Date('2025-01-01');
let tmpEnd = new Date();

_Pict.Bibliograph.readRecordKeysByTimestamp('FruitData', tmpStart, tmpEnd,
	function (pError, pKeys)
	{
		console.log(pKeys); // GUIDs ingested within the time range
	});
```

### readRecordMetadata(pSourceHash, pRecordGUID, fCallback)

Returns the metadata object for a record.

```javascript
_Pict.Bibliograph.readRecordMetadata('FruitData', 'apple-001',
	function (pError, pMetadata)
	{
		// pMetadata:
		// {
		//   GUID: 'apple-001',
		//   Length: 45,
		//   QHash: 'HSH-1024085287',
		//   MD5: '461d65fea865254459a3c57f2f554ccf',
		//   Ingest: 1706900000000
		// }
	});
```

### readRecordDelta(pSourceHash, pRecordGUID, fCallback)

Returns the delta history for a record.

```javascript
_Pict.Bibliograph.readRecordDelta('FruitData', 'apple-001',
	function (pError, pDeltaContainer)
	{
		// pDeltaContainer:
		// {
		//   RecordGUID: 'apple-001',
		//   Deltas: [
		//     { Delta: { Color: 'Green' }, Ingest: 1706900050000 },
		//     { Delta: { Weight: 195 }, Ingest: 1706900100000 }
		//   ]
		// }
	});
```

### recordHash(pString)

Generates an MD5 hash of the given string. Useful for generating GUIDs from record content.

```javascript
let tmpGUID = _Pict.Bibliograph.recordHash(JSON.stringify(myRecord));
```

## BibliographRecordDiff

Available at `_Pict.BibliographRecordDiff` after Bibliograph instantiation.

### diffRecords(pOldRecord, pNewRecord)

Compares two record objects and returns a compressed diff result.

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 42 }
);
// { M: 0, V: ['Age'] }
```

### generateDiffDelta(pOldRecord, pNewRecord, pDiff)

Given two records and a diff result, returns an object containing only the changed values from the new record. Returns `false` if no changes.

```javascript
let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(oldRecord, newRecord);
let tmpDelta = _Pict.BibliographRecordDiff.generateDiffDelta(oldRecord, newRecord, tmpDiff);
// { Age: 42 }
```

### generateDelta(pOldRecord, pNewRecord)

Convenience method that combines `diffRecords` and `generateDiffDelta`. Returns a delta object or `false` if no changes.

```javascript
let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 42 }
);
// { Age: 42 }

tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
	{ Name: 'Alice', Age: 41 },
	{ Name: 'Alice', Age: 41 }
);
// false (no changes)
```

## BibliographStorageBase

The abstract base class for storage providers. Exported as `require('bibliograph').BibliographStorageBase`.

See [Storage Providers](storage-providers.md) for details on implementing custom backends.
