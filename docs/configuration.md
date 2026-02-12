# Configuration

Bibliograph is configured through the Pict settings object or a `.bibliograph.config.json` file when using the CLI.

## Default Settings

```json
{
	"Bibliograph-Check-Metadata-On-Write": true,
	"Bibliograph-Store-Deltas": true,
	"Bibliograph-Storage-FS-Path": "./data"
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `Bibliograph-Check-Metadata-On-Write` | boolean | `true` | Compare metadata hashes before writing. When enabled, records with identical content are skipped. |
| `Bibliograph-Store-Deltas` | boolean | `true` | Store field-level change history on each write. |
| `Bibliograph-Storage-FS-Path` | string | `"./data"` | Root folder for file system storage. |
| `Bibliograph-Log-Write-Mismatch-Reason` | boolean | `false` | Log details about why a record was considered changed during metadata comparison. |
| `Bibliograph-Source` | string | `"Default"` | Default source name for CLI operations when `-s` is not specified. |

## Programmatic Configuration

Pass settings through the Pict constructor.

```javascript
const libPict = require('pict');
const libBibliograph = require('bibliograph');

let _Pict = new libPict(
	{
		"Bibliograph-Check-Metadata-On-Write": true,
		"Bibliograph-Store-Deltas": true,
		"Bibliograph-Storage-FS-Path": "/var/data/myproject"
	});

_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
_Pict.instantiateServiceProvider('Bibliograph', {});
```

Settings can also be passed directly to the service provider.

```javascript
_Pict.instantiateServiceProvider('Bibliograph',
	{
		"Bibliograph-Storage-FS-Path": "/tmp/test-storage"
	});
```

## CLI Configuration

The CLI reads configuration from a `.bibliograph.config.json` file in the user's home directory.

```json
{
	"Bibliograph-Storage-FS-Path": "/var/data/bibliograph",
	"Bibliograph-Source": "ProductionFeed"
}
```

## Disabling Deduplication

If you want every write to persist regardless of whether the content changed, disable metadata checking.

```javascript
let _Pict = new libPict(
	{
		"Bibliograph-Check-Metadata-On-Write": false
	});
```

This is useful for append-only ingestion patterns where you always want to update the ingest timestamp.

## Disabling Delta Tracking

If you do not need change history and want to reduce storage overhead, disable delta tracking.

```javascript
let _Pict = new libPict(
	{
		"Bibliograph-Store-Deltas": false
	});
```

## Logging Configuration

Bibliograph logs through Pict's logging system. Configure log streams in the Pict settings.

```javascript
let _Pict = new libPict(
	{
		Product: 'MyIngestionPipeline',
		LogStreams:
			[
				{
					loggertype: 'simpleflatfile',
					outputloglinestoconsole: false,
					showtimestamps: true,
					formattedtimestamps: true,
					level: 'trace',
					path: `./ingestion-${Date.now()}.log`
				},
				{
					loggertype: 'console',
					showtimestamps: true,
					formattedtimestamps: true,
					level: 'info'
				}
			]
	});
```
