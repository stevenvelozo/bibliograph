# Sources

Sources are named collections that organize records. Before writing records, you must create the source they belong to.

## Create a Source

### Signature

```javascript
_Pict.Bibliograph.createSource(pSourceHash, fCallback)
```

- `pSourceHash` -- String. The name for the source.
- `fCallback` -- Function. Called with `(pError)` when complete.

### Basic Usage

```javascript
_Pict.Bibliograph.createSource('FruitData',
	function (pError)
	{
		if (pError) console.error('Failed to create source:', pError);
		else console.log('Source created.');
	});
```

### Creating a Source That Already Exists

Creating a source that already exists is not an error. The operation is idempotent.

```javascript
// Create it twice -- no error
_Pict.Bibliograph.createSource('TestSource',
	function (pError)
	{
		_Pict.Bibliograph.createSource('TestSource',
			function (pError)
			{
				// pError is null -- safe to call multiple times
			});
	});
```

This is verified in the unit tests, which call `createSourceFolder` multiple times on the same source without error.

### File System Layout

When using the FS storage provider, creating a source creates a folder with three subfolders:

```
data/
  FruitData/
    metadata/
    record/
    history/
```

## Check if a Source Exists

### Signature

```javascript
_Pict.Bibliograph.checkSourceExists(pSourceHash, fCallback)
```

- `pSourceHash` -- String. The source name to check.
- `fCallback` -- Function. Called with `(pError, pExists)` where `pExists` is a boolean.

### Basic Usage

```javascript
_Pict.Bibliograph.checkSourceExists('FruitData',
	function (pError, pExists)
	{
		if (pExists)
		{
			console.log('Source exists.');
		}
		else
		{
			console.log('Source does not exist.');
		}
	});
```

### Verify After Creation

From the unit tests:

```javascript
_Pict.Bibliograph.createSource('TestSource',
	function (pError)
	{
		_Pict.Bibliograph.checkSourceExists('TestSource',
			function (pError, pExists)
			{
				console.log(pExists); // true
			});
	});
```

## Source Naming

Source names can be any non-empty string. They become folder names in the FS provider, so keep them filesystem-safe. Common patterns:

- **By data feed:** `'RawDOECollegeData-2025'`
- **By entity type:** `'Contacts'`, `'Animals'`, `'Products'`
- **By pipeline stage:** `'RawIngest'`, `'Cleaned'`, `'Enriched'`

The debug harness demonstrates using descriptive source names like `'RawDOECollegeData-2025'` and `'SubsequentWrites'`.

## CLI Source Commands

```bash
# Create a source
bibliograph source_create FruitData
bibliograph sc FruitData

# Check if a source exists
bibliograph source_check FruitData
bibliograph sch FruitData
```

## Error Handling

Both `createSource` and `checkSourceExists` return an error if the source hash is not a non-empty string.

```javascript
_Pict.Bibliograph.createSource('',
	function (pError)
	{
		// pError: 'The source hash must be a string with data in it.'
	});
```
