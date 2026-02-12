# Bibliograph

Bibliograph is a key-value record storage service designed for data ingestion pipelines. It stores raw JSON records organized by source, with built-in metadata tracking, hash-based deduplication, and field-level change history.

The library is part of the Retold Meadow module group and integrates with the Pict/Fable service provider ecosystem.

## What It Does

Bibliograph solves a common problem in data pipelines: tracking raw records across multiple ingestion runs. When you ingest data from an external source repeatedly, you need to know what changed, when it changed, and whether a write is even necessary.

Each record is stored with:

- An **MD5 hash** and a **quick hash** for fast deduplication
- A **metadata record** tracking ingest timestamps and content length
- An optional **delta history** recording which fields changed on each write

When you write a record that already exists with identical content, Bibliograph skips the write entirely. When a record does change, it stores only the delta -- the specific fields that differ.

## Key Concepts

**Sources** are named collections of records. You create a source before writing records into it. A source might represent a data feed, an API endpoint, or a batch import.

**Records** are JSON objects identified by a string GUID within a source. The GUID can be anything meaningful -- a database ID, a hash, or a value from the data itself.

**Metadata** is generated automatically on every write. It includes the record's MD5 hash, a quick insecure hash, the serialized length, and the ingest timestamp.

**Deltas** are change records stored when a write modifies an existing record. They capture which fields changed and what the new values are, forming a lightweight audit trail.

## Install

```bash
npm install bibliograph
```

## Quick Example

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

## Learn More

- [Quick Start](quick-start.md) -- Setup and first operations
- [Architecture](architecture.md) -- How the service is structured
- [Configuration](configuration.md) -- Settings reference
- [API Reference](api.md) -- Full method documentation
- [CLI](cli.md) -- Command-line interface
- [Data Operations](operations/write.md) -- Detailed guides for each operation
