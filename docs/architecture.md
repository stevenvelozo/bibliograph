# Architecture

Bibliograph is structured as a set of Pict services organized into three layers: the main service facade, a pluggable storage provider, and supporting services for record comparison and format conversion.

## Service Hierarchy

```mermaid
graph TB
	subgraph Pict Instance
		BIB["Bibliograph<br/>(BibliographService)"]
		STORE["BibliographStorage<br/>(BibliographStorageFS or custom)"]
		DIFF["BibliographRecordDiff<br/>(BibliographRecordDiff)"]
	end
	BIB -->|"delegates storage"| STORE
	BIB -->|"auto-provisions"| DIFF
	STORE -->|"extends"| BASE["BibliographStorageBase"]
```

All three services are registered on the Pict instance and are accessible as `_Pict.Bibliograph`, `_Pict.BibliographStorage`, and `_Pict.BibliographRecordDiff`.

## Class Hierarchy

```mermaid
classDiagram
	class BibliographService {
		+serviceType: 'Bibliograph'
		+initialize(fCallback)
		+recordHash(pString)
		+createSource(pSourceHash, fCallback)
		+checkSourceExists(pSourceHash, fCallback)
		+write(pSourceHash, pRecordGUID, pRecord, fCallback)
		+read(pSourceHash, pRecordGUID, fCallback)
		+delete(pSourceHash, pRecordGUID, fCallback)
		+exists(pSourceHash, pRecordGUID, fCallback)
		+readRecordKeys(pSourceHash, fCallback)
		+readRecordKeysByTimestamp(pSourceHash, pStart, pEnd, fCallback)
		+readRecordMetadata(pSourceHash, pRecordGUID, fCallback)
		+readRecordDelta(pSourceHash, pRecordGUID, fCallback)
	}
	class BibliographStorageBase {
		+serviceType: 'BibliographStorage'
		+initialize(fCallback)
		+sourceExists(pSourceHash, fCallback)
		+sourceCreate(pSourceHash, fCallback)
		+generateMetadataForRecord(pRecordGUID, pJSON)
		+generateDeltaContainer(pRecordGUID)
		+write(pSourceHash, pRecordGUID, pRecord, fCallback)
		+delete(pSourceHash, pRecordGUID, fCallback)
		+read(pSourceHash, pRecordGUID, fCallback)
		+persistRecord(pSourceHash, pRecordGUID, pJSON, fCallback)
		+persistDelete(pSourceHash, pRecordGUID, fCallback)
		+readRecordMetadata(pSourceHash, pRecordGUID, fCallback)
		+persistRecordMetadata(pSourceHash, pRecordGUID, pMeta, fCallback)
		+readRecordDelta(pSourceHash, pRecordGUID, fCallback)
		+persistRecordDelta(pSourceHash, pMeta, pDelta, fCallback)
		+writeRecordDelta(pSourceHash, pMeta, pDelta, fCallback)
	}
	class BibliographStorageFS {
		+StorageFolder: string
		+Initialized: boolean
		+setStorageFolder(pPath)
		+createStorageFolder(fCallback)
		+checkStorageFolder(fCallback)
		+createSourceFolder(pSourceHash, fCallback)
		+getRecordFileLocationData(pSourceHash, pRecordGUID)
	}
	class BibliographRecordDiff {
		+serviceType: 'BibliographRecordDiff'
		+diffRecords(pOldRecord, pNewRecord)
		+generateDiffDelta(pOldRecord, pNewRecord, pDiff)
		+generateDelta(pOldRecord, pNewRecord)
	}
	BibliographService --> BibliographStorageBase : delegates to
	BibliographService --> BibliographRecordDiff : uses
	BibliographStorageBase <|-- BibliographStorageFS
```

## BibliographService

The main service class (`source/Bibliograph.js`) extends `ServiceProviderBase`. It acts as the public API and delegates all storage operations to the storage provider.

Responsibilities:

- Input validation (source hashes and record GUIDs must be non-empty strings)
- MD5 hash generation via `recordHash()`
- Automatic provisioning of the storage provider and diff service on construction

When instantiated, it checks whether `BibliographStorage` and `BibliographRecordDiff` services already exist on the Pict instance. If not, it creates them automatically. This means you can swap in a custom storage provider before instantiating Bibliograph, and it will use yours instead.

## Write Flow

The write operation is the most complex flow in Bibliograph. It handles merging, deduplication, metadata, and delta tracking:

```mermaid
flowchart TD
	A["write(hash, guid, record, cb)"] --> B["read existing record"]
	B --> C["Merge: { ...existing, ...new }"]
	C --> D["JSON.stringify merged record"]
	D --> E["generateMetadataForRecord()"]
	E --> F{Metadata check enabled?}
	F -->|Yes| G["readRecordMetadata()"]
	G --> H{Content changed?}
	H -->|No - same hash| I["Skip write"]
	H -->|Yes - different| J["Continue"]
	F -->|No| J
	J --> K{Delta tracking enabled?}
	K -->|Yes| L["diffRecords + generateDelta"]
	L --> M["writeRecordDelta()"]
	K -->|No| N["Skip delta"]
	M --> O["persistRecordMetadata()"]
	N --> O
	O --> P["persistRecord()"]
	P --> Q["stampRecordTimestamp()"]
	Q --> R["callback()"]
	I --> R
```

## Delete Flow

