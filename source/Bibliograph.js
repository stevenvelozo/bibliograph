const libFableServiceBase = require('pict').ServiceProviderBase;

const _DefaultSettings = require(`./Bibliograph-Default-Settings.json`);

const libBibliographStorageBase = require('./providers/storage/Bibliograph-Storage-Base.js');
const libBibliographStorageFS = require('./providers/storage/Bibliograph-Storage-FS.js');

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

		this.fable.log.trace(`Bibliograph Service Instantiated.`);
	}

	initialize(fCallback)
	{
		this.fable.BibliographStorage.initialize(fCallback);
	}

	createSource(pSourceHash, fCallback)
	{
		this.fable.BibliographStorage.sourceCreate(pSourceHash, fCallback);
	}

	checkSourceExists(pSourceHash, fCallback)
	{
		this.fable.BibliographStorage.checkSourceExists(pSourceHash, fCallback);
	}

	readMetadata(pSourceHash, pRecordGUID, fCallback)
	{
		// See if there is metadata
		this.fable.BibliographStorage.readMetadata(pSourceHash, pRecordGUID, fCallback);
	}

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
}

module.exports = BibliographService;

module.exports.BibliographStorageBase = libBibliographStorageBase;