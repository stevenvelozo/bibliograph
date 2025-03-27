# Example Raw Ingestion Harness

This folder includes the standard retold harness pattern; because we wanted to
stress test the scale capabilities of this tech, a large amount of data was
required.

The data selected came from the US Department of Education, about Colleges.
Because the csv file is over 100 meg, the actual csv file has been explicitly
ignored in the `input` folder, so to run the harness as configured you will
need to decompress the zip file.

## Data URL

The data was downloaded from: (https://collegescorecard.ed.gov/data/)

## Configuration

You can set a default configuration for the Command-Line tool by creating
a `.bibliograph.config.json` file in your home folder and putting the following
contents in:

```json
{
  "Bibliograph-Storage-FS-Path": "/Users/stevenvelozo/Code/retold/modules/meadow/bibliograph/debug/data/HarnessLib/"
}
```

This will likely not work for you unless we share names and folder preferences
so you will have to change the path slightly.
