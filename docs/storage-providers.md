# Storage Providers

Bibliograph uses a pluggable storage architecture. The built-in file system provider works for most use cases, but alternative backends are available for higher throughput.

## Built-in: File System

The default provider stores records as individual JSON files organized in folders. No additional dependencies are required.

```
data/
  MySource/
    metadata/
      _rec-001_metadata.json
      _rec-002_metadata.json
    record/
      rec-001.json
      rec-002.json
    history/
      _rec-001_deltas.json
```

Configure the storage path:

```javascript
let _Pict = new libPict(
	{
		"Bibliograph-Storage-FS-Path": "/var/data/bibliograph"
	});
```

The FS provider is suitable for development, moderate-scale ingestion, and scenarios where human-readable files are useful for debugging.

## Alternative Backends

Three additional storage providers are available as separate packages:

| Package | Backend | Best For |
|---------|---------|----------|
| `bibliograph-storage-lmdb` | LMDB | High-read workloads, embedded apps |
| `bibliograph-storage-leveldb` | LevelDB | General purpose, balanced read/write |
| `bibliograph-storage-rocksdb` | RocksDB | Write-heavy workloads, large datasets |

### Using an Alternative Provider

Install the provider package, then register it as the `BibliographStorage` service type before instantiating Bibliograph.

```javascript
const libPict = require('pict');
const libBibliograph = require('bibliograph');
const libBibliographLMDB = require('bibliograph-storage-lmdb');

let _Pict = new libPict();

// Register the alternative storage provider FIRST
_Pict.addServiceTypeIfNotExists('BibliographStorage', libBibliographLMDB);
_Pict.instantiateServiceProvider('BibliographStorage', {});

// Now register Bibliograph -- it will find the existing storage provider
_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
_Pict.instantiateServiceProvider('Bibliograph', {});
```

The key is to register your storage provider before Bibliograph. When Bibliograph's constructor runs, it checks for an existing `BibliographStorage` service and uses it instead of creating the default FS provider.

## Writing a Custom Provider

Bibliograph includes a template for creating new storage providers at `templates/Bibliograph-Storage-Provider.js`.

A custom provider extends `BibliographStorageBase` and implements the following methods:

```javascript
const libBibliographStorageBase = require('bibliograph').BibliographStorageBase;

class MyStorageProvider extends libBibliographStorageBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	// Initialize your storage backend
	initialize(fCallback) { return fCallback(); }

	// Source management
	sourceCreate(pSourceHash, fCallback) { }
	checkSourceExists(pSourceHash, fCallback) { }

	// Record CRUD
	read(pSourceHash, pRecordGUID, fCallback) { }
	persistRecord(pSourceHash, pRecordGUID, pRecordJSONString, fCallback) { }
	persistDelete(pSourceHash, pRecordGUID, fCallback) { }
	exists(pSourceHash, pRecordGUID, fCallback) { }

	// Record enumeration
	readRecordKeys(pSourceHash, fCallback) { }
	readRecordKeysByTimestamp(pSourceHash, pFrom, pTo, fCallback) { }

	// Metadata persistence
	readRecordMetadata(pSourceHash, pRecordGUID, fCallback) { }
	persistRecordMetadata(pSourceHash, pRecordGUID, pMetadata, fCallback) { }

	// Delta persistence
	readRecordDelta(pSourceHash, pRecordGUID, fCallback) { }
	persistRecordDelta(pSourceHash, pMetadata, pDeltaContainer, fCallback) { }

	// Timestamp management
	stampRecordTimestamp(pSourceHash, pRecordGUID, fCallback) { }
}

module.exports = MyStorageProvider;
```

You do **not** need to implement the `write()` or `delete()` methods directly. The base class provides those and calls your `persistRecord()`, `persistDelete()`, `persistRecordMetadata()`, and `persistRecordDelta()` methods as needed. The base class handles the merge logic, deduplication, and delta generation.

### Method Contracts

**read(pSourceHash, pRecordGUID, fCallback)**
Callback signature: `(pError, pRecord)`. Return `undefined` or `false` if the record does not exist.

**persistRecord(pSourceHash, pRecordGUID, pRecordJSONString, fCallback)**
Receives the serialized JSON string to store. Callback signature: `(pError)`.

**readRecordMetadata(pSourceHash, pRecordGUID, fCallback)**
Callback signature: `(pError, pMetadata)`. Return `false` if no metadata exists.

**readRecordKeys(pSourceHash, fCallback)**
Callback signature: `(pError, pKeysArray)`. Return an array of GUID strings.

**readRecordKeysByTimestamp(pSourceHash, pFromTimestamp, pToTimestamp, fCallback)**
Callback signature: `(pError, pKeysArray)`. Filter keys by their ingest timestamp falling within the range.
