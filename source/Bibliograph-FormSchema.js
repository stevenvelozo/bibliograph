/**
 * Connection form schema for Bibliograph (filesystem storage).
 *
 * Consumed by meadow-connection-manager#getProviderFormSchema('Bibliograph').
 * Pure data — safe to require() in any environment.  See
 * meadow-connection-mysql/source/Meadow-Connection-MySQL-FormSchema.js
 * for the field contract.
 *
 * Bibliograph is a key-value record store backed by a filesystem
 * directory; the only configurable input is the storage folder path.
 *
 * NOTE: the canonical config key is `StorageFolder` to match what
 * existing consumers (retold-data-service DataCloner) emit on the wire
 * today.  The bibliograph FS storage provider also reads
 * `Bibliograph-Storage-FS-Path` from fable.settings — wiring those two
 * together is out of scope for this schema (it just describes the form
 * field, not how the host service routes it into bibliograph's
 * settings).
 */
'use strict';

module.exports =
{
	Provider:    'Bibliograph',
	DisplayName: 'Bibliograph',
	Description: 'Open or create a Bibliograph key-value store backed by a local filesystem folder.',
	Fields:
	[
		{
			Name:        'StorageFolder',
			Label:       'Storage Folder Path',
			Type:        'Path',
			Default:     'data/bibliograph',
			Required:    true,
			Placeholder: 'data/bibliograph',
			Help:        'Directory will be created automatically if it does not exist.'
		}
	]
};
