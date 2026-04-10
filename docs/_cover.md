# Bibliograph

> Key-value record comprehension service

Store raw JSON records across multiple sources with automatic metadata generation, hash-based deduplication, and field-level change tracking.

- **Source-Organized Storage** -- named collections for multi-feed ingestion
- **Hash-Based Deduplication** -- skip writes when content is unchanged
- **Partial Record Merging** -- merge new fields with existing records
- **Field-Level Change Tracking** -- delta history of what changed and when
- **Pluggable Storage** -- file system, Meadow, LMDB, LevelDB, RocksDB
- **CLI Tool** -- manage records from the command line

[Quick Start](quick-start.md)
[API Reference](api/reference.md)
[Architecture](architecture.md)
[GitHub](https://github.com/stevenvelozo/bibliograph)
