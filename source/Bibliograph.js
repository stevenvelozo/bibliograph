const libFableServiceBase = require('pict').ServiceProviderBase;

const libCrypto = require('crypto');

const _DefaultSettings = require(`./Bibliograph-Default-Settings.json`);

const libBibliographStorageBase = require('./providers/storage/Bibliograph-Storage-Base.js');
const libBibliographStorageFS = require('./providers/storage/Bibliograph-Storage-FS.js');

/**
 * BibliographService stores raw records from multiple sources.
 *
 * @class BibliographService
 * @extends libFableServiceBase
 *
 * @constructor
 * @param {Object} pFable - The Fable instance used for dependency injection and service management.
 * @param {Object} pOptions - Configuration options for the service.
 * @param {string} pServiceHash - A unique identifier for the service instance.
 *
 * @property {string} serviceType - The type of service, set to 'Bibliograph'.
 */
class BibliographService extends libFableServiceBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(_DefaultSettings)), pOptions);
		super(pFable, tmpOptions, pServiceHash);

		this.serviceType = 'Bibliograph';

		// If there isn't a storage provider already loaded, load the FS storage provider
		if (!this.fable.services.hasOwnProperty('BibliographStorage'))
		{
			this.fable.addServiceTypeIfNotExists('BibliographStorage', libBibliographStorageFS);
			this.fable.instantiateServiceProvider('BibliographStorage', this.options);
		}
		if (!this.fable.services.hasOwnProperty('BibliographRecordDiff'))
		{
			this.fable.addServiceTypeIfNotExists('BibliographRecordDiff', require('./services/record/Bibliograph-Record-Diff.js'));
			this.fable.instantiateServiceProvider('BibliographRecordDiff', this.options);
		}

		this.fable.log.trace(`Bibliograph Service Instantiated.`);
	}

	/**
	 * Initializes the Bibliograph storage.
	 *
	 * @param {Function} fCallback - The callback function to execute after initialization.
	 */
	initialize(fCallback)
	{
		this.fable.BibliographStorage.initialize(fCallback);
	}

	/**
	 * Generates a record hash (currently md5) for the given string.
	 *
	 * @param {string} pString - The input string to hash.
	 * @returns {string} The resulting hashed string.
	 */
	recordHash(pString)
	{
		return libCrypto.createHash('md5').update(pString).digest('hex');
	}

	/**
	 * Creates a new source in the Bibliograph storage.
	 *
	 * @param {Object} pSourceHash - The hash object representing the source to be created.
	 * @param {Function} fCallback - The callback function to execute after the source is created.
	 */
	createSource(pSourceHash, fCallback)
	{
		if ((typeof(pSourceHash) != 'string') || (pSourceHash.length < 1))
		{
			return fCallback(new Error('The source hash must be a string with data in it.'));
		}
		this.fable.BibliographStorage.sourceCreate(pSourceHash, fCallback);
	}

	/**
	 * Checks if a source exists in the Bibliograph storage.
	 *
	 * @param {string} pSourceHash - The hash of the source to check for existence.
	 * @param {Function} fCallback - The callback function to execute after checking.
	 */
	checkSourceExists(pSourceHash, fCallback)
	{
		if ((typeof(pSourceHash) != 'string') || (pSourceHash.length < 1))
		{
			return fCallback(new Error('The source hash must be a string with data in it.'));
		}
		this.fable.BibliographStorage.checkSourceExists(pSourceHash, fCallback);
	}

	readRecordKeys(pSourceHash, fCallback)
	{
		if ((typeof(pSourceHash) != 'string') || (pSourceHash.length < 1))
		{
			return fCallback(new Error('The source hash must be a string with data in it.'));
		}
		this.fable.BibliographStorage.readRecordKeys(pSourceHash, fCallback);
	}

	/**
	 * Checks if a record exists in the bibliograph storage.
	 *
	 * @param {string} pSourceHash - The source hash, which must be a non-empty string.
	 * @param {string} pRecordGUID - The record GUID, which must be a non-empty string.
	 * @param {function(Error, boolean): void} fCallback - A callback function that is invoked with an error (if any) and a boolean indicating the existence of the record.
	 * @throws {Error} If the source hash or record GUID is not a valid non-empty string.
	 */
	exists(pSourceHash, pRecordGUID, fCallback)
	{
		if ((typeof(pSourceHash) != 'string') || (pSourceHash.length < 1))
		{
			return fCallback(new Error('The source hash must be a string with data in it.'));
		}
		if ((typeof(pRecordGUID) != 'string') || (pRecordGUID.length < 1))
		{
			return fCallback(new Error('The record GUID must be a string with data in it.'));
		}
		this.fable.BibliographStorage.exists(pSourceHash, pRecordGUID, fCallback);
	}

	/**
	 * Reads a record from the Bibliograph storage.
	 *
	 * @param {string} pSourceHash - The source hash identifying the storage location. Must be a non-empty string.
	 * @param {string} pRecordGUID - The GUID of the record to be read. Must be a non-empty string.
	 * @param {function(Error, any):void} fCallback - The callback function to handle the result or error. 
	 * @returns {void}
	 * @throws {Error} If the source hash or record GUID is invalid.
	 */
	read(pSourceHash, pRecordGUID, fCallback)
	{
		if ((typeof(pSourceHash) != 'string') || (pSourceHash.length < 1))
		{
			return fCallback(new Error('The source hash must be a string with data in it.'));
		}
		if ((typeof(pRecordGUID) != 'string') || (pRecordGUID.length < 1))
		{
			return fCallback(new Error('The record GUID must be a string with data in it.'));
		}
		this.fable.BibliographStorage.read(pSourceHash, pRecordGUID, fCallback);
	}

	readRecordDelta(pSourceHash, pRecordGUID, fCallback)
	{
		if ((typeof(pSourceHash) != 'string') || (pSourceHash.length < 1))
		{
			return fCallback(new Error('The source hash must be a string with data in it.'));
		}
		if ((typeof(pRecordGUID) != 'string') || (pRecordGUID.length < 1))
		{
			return fCallback(new Error('The record GUID must be a string with data in it.'));
		}
		this.fable.BibliographStorage.readRecordDelta(pSourceHash, pRecordGUID, fCallback);
	}

	/**
	 * Reads metadata for a specific record from the bibliograph storage.
	 *
	 * @param {string} pSourceHash - The hash identifying the source of the metadata.
	 * @param {string} pRecordGUID - The GUID of the record for which metadata is being retrieved.
	 * @param {Function} fCallback - The callback function to handle the result of the metadata retrieval.
	 */
	readRecordMetadata(pSourceHash, pRecordGUID, fCallback)
	{
		// See if there is metadata
		this.fable.BibliographStorage.readRecordMetadata(pSourceHash, pRecordGUID, fCallback);
	}

	/**
	 * Writes a record to the bibliograph storage.
	 *
	 * @param {string} pSourceHash - The source hash, must be a non-empty string.
	 * @param {string} pRecordGUID - The record GUID, must be a non-empty string.
	 * @param {Object} pRecord - The record to write, must be an object.
	 * @param {Function} fCallback - The callback function to handle the result or error.
	 * @throws {Error} If the source hash is not a valid non-empty string.
	 * @throws {Error} If the record GUID is not a valid non-empty string.
	 * @throws {Error} If the record is not a valid object.
	 */
	write(pSourceHash, pRecordGUID, pRecord, fCallback)
	{
		if ((typeof(pSourceHash) != 'string') || (pSourceHash.length < 1))
		{
			return fCallback(new Error('The source hash must be a string with data in it.'));
		}
		if ((typeof(pRecordGUID) != 'string') || (pRecordGUID.length < 1))
		{
			return fCallback(new Error('The record GUID must be a string with data in it.'));
		}
		if (typeof(pRecord) != 'object')
		{
			return fCallback(new Error('The record to write must be an object.'));
		}
		this.fable.BibliographStorage.write(pSourceHash, pRecordGUID, pRecord, fCallback);
	}

	/**
	 * Deletes a record from the bibliograph storage.
	 *
	 * @param {string} pSourceHash - The source hash identifying the collection or source.
	 * @param {string} pRecordGUID - The unique identifier (GUID) of the record to delete.
	 * @param {Function} fCallback - The callback function to execute after the delete operation.
	 * @throws {Error} If `pSourceHash` is not a non-empty string.
	 * @throws {Error} If `pRecordGUID` is not a non-empty string.
	 */
	delete(pSourceHash, pRecordGUID, fCallback)
	{
		if ((typeof(pSourceHash) != 'string') || (pSourceHash.length < 1))
		{
			return fCallback(new Error('The source hash must be a string with data in it.'));
		}
		if ((typeof(pRecordGUID) != 'string') || (pRecordGUID.length < 1))
		{
			return fCallback(new Error('The record GUID must be a string with data in it.'));
		}
		this.fable.BibliographStorage.delete(pSourceHash, pRecordGUID, fCallback);
	}
}

module.exports = BibliographService;

module.exports.BibliographStorageBase = libBibliographStorageBase;