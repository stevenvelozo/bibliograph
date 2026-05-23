# API Reference

Complete method reference for the Bibliograph service.

## BibliographService

The main service class. Available at `_Pict.Bibliograph` after instantiation.

```javascript
const libPict = require('pict');
const libBibliograph = require('bibliograph');

let _Pict = new libPict();
_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
_Pict.instantiateServiceProvider('Bibliograph', pOptions);
```

If no `BibliographStorage` service exists on the Pict instance, the constructor automatically creates one using the file system provider. If no `BibliographRecordDiff` service exists, it creates that as well.

### Lifecycle

| Method | Description |
|--------|-------------|
| [`initialize(fCallback)`](initialize.md) | Initialize the storage provider |

### Source Management

| Method | Description |
|--------|-------------|
| [`createSource(pSourceHash, fCallback)`](createSource.md) | Create a named record collection |
| [`checkSourceExists(pSourceHash, fCallback)`](checkSourceExists.md) | Check if a source exists |

### Record Operations

| Method | Description |
|--------|-------------|
| [`write(pSourceHash, pRecordGUID, pRecord, fCallback)`](write.md) | Write or merge a record (upsert with deduplication) |
| [`read(pSourceHash, pRecordGUID, fCallback)`](read.md) | Read a record by GUID |
| [`delete(pSourceHash, pRecordGUID, fCallback)`](delete.md) | Delete a record |
| [`exists(pSourceHash, pRecordGUID, fCallback)`](exists.md) | Check if a record exists |

### Metadata & Deltas

| Method | Description |
|--------|-------------|
| [`readRecordMetadata(pSourceHash, pRecordGUID, fCallback)`](readRecordMetadata.md) | Read record metadata |
| [`readRecordDelta(pSourceHash, pRecordGUID, fCallback)`](readRecordDelta.md) | Read change history |

### Key Enumeration

| Method | Description |
|--------|-------------|
| [`readRecordKeys(pSourceHash, fCallback)`](readRecordKeys.md) | List all record GUIDs in a source |
| [`readRecordKeysByTimestamp(pSourceHash, pStart, pEnd, fCallback)`](readRecordKeysByTimestamp.md) | List GUIDs within a time range |

### Utility

| Method | Description |
|--------|-------------|
| [`recordHash(pString)`](recordHash.md) | Generate an MD5 hash of a string |

## BibliographRecordDiff

Available at `_Pict.BibliographRecordDiff` after Bibliograph instantiation.

| Method | Description |
|--------|-------------|
| [`diffRecords(pOldRecord, pNewRecord)`](diffRecords.md) | Compare two records, return compressed diff |
| [`generateDiffDelta(pOldRecord, pNewRecord, pDiff)`](generateDiffDelta.md) | Extract changed field values from a diff |
| [`generateDelta(pOldRecord, pNewRecord)`](generateDelta.md) | Diff and extract delta in one step |

## BibliographStorageBase

The abstract base class for storage providers. Exported as `require('bibliograph').BibliographStorageBase`.

See [Storage Providers](storage-providers.md) for details on implementing custom backends.

## Input Validation

All `BibliographService` methods that accept `pSourceHash` or `pRecordGUID` validate that these are non-empty strings. If validation fails, the callback receives an `Error`:

```javascript
_Pict.Bibliograph.read('', 'rec-001',
	function (pError, pRecord)
	{
		// pError.message: 'The source hash must be a string with data in it.'
	});
```

## Error Handling

All callbacks follow the Node.js convention `(pError, pResult)`. Errors from the storage provider are passed through to the caller. Warning-level messages are logged via `fable.log.warn()` for non-fatal issues (e.g., metadata comparison failures).
