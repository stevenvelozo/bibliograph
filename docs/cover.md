# Bibliograph

> Raw record storage with change tracking

A key-value record comprehension service for Node.js. Bibliograph stores raw JSON records across multiple sources with automatic metadata generation, hash-based deduplication, and field-level change tracking.

- **Sources** -- Organize records into named collections
- **Deduplication** -- Hash-based detection skips redundant writes
- **Change Tracking** -- Field-level deltas record what changed and when
- **Pluggable Storage** -- File system built in, with LMDB, LevelDB, and RocksDB backends available

[Quick Start](quick-start.md)
[API Reference](api.md)
[Data Operations](operations/write.md)
[GitHub](https://github.com/stevenvelozo/bibliograph)
