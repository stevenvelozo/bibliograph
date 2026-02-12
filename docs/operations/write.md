# Write

The `write` operation stores a JSON record in a source. It is the primary way to ingest data into Bibliograph.

## Signature

```javascript
_Pict.Bibliograph.write(pSourceHash, pRecordGUID, pRecord, fCallback)
```

- `pSourceHash` -- String. The name of the source to write into.
- `pRecordGUID` -- String. The unique identifier for this record within the source.
- `pRecord` -- Object. The JSON data to store.
- `fCallback` -- Function. Called with `(pError)` when complete.

## Basic Write

```javascript
_Pict.Bibliograph.write('Animals', 'turtle-001',
	{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Pink' },
	function (pError)
	{
		if (pError) console.error('Write failed:', pError);
		else console.log('Record written.');
	});
```

## Partial Updates (Merge Behavior)

When you write to an existing record, the new data is merged with the existing data using object spread. Fields in the new record overwrite matching fields in the existing record. Fields not present in the new record are preserved.

```javascript
// First write -- creates the record
_Pict.Bibliograph.write('Animals', 'turtle-001',
	{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Pink' },
	function (pError)
	{
		// Record is: { Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Pink' }

		// Second write -- only updates Color
		_Pict.Bibliograph.write('Animals', 'turtle-001',
			{ Color: 'Green' },
			function (pError)
			{
				// Record is now: { Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Green' }
			});
	});
```

This is the same pattern used in the debug harness Subsequent Writes exercise, where a record is written three times with only the `Color` field changing:

```javascript
// Write 1: { Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Pink' }
// Write 2: { Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Green' }
// Write 3: { Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Beautiful' }
```

Each write generates a delta recording the change to `Color`.

## Deduplication

When `Bibliograph-Check-Metadata-On-Write` is enabled (the default), Bibliograph compares the merged record against the existing record using hash comparison. If the content is identical, the write is skipped entirely.

The comparison chain is:

1. Compare serialized JSON **length** -- fast rejection for different-sized records
2. Compare **QHash** (insecure CRC-like hash) -- fast comparison for same-length records
3. Compare **MD5** hash -- definitive comparison

```javascript
// First write -- persists the record
_Pict.Bibliograph.write('Contacts', 'A',
	{ Name: 'Alice', Age: 41 },
	function (pError)
	{
		// Second write with identical data -- skipped, no disk I/O
		_Pict.Bibliograph.write('Contacts', 'A',
			{ Name: 'Alice', Age: 41 },
			function (pError)
			{
				// Nothing was written to disk because the hashes matched
			});
	});
```

This is particularly valuable in recurring ingestion pipelines where most records don't change between runs.

## Writing with Partial Data that Doesn't Change

If you write a subset of an existing record's fields and those fields already have the same values, the write is also skipped.

```javascript
// Record is { Name: 'Alice', Age: 41 }

// Write just Age: 41 -- same value, merged record is identical
_Pict.Bibliograph.write('Contacts', 'A',
	{ Age: 41 },
	function (pError)
	{
		// Skipped -- the merged record { Name: 'Alice', Age: 41 } is unchanged
	});
```

## Delta Tracking on Write

When `Bibliograph-Store-Deltas` is enabled (the default), every write that changes data stores a delta entry recording which fields changed and their new values.

```javascript
// Record is { Name: 'Alice', Age: 41 }

_Pict.Bibliograph.write('Contacts', 'A',
	{ Age: 870 },
	function (pError)
	{
		// Record is now { Name: 'Alice', Age: 870 }
		// A delta { Age: 870 } was recorded with the ingest timestamp
	});
```

You can retrieve the delta history with `readRecordDelta()`. See [Diff and Deltas](diff-and-deltas.md) for details.

## Bulk Writing from a File (CLI)

The CLI `write` command reads a JSON file and writes each record.

```bash
# Write a single object
bibliograph write -s Animals -i turtle.json

# Write an array of objects, using a field as the GUID
bibliograph write -s Animals -i animals.json -g "{~D:Record.ID~}"
```

When `-g` is not specified, each record's GUID is the MD5 hash of its JSON content.

## Streaming CSV Ingestion

The debug harness demonstrates ingesting a large CSV file by streaming lines and writing each parsed record:

```javascript
const libReadline = require('readline');
const libFS = require('fs');

let tmpCSVParser = _Pict.instantiateServiceProvider('CSVParser');
let tmpImportAnticipate = _Pict.newAnticipate();

const tmpReadline = libReadline.createInterface(
	{
		input: libFS.createReadStream('data.csv'),
		crlfDelay: Infinity
	});

tmpReadline.on('line',
	function (pLine)
	{
		let tmpRecord = tmpCSVParser.parseCSVLine(pLine);
		if (tmpRecord)
		{
			tmpImportAnticipate.anticipate(
				function (fWriteComplete)
				{
					let tmpRecordGUID = tmpRecord.UNITID;
					_Pict.Bibliograph.write('CollegeData', tmpRecordGUID,
						tmpRecord, fWriteComplete);
				});
		}
	});

tmpReadline.on('close',
	function ()
	{
		tmpImportAnticipate.wait(
			function (pError)
			{
				console.log('Import complete.');
			});
	});
```

This pattern queues all writes and executes them in sequence, making it safe for large datasets.

## Error Handling

The callback receives an error if:

- The source hash is not a non-empty string
- The record GUID is not a non-empty string
- The record is not an object
- The storage provider encounters an I/O error

```javascript
_Pict.Bibliograph.write('', 'rec-001', { Name: 'Test' },
	function (pError)
	{
		// pError: 'The source hash must be a string with data in it.'
	});

_Pict.Bibliograph.write('MySource', 'rec-001', 'not an object',
	function (pError)
	{
		// pError: 'The record to write must be an object.'
	});
```
