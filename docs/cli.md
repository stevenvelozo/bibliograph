# CLI Reference

Bibliograph includes a command-line tool for managing records from the terminal.

## Installation

```bash
npm install -g bibliograph
```

Or use `npx` without installing globally:

```bash
npx bibliograph <command>
```

## Configuration

The CLI reads settings from `~/.bibliograph.config.json`. Any Bibliograph setting can be placed here.

```json
{
	"Bibliograph-Storage-FS-Path": "/var/data/bibliograph",
	"Bibliograph-Source": "Default"
}
```

The `Bibliograph-Source` setting controls the default source when `-s` is not provided.

## Commands

### source_create

Create a new source folder.

**Aliases:** `sc`, `scr`

```bash
bibliograph source_create MySource

# Using alias
bibliograph sc MySource
```

### source_check

Check if a source exists.

**Aliases:** `sch`

```bash
bibliograph source_check MySource

# Using alias
bibliograph sch MySource
```

### record_write

Write records from a JSON file into a source.

**Aliases:** `write`, `w`

**Options:**

| Option | Description |
|--------|-------------|
| `-s, --source [source_hash]` | Source to write into. Defaults to `Bibliograph-Source` config value or `Default`. |
| `-i, --input [input_file]` | Path to a JSON file containing a record or array of records. Required. |
| `-g, --guid [guid_template]` | A Pict template expression for generating GUIDs from record data. When omitted, the MD5 hash of the record JSON is used. |

**Write a single record:**

```bash
# records.json: { "Name": "Apple", "Color": "Red" }
bibliograph write -s FruitData -i records.json
```

**Write an array of records:**

```bash
# fruits.json: [{ "ID": "1", "Name": "Apple" }, { "ID": "2", "Name": "Banana" }]
bibliograph write -s FruitData -i fruits.json -g "{~D:Record.ID~}"
```

The `-g` flag accepts a Pict template expression. The template is evaluated against each record to produce the GUID. In the example above, `{~D:Record.ID~}` extracts the `ID` field from each record object.

When `-g` is not provided, the GUID defaults to the MD5 hash of the entire record JSON string.

### record_read

Read a single record by GUID.

**Aliases:** `read`, `r`

**Options:**

| Option | Description |
|--------|-------------|
| `-s, --source [source_hash]` | Source to read from. |
| `-o, --output [output_file]` | Write the record to a file instead of stdout. |

```bash
bibliograph read -s FruitData apple-001

# Save to file
bibliograph read -s FruitData apple-001 -o apple.json

# Using alias
bibliograph r -s FruitData apple-001
```

### record_delete

Delete a record by GUID.

**Aliases:** `delete`, `d`

**Options:**

| Option | Description |
|--------|-------------|
| `-s, --source [source_hash]` | Source containing the record. |

```bash
bibliograph delete -s FruitData apple-001

# Using alias
bibliograph d -s FruitData apple-001
```

## Examples

**Set up a data pipeline from the terminal:**

```bash
# Create a source for college data
bibliograph sc CollegeData

# Write institution records with UNITID as the GUID
bibliograph write -s CollegeData -i institutions.json -g "{~D:Record.UNITID~}"

# Check a specific record
bibliograph read -s CollegeData 100654

# Delete a record
bibliograph delete -s CollegeData 100654
```

**Use with npx in a project:**

```bash
# In your project directory
npx bibliograph sc ProjectRecords
npx bibliograph w -s ProjectRecords -i data/export.json
npx bibliograph r -s ProjectRecords my-record-id
```
