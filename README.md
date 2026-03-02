# Bibliograph

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/bibliograph.svg)](https://www.npmjs.com/package/bibliograph)

Key-value record comprehension service for Node.js. Bibliograph stores raw JSON records organized by source with automatic metadata generation, hash-based deduplication, and field-level change tracking.

## Features

- **Source-Organized Storage** -- group records into named collections for multi-feed ingestion
- **Hash-Based Deduplication** -- MD5 and quick-hash comparison skips writes when content is unchanged
- **Partial Record Merging** -- writes merge new fields with existing records automatically
- **Field-Level Change Tracking** -- delta history records which fields changed on each write
- **Automatic Metadata** -- every write generates GUID, length, QHash, MD5, and ingest timestamp
- **Pluggable Storage Backends** -- built-in file system provider with LMDB, LevelDB, RocksDB, and Meadow backends available
- **CLI Tool** -- command-line interface for source management, record read/write/delete
- **Record Diff Engine** -- compressed diff format optimized for storage at scale
- **Pict Service Provider** -- integrates with the Fable/Pict service ecosystem via dependency injection

## Installation

```bash
npm install bibliograph
```

## Quick Start

```javascript
const libPict = require('pict');
const libBibliograph = require('bibliograph');

let _Pict = new libPict();
_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
_Pict.instantiateServiceProvider('Bibliograph', {});

let tmpAnticipate = _Pict.newAnticipate();

tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));

tmpAnticipate.anticipate(
	function (fNext)
	{
		_Pict.Bibliograph.createSource('Contacts', fNext);
	});

tmpAnticipate.anticipate(
	function (fNext)
	{
		_Pict.Bibliograph.write('Contacts', 'alice-001',
			{ Name: 'Alice', Age: 41 }, fNext);
	});

tmpAnticipate.anticipate(
	function (fNext)
	{
		_Pict.Bibliograph.read('Contacts', 'alice-001',
			function (pError, pRecord)
			{
				console.log(pRecord);
				// { Name: 'Alice', Age: 41 }
				fNext(pError);
			});
	});

tmpAnticipate.wait(
	function (pError)
	{
		if (pError) console.error(pError);
		console.log('Done.');
	});
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `Bibliograph-Check-Metadata-On-Write` | `true` | Compare metadata hashes before writing; skip unchanged records |
| `Bibliograph-Store-Deltas` | `true` | Store field-level change history on each write |
| `Bibliograph-Storage-FS-Path` | `"./data"` | Root folder for file system storage |
| `Bibliograph-Log-Write-Mismatch-Reason` | `false` | Log details about why a record was considered changed |

## API

### BibliographService

| Method | Description |
|--------|-------------|
| `initialize(fCallback)` | Initialize the storage provider |
| `createSource(pSourceHash, fCallback)` | Create a named record collection |
| `checkSourceExists(pSourceHash, fCallback)` | Check if a source exists |
| `write(pSourceHash, pRecordGUID, pRecord, fCallback)` | Write or merge a record (upsert with deduplication) |
| `read(pSourceHash, pRecordGUID, fCallback)` | Read a record by GUID |
| `delete(pSourceHash, pRecordGUID, fCallback)` | Delete a record |
| `exists(pSourceHash, pRecordGUID, fCallback)` | Check if a record exists |
| `readRecordKeys(pSourceHash, fCallback)` | List all record GUIDs in a source |
| `readRecordKeysByTimestamp(pSourceHash, pStart, pEnd, fCallback)` | List GUIDs within a time range |
| `readRecordMetadata(pSourceHash, pRecordGUID, fCallback)` | Read record metadata |
| `readRecordDelta(pSourceHash, pRecordGUID, fCallback)` | Read change history |
| `recordHash(pString)` | Generate an MD5 hash of a string |

### BibliographRecordDiff

| Method | Description |
|--------|-------------|
| `diffRecords(pOldRecord, pNewRecord)` | Compare two records, return compressed diff |
| `generateDiffDelta(pOldRecord, pNewRecord, pDiff)` | Extract changed field values from a diff |
| `generateDelta(pOldRecord, pNewRecord)` | Diff and extract delta in one step |

## CLI

```bash
bibliograph source_create MySource
bibliograph write -s MySource -i records.json
bibliograph read -s MySource rec-001
bibliograph delete -s MySource rec-001
```

## Storage Backends

| Package | Backend | Best For |
|---------|---------|----------|
| *(built-in)* | File System | Development, debugging, moderate scale |
| `bibliograph-storage-meadow` | Meadow DAL | SQL databases via Meadow (SQLite, MySQL, PostgreSQL, MSSQL) |
| `bibliograph-storage-lmdb` | LMDB | High-read workloads, embedded apps |
| `bibliograph-storage-leveldb` | LevelDB | General purpose, balanced read/write |
| `bibliograph-storage-rocksdb` | RocksDB | Write-heavy workloads, large datasets |

## Part of the Retold Framework

Bibliograph is a module in the [Retold](https://github.com/stevenvelozo/retold) meta-framework, part of the Meadow module group.

## Testing

```bash
npm test
```

## Related Packages

| Module | Purpose |
|--------|---------|
| [bibliograph-storage-meadow](https://github.com/stevenvelozo/bibliograph-storage-meadow) | Meadow DAL storage backend |
| [meadow](https://github.com/stevenvelozo/meadow) | Data access layer and ORM |
| [pict](https://github.com/stevenvelozo/pict) | MVC tools and application lifecycle |
| [fable](https://github.com/stevenvelozo/fable) | Application framework and service manager |
| [pict-provider](https://github.com/stevenvelozo/pict-provider) | Base class for Pict service providers |

## License

MIT

## Contributing

Pull requests are welcome. For details on our code of conduct, contribution process, and testing requirements, see the [Retold Contributing Guide](https://github.com/stevenvelozo/retold/blob/main/docs/contributing.md).
