# recordHash()

Generate an MD5 hash of a string.

## Signature

```javascript
let tmpHash = _Pict.Bibliograph.recordHash(pString)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pString` | `string` | The input string to hash |

## Returns

| Type | Description |
|------|-------------|
| `string` | Hex-encoded MD5 hash of the input |

## Description

A utility method that generates an MD5 hash of the given string using Node.js `crypto.createHash('md5')`. This is useful for generating record GUIDs from record content or for content comparison.

This is a **synchronous** method -- it returns the hash directly, not via callback.

## Example

```javascript
let tmpHash = _Pict.Bibliograph.recordHash('Hello World');
console.log(tmpHash);
// => 'b10a8db164e0754105b7a99be72e3fe5'
```

## Generating GUIDs from Records

```javascript
let tmpRecord = { Name: 'Apple', Color: 'Red', Weight: 182 };
let tmpGUID = _Pict.Bibliograph.recordHash(JSON.stringify(tmpRecord));

_Pict.Bibliograph.write('FruitData', tmpGUID, tmpRecord,
	function (pError)
	{
		console.log('Stored with content-derived GUID:', tmpGUID);
	});
```

## Deduplication Key

```javascript
// Use a subset of fields as the deduplication key
let tmpRecord = { ID: '12345', Name: 'Apple', UpdatedAt: Date.now() };
let tmpGUID = _Pict.Bibliograph.recordHash(tmpRecord.ID);

// Records with the same ID will map to the same GUID
_Pict.Bibliograph.write('FruitData', tmpGUID, tmpRecord,
	function (pError)
	{
		console.log('Written with ID-based GUID:', tmpGUID);
	});
```

## Notes

- This is a synchronous method -- no callback needed
- Uses MD5, which is fast but not cryptographically secure
- The same hash is used internally by the metadata generation for deduplication
- The CLI `write` command uses this as the default GUID when no `-g` template is specified
