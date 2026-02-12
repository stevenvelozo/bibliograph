# Read

The `read` operation retrieves a stored JSON record by its GUID from a source.

## Signature

```javascript
_Pict.Bibliograph.read(pSourceHash, pRecordGUID, fCallback)
```

- `pSourceHash` -- String. The source to read from.
- `pRecordGUID` -- String. The GUID of the record to retrieve.
- `fCallback` -- Function. Called with `(pError, pRecord)`.

## Basic Read

```javascript
_Pict.Bibliograph.read('Contacts', 'alice-001',
	function (pError, pRecord)
	{
		console.log(pRecord);
		// { Name: 'Alice', Age: 41 }
	});
```

## Reading a Non-Existent Record

If the record does not exist, the callback receives `undefined` as the record value (not an error).

```javascript
_Pict.Bibliograph.read('Contacts', 'does-not-exist',
	function (pError, pRecord)
	{
		console.log(pRecord); // undefined
		// pError is null -- this is not an error condition
	});
```

This is demonstrated in the unit tests, which verify that reading deleted or never-created records returns `undefined`:

```javascript
// Read a record that was never created
_Pict.Bibliograph.read('UnitTestManual', 'D',
	function (pError, pRecord)
	{
		// pRecord is undefined
	});
```

## Reading After a Partial Update

After a partial write, reading returns the fully merged record -- not just the most recent write's fields.

```javascript
// Write the full record
_Pict.Bibliograph.write('Contacts', 'A',
	{ Name: 'Alice', Age: 41 },
	function (pError)
	{
		// Update only Age
		_Pict.Bibliograph.write('Contacts', 'A',
			{ Age: 870 },
			function (pError)
			{
				// Read returns the merged result
				_Pict.Bibliograph.read('Contacts', 'A',
					function (pError, pRecord)
					{
						console.log(pRecord);
						// { Name: 'Alice', Age: 870 }
					});
			});
	});
```

## Reading After Deletion

After a record is deleted, reading it returns `undefined`.

```javascript
_Pict.Bibliograph.delete('Contacts', 'B',
	function (pError)
	{
		_Pict.Bibliograph.read('Contacts', 'B',
			function (pError, pRecord)
			{
				console.log(pRecord); // undefined
			});
	});
```

## CLI Read

```bash
# Print record to stdout
bibliograph read -s Contacts alice-001

# Save to a file
bibliograph read -s Contacts alice-001 -o alice.json
```

## Error Handling

The callback receives an error if:

- The source hash is not a non-empty string
- The record GUID is not a non-empty string

```javascript
_Pict.Bibliograph.read('Contacts', '',
	function (pError, pRecord)
	{
		// pError: 'The record GUID must be a string with data in it.'
	});
```
