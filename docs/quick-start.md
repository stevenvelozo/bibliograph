# Quick Start

## Installation

```bash
npm install bibliograph
```

Bibliograph depends on `pict` and `pict-provider`, which are installed automatically.

## Basic Setup

Bibliograph is a Pict service. You create a Pict instance, register the Bibliograph service type, and instantiate it.

```javascript
const libPict = require('pict');
const libBibliograph = require('bibliograph');

let _Pict = new libPict();

// Register the service type
_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);

// Create the service instance
_Pict.instantiateServiceProvider('Bibliograph', {});
```

After instantiation, the service is available at `_Pict.Bibliograph`, and the storage provider is at `_Pict.BibliographStorage`.

## Initialize and Create a Source

Before writing records, initialize the storage and create at least one source.

```javascript
let tmpAnticipate = _Pict.newAnticipate();

// Initialize storage (creates the data folder if needed)
tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));

// Create a named source
tmpAnticipate.anticipate(
	function (fNext)
	{
		_Pict.Bibliograph.createSource('MySource', fNext);
	});

tmpAnticipate.wait(
	function (pError)
	{
		if (pError) console.error('Setup failed:', pError);
		else console.log('Ready to store records.');
	});
```

## Write a Record

Each record needs a source name, a GUID string, and a JSON object.

```javascript
_Pict.Bibliograph.write('MySource', 'rec-001',
	{ Name: 'Alice', Age: 41, City: 'Portland' },
	function (pError)
	{
		if (pError) console.error(pError);
		else console.log('Record written.');
	});
```

## Read a Record

```javascript
_Pict.Bibliograph.read('MySource', 'rec-001',
	function (pError, pRecord)
	{
		console.log(pRecord);
		// { Name: 'Alice', Age: 41, City: 'Portland' }
	});
```

## Update with Partial Data

Writes are merged with the existing record. You only need to send the fields that changed.

```javascript
// Only update Age -- Name and City are preserved
_Pict.Bibliograph.write('MySource', 'rec-001',
	{ Age: 42 },
	function (pError)
	{
		// Record is now { Name: 'Alice', Age: 42, City: 'Portland' }
	});
```

## Check if a Record Exists

```javascript
_Pict.Bibliograph.exists('MySource', 'rec-001',
	function (pError, pExists)
	{
		console.log(pExists); // true
	});
```

## Delete a Record

```javascript
_Pict.Bibliograph.delete('MySource', 'rec-001',
	function (pError)
	{
		console.log('Record deleted.');
	});
```

## List All Record Keys

```javascript
_Pict.Bibliograph.readRecordKeys('MySource',
	function (pError, pKeys)
	{
		console.log(pKeys);
		// ['rec-001', 'rec-002', 'rec-003']
	});
```

## Custom Storage Path

By default records are stored in `./data`. Override this in the Pict settings.

```javascript
let _Pict = new libPict(
	{
		"Bibliograph-Storage-FS-Path": "/var/lib/myapp/bibliograph-data"
	});
```

## CLI Usage

Bibliograph also provides a command-line interface.

```bash
# Install globally or use npx
npm install -g bibliograph

# Create a source
bibliograph source_create MySource

# Write records from a JSON file
bibliograph write -s MySource -i records.json

# Read a record
bibliograph read -s MySource rec-001

# Delete a record
bibliograph delete -s MySource rec-001
```

## Next Steps

- [Configuration](configuration.md) -- All available settings
- [Data Operations](operations/write.md) -- Deep dive into each operation
- [Architecture](architecture.md) -- How the internals work
