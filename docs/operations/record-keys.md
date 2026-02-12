# Record Keys

Bibliograph provides two methods for listing the record GUIDs within a source: listing all keys, and filtering keys by ingest timestamp.

## List All Record Keys

### Signature

```javascript
_Pict.Bibliograph.readRecordKeys(pSourceHash, fCallback)
```

- `pSourceHash` -- String. The source to list.
- `fCallback` -- Function. Called with `(pError, pKeys)` where `pKeys` is an array of GUID strings.

### Basic Usage

```javascript
_Pict.Bibliograph.readRecordKeys('Contacts',
	function (pError, pKeys)
	{
		console.log(pKeys);
		// ['A', 'B', 'C']
	});
```

### After Deletion

Deleted records are not included in the key list.

```javascript
// Before: keys are ['A', 'B', 'C']

_Pict.Bibliograph.delete('UnitTestManual', 'B',
	function (pError)
	{
		_Pict.Bibliograph.readRecordKeys('UnitTestManual',
			function (pError, pKeys)
			{
				console.log(pKeys);
				// ['A', 'C']
			});
	});
```

### Iterating Over All Records

Combine `readRecordKeys` with `read` to process every record in a source.

```javascript
_Pict.Bibliograph.readRecordKeys('Contacts',
	function (pError, pKeys)
	{
		let tmpAnticipate = _Pict.newAnticipate();

		for (let i = 0; i < pKeys.length; i++)
		{
			let tmpKey = pKeys[i];
			tmpAnticipate.anticipate(
				function (fNext)
				{
					_Pict.Bibliograph.read('Contacts', tmpKey,
						function (pError, pRecord)
						{
							console.log(`${tmpKey}: ${JSON.stringify(pRecord)}`);
							fNext(pError);
						});
				});
		}

		tmpAnticipate.wait(
			function (pError)
			{
				console.log('All records processed.');
			});
	});
```

## Filter Keys by Timestamp

### Signature

```javascript
_Pict.Bibliograph.readRecordKeysByTimestamp(pSourceHash, pStartTime, pEndTime, fCallback)
```

- `pSourceHash` -- String. The source to query.
- `pStartTime` -- Date. The beginning of the time range.
- `pEndTime` -- Date. The end of the time range.
- `fCallback` -- Function. Called with `(pError, pKeys)` where `pKeys` is an array of GUID strings.

This returns records whose ingest timestamps fall within the given range. Useful for incremental processing -- "give me everything that was ingested since my last run."

### Basic Usage

```javascript
let tmpStart = new Date('2025-06-01');
let tmpEnd = new Date();

_Pict.Bibliograph.readRecordKeysByTimestamp('CollegeData', tmpStart, tmpEnd,
	function (pError, pKeys)
	{
		console.log(`${pKeys.length} records ingested since June 1.`);
		console.log(pKeys);
	});
```

### Time-Windowed Queries

The unit tests demonstrate time-based filtering by introducing a delay between writes and then querying for records ingested after that point:

```javascript
let tmpFilterFromDate = false;

// Write records A and B
_Pict.Bibliograph.write('UnitTestManual', 'A', { Name: 'Alice', Age: 41 }, fCallback);
_Pict.Bibliograph.write('UnitTestManual', 'B', { Name: 'Barry', Age: 39 }, fCallback);

// Capture a timestamp between writes
tmpFilterFromDate = new Date();

// Wait 50ms, then write record C
setTimeout(function ()
{
	_Pict.Bibliograph.write('UnitTestManual', 'C', { Name: 'Cassandra', Age: 34 }, fCallback);
}, 50);

// Query for records ingested after the midpoint
_Pict.Bibliograph.readRecordKeysByTimestamp('UnitTestManual',
	tmpFilterFromDate, new Date(),
	function (pError, pKeys)
	{
		console.log(pKeys);
		// ['B', 'C'] -- records with timestamps after tmpFilterFromDate
	});
```

### Full Range Query

Querying from the beginning of the test to now returns all records:

```javascript
_Pict.Bibliograph.readRecordKeysByTimestamp('UnitTestManual',
	tmpTestBeginDate, new Date(),
	function (pError, pKeys)
	{
		console.log(pKeys);
		// ['A', 'B', 'C']
	});
```

## Error Handling

Both methods return an error if the source hash is not a non-empty string.

```javascript
_Pict.Bibliograph.readRecordKeys('',
	function (pError, pKeys)
	{
		// pError: 'The source hash must be a string with data in it.'
	});
```