```mermaid
flowchart TD
	A["delete(hash, guid, cb)"] --> B["readRecordMetadata()"]
	B --> C{Metadata exists?}
	C -->|Yes| D["Set metadata.Deleted = timestamp"]
	D --> E["persistRecordMetadata()"]
	C -->|No| F["Generate stub metadata"]
	E --> G["persistDelete()"]
	F --> G
	G --> H["callback()"]
```

## Storage Provider

The storage layer uses a base class / concrete implementation pattern.

**BibliographStorageBase** (`source/providers/storage/Bibliograph-Storage-Base.js`) extends `pict-provider` and defines the full storage interface. Its default implementations return empty results -- it is designed to be extended.

**BibliographStorageFS** (`source/providers/storage/Bibliograph-Storage-FS.js`) is the built-in concrete implementation. It stores records as JSON files on the local file system.

The base class contains the core write logic:

1. Read the existing record (if any)
2. Merge the new partial record with the existing record
3. Generate metadata (GUID, Length, QHash, MD5, Ingest timestamp)
4. Compare new metadata with existing metadata
5. If content is unchanged, skip the write
6. If content changed, generate and store a delta
7. Persist the record, metadata, and update the timestamp

This logic lives in the base class so all storage providers share the same deduplication and delta behavior.

## Storage Provider Architecture

```mermaid
graph TB
	subgraph "Bibliograph Core"
		BSB["BibliographStorageBase<br/>(write/delete logic, metadata, deltas)"]
	end
	subgraph "Built-in"
		BSFS["BibliographStorageFS<br/>(JSON files on disk)"]
	end
	subgraph "External Providers"
		BSM["bibliograph-storage-meadow<br/>(SQLite, MySQL, PostgreSQL, MSSQL)"]
		BSL["bibliograph-storage-lmdb"]
		BSLDB["bibliograph-storage-leveldb"]
		BSR["bibliograph-storage-rocksdb"]
	end
	BSB --> BSFS
	BSB --> BSM
	BSB --> BSL
	BSB --> BSLDB
	BSB --> BSR
```

## File System Layout

The FS storage provider creates this folder structure:

```
<storage-folder>/
  <source-hash>/
    metadata/       _<GUID>_metadata.json
    record/         <GUID>.json
    history/        _<GUID>_deltas.json
```

Each source gets its own folder with three subfolders for the three types of data. Record files contain the raw JSON object. Metadata files contain hash and timestamp data. History files contain an array of delta entries.

## Record Diff Service

**BibliographRecordDiff** (`source/services/record/Bibliograph-Record-Diff.js`) compares two JSON record objects and identifies which fields differ.

```mermaid
flowchart LR
	A["Old Record"] --> D["diffRecords()"]
	B["New Record"] --> D
	D --> E{Match?}
	E -->|"M: 1"| F["No changes"]
	E -->|"M: 0"| G["V: changed field names"]
	G --> H["generateDiffDelta()"]
	H --> I["Delta object with new values"]
```

The diff result uses a compressed format optimized for storage at scale:

```javascript
// Records match:
{ "M": 1, "V": [] }

// Records differ:
{ "M": 0, "V": ["Age", "Height"] }
```

- `M` -- Match flag. `1` means identical, `0` means modified.
- `V` -- Value array. Lists the field names that differ between old and new.

The `generateDelta()` method combines comparison and extraction, returning an object containing only the changed fields and their new values, or `false` if nothing changed.

## Metadata Structure

Every record write generates a metadata object:

```json
{
	"GUID": "rec-001",
	"Length": 42,
	"QHash": "HSH-1024085287",
	"MD5": "461d65fea865254459a3c57f2f554ccf",
	"Ingest": 1706900000000
}
```

- **GUID** -- The record identifier
- **Length** -- Character count of the serialized JSON
- **QHash** -- A fast insecure hash for quick comparison (CRC-like)
- **MD5** -- Full MD5 hash of the serialized JSON
- **Ingest** -- Millisecond timestamp of when the record was written

The deduplication check compares Length, then QHash, then MD5 -- stopping early when possible for performance.

## Deduplication Check Order

```mermaid
flowchart TD
	A["New metadata"] --> B{GUID match?}
	B -->|No| C["ERROR: GUID mismatch"]
	B -->|Yes| D{Length match?}
	D -->|No| E["Record changed -- write"]
	D -->|Yes| F{QHash match?}
	F -->|No| G["Record changed -- write"]
	F -->|Yes| H{MD5 match?}
	H -->|No| I["Record changed -- write"]
	H -->|Yes| J["Identical -- skip write"]
```

## Delta Container Structure

When delta tracking is enabled, changes are stored in a container:

```json
{
	"RecordGUID": "rec-001",
	"Deltas": [
		{
			"Delta": { "Age": 42 },
			"Ingest": 1706900050000
		},
		{
			"Delta": { "Age": 870 },
			"Ingest": 1706900100000
		}
	]
}
```

Each entry in the `Deltas` array contains only the fields that changed and the timestamp of the change.

## Async Pattern

All operations use Node.js-style callbacks (`function (pError, pResult)`). Sequencing of multiple async steps uses Pict's `Anticipate` pattern, which queues callbacks and runs them in order.

```javascript
let tmpAnticipate = _Pict.newAnticipate();

tmpAnticipate.anticipate(function (fNext) { /* step 1 */ fNext(); });
tmpAnticipate.anticipate(function (fNext) { /* step 2 */ fNext(); });

tmpAnticipate.wait(function (pError) { /* all done */ });
```
