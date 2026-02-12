# Check Existence

The `exists` operation checks whether a record is present in a source without reading its contents.

## Signature

```javascript
_Pict.Bibliograph.exists(pSourceHash, pRecordGUID, fCallback)
```

- `pSourceHash` -- String. The source to check.
- `pRecordGUID` -- String. The GUID to look for.
- `fCallback` -- Function. Called with `(pError, pExists)` where `pExists` is a boolean.

## Basic Usage

```javascript
_Pict.Bibliograph.exists('Contacts', 'alice-001',
	function (pError, pExists)
	{
		if (pExists)
		{
			console.log('Record exists.');
		}
		else
		{
			console.log('Record not found.');
		}
	});
```

## Check Before Writing

A common pattern is to check existence before deciding whether to create or update a record.

```javascript
_Pict.Bibliograph.exists('Animals', 'turtle-001',
	function (pError, pExists)
	{
		if (pExists)
		{
			console.log('Updating existing turtle record...');
		}
		else
		{
			console.log('Creating new turtle record...');
		}

		_Pict.Bibliograph.write('Animals', 'turtle-001',
			{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Pink' },
			function (pError)
			{
				console.log('Write complete.');
			});
	});
```

Note that Bibliograph's write operation already handles both create and update cases through its merge behavior, so this check is optional. It is mainly useful for logging or conditional logic.

## Before and After a Write

From the unit tests, checking existence before and after writing:

```javascript
// Record B does not exist yet
_Pict.Bibliograph.exists('UnitTestManual', 'B',
	function (pError, pExists)
	{
		console.log(pExists); // false

		// Write it
		_Pict.Bibliograph.write('UnitTestManual', 'B',
			{ Name: 'Barry', Age: 39 },
			function (pError)
			{
				// Now it exists
				_Pict.Bibliograph.exists('UnitTestManual', 'B',
					function (pError, pExists)
					{
						console.log(pExists); // true
					});
			});
	});
```

## After Deletion

After a record is deleted, `exists()` returns `false`.

```javascript
_Pict.Bibliograph.delete('UnitTestManual', 'B',
	function (pError)
	{
		_Pict.Bibliograph.exists('UnitTestManual', 'B',
			function (pError, pExists)
			{
				console.log(pExists); // false
			});
	});
```

## Error Handling

The callback receives an error if:

- The source hash is not a non-empty string
- The record GUID is not a non-empty string

```javascript
_Pict.Bibliograph.exists('Contacts', '',
	function (pError, pExists)
	{
		// pError: 'The record GUID must be a string with data in it.'
	});
```
