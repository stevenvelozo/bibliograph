const libPictProvider = require('pict-provider');

const libCrypto = require('crypto');

class BibliographServiceStorageBase extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'BibliographStorage';
	}

	/**
	 * Initializes the Bibliograph Storage Base.
	 * Logs a warning message indicating the initialization process.
	 *
	 * @param {Function} fCallback - A callback function to be executed after initialization.
	 */
	initialize(fCallback)
	{
		this.fable.log.warn('Bibliograph Storage Base Initialization');
		return fCallback(null);
	}

	/**
	 * Checks if a source exists
	 *
	 * @param {string} pSourceHash - The hash of the source to check for existence.
	 * @param {function} fCallback - A callback function to handle the result.
	 */
	sourceExists(pSourceHash, fCallback)
	{
		return fCallback(null, false);
	}

	/**
	 * Creates a source
	 *
	 * @param {string} pSourceHash - The hash of the source to create
	 * @param {function} fCallback - A callback function to handle the result.
	 */
	sourceCreate(pSourceHash, fCallback)
	{
		return fCallback(null, false);
	}

	/**
	 * Generates metadata for a given record.
	 *
	 * Metadata object properties:
	 *   - `GUID`: The record's GUID.
	 *   - `Length`: The length of the JSON string.
	 *   - `QHash`: A "quick" crc-like hash of the JSON string using an insecure hash function.
	 *   - `MD5`: The MD5 hash of the JSON string.
	 *   - `Ingest`: The timestamp (in milliseconds) when the metadata was generated.

	 * @param {string} pRecordGUID - The unique identifier (GUID) of the record.
	 * @param {string} pRecordJSONString - The JSON string representation of the record.
	 * @returns {Object} An object containing metadata for the record, including:
	 */
	generateMetadataForRecord(pRecordGUID, pRecordJSONString)
	{
		let tmpMetadata = {
			"GUID": pRecordGUID,
			"Length": pRecordJSONString.length,
			"QHash": this.fable.DataFormat.insecureStringHash(pRecordJSONString),
			"MD5": libCrypto.createHash('md5').update(pRecordJSONString).digest('hex'),
			"Ingest": +new Date()
		};

		return tmpMetadata;
	}

	/**
	 * Reads the metadata of a record from the storage.
	 *
	 * @param {string} pSourceHash - The hash of the source from which the record metadata is to be read.
	 * @param {string} pRecordGUID - The GUID of the record whose metadata is to be retrieved.
	 * @param {function} fCallback - A callback function to handle the result. 
	 */
	readRecordMetadata(pSourceHash, pRecordGUID, fCallback)
	{
		return fCallback(null, false);
	}

	/**
	 * Writes metadata for a record in the storage system.
	 *
	 * @param {Object} pSourceHash - The source hash object containing record details.
	 * @param {Object} pMetadata - The metadata object to be written for the record.
	 * @param {Function} fCallback - The callback function to execute after writing metadata.
	 * @returns {void}
	 */
	writeRecordMetadata(pSourceHash, pMetadata, fCallback)
	{
		return fCallback(null);
	}

	/**
	 * Checks if a record exists in the storage.
	 *
	 * @param {Object} pSourceHash - The source hash containing context or configuration for the storage operation.
	 * @param {string} pRecordGUID - The unique identifier of the record to check for existence.
	 * @param {Function} fCallback - The callback function to execute after the check.
	 */
	checkExists(pSourceHash, pRecordGUID, fCallback)
	{
		return fCallback(null, false);
	}

	/**
	 * Reads a record from the storage based on the provided source hash and record GUID.
	 *
	 * The callback takes two arguments: an error (if any) and the result.
	 * 
	 * If the record is not found, the result will be `false`.
	 * 
	 * @param {Object} pSourceHash - The source hash containing information about the storage source.
	 * @param {string} pRecordGUID - The unique identifier of the record to be read.
	 * @param {Function} fCallback - The callback function to handle the result. 
	 */
	read(pSourceHash, pRecordGUID, fCallback)
	{
		return fCallback(null, false);
	}

	/**
	 * Writes a record to storage
	 *
	 * @param {string} pSourceHash - The hash of the source where the record should be stored.
	 * @param {string} pRecordGUID - The GUID of the record to store.
	 * @param {Object} pRecord - The record object to be written.
	 * @param {function} fCallback - A callback function to handle the result. 
	 */
	write(pSourceHash, pRecordGUID, pRecord, fCallback)
	{
		return fCallback(null);
	}

	/**
	 * Deletes a record from the storage based on the provided source hash and record GUID.
	 *
	 * @param {Object} pSourceHash - The source hash object containing the storage details.
	 * @param {string} pRecordGUID - The unique identifier of the record to be deleted.
	 * @param {Function} fCallback - The callback function to execute after the delete operation.
	 * @returns {*} The result of the callback function.
	 */
	delete(pSourceHash, pRecordGUID, fCallback)
	{
		return fCallback(null);
	}
}

module.exports = BibliographServiceStorageBase;