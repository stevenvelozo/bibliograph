# Delete

The `delete` operation removes a record from a source. The record file is deleted, and the metadata is updated with a `Deleted` timestamp.

## Signature

```javascript
_Pict.Bibliograph.delete(pSourceHash, pRecordGUID, fCallback)
```

- `pSourceHash` -- String. The source containing the record.
- `pRecordGUID` -- String. The GUID of the record to delete.
- `fCallback` -- Function. Called with `(pError)` when complete.

## Basic Delete

```javascript
_Pict.Bibliograph.delete('Contacts', 'barry-002',
	function (pError)
	{
		if (pError) console.error('Delete failed:', pError);
		else console.log('Record deleted.');
	});
```

## What Happens on Delete

The delete operation performs three steps:

1. **Read existing metadata** -- If metadata exists, it is loaded
2. **Mark metadata as deleted** -- A `Deleted` timestamp (milliseconds) is added to the metadata and persisted
3. **Remove the record file** -- The actual record data is removed from storage

After deletion:

- `read()` returns `undefined` for the record
- `exists()` returns `false`
- The metadata file may still exist with the `Deleted` timestamp (useful for audit trails)

## Verify Deletion with exists()

```javascript
// Confirm the record exists
_Pict.Bibliograph.exists('Contacts', 'B',
	function (pError, pExists)
	{
		console.log(pExists); // true

		// Delete it
		_Pict.Bibliograph.delete('Contacts', 'B',
			function (pError)
			{
				// Confirm it's gone
				_Pict.Bibliograph.exists('Contacts', 'B',
					function (pError, pExists)
					{
						console.log(pExists); // false
					});
			});
	});
```

This pattern is exercised in the unit tests, which verify that `exists()` returns `false` after deletion and that `read()` returns `undefined`.

## Deleting a Non-Existent Record

Deleting a record that does not exist is not an error. The operation completes without effect.

```javascript
_Pict.Bibliograph.delete('Contacts', 'never-existed',
	function (pError)
	{
		// pError is null -- no error
	});
```

## Effect on Record Keys

After deletion, the record's GUID is no longer included in `readRecordKeys()` results.

```javascript
// Before delete: readRecordKeys returns ['A', 'B', 'C']

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

## CLI Delete

```bash
bibliograph delete -s Contacts barry-002

# Using alias
bibliograph d -s Contacts barry-002
```

## Error Handling

The callback receives an error if:

- The source hash is not a non-empty string
- The record GUID is not a non-empty string

```javascript
_Pict.Bibliograph.delete('', 'rec-001',
	function (pError)
	{
		// pError: 'The source hash must be a string with data in it.'
	});
```
