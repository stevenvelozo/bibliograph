const libPictProvider = require('pict-provider');

class BibliographServiceStorageBase extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'BibliographStorage';
	}

	getRecordMetadata(pSourceHash, pRecord, fCallback)
	{
		// Check if the metadata exists
		return fCallback(null);
	}

	writeRecordMetadata(pSourceHash, pMetadata, fCallback)
	{
		return fCallback(null);
	}

	initialize(fCallback)
	{
		this.fable.log.warn('Bibliograph Storage Base Initialization');
	}

	sourceExists(pSourceHash, fCallback)
	{
		return fCallback(null, false);
	}

	sourceCreate(pSourceHash, fCallback)
	{
		return fCallback(null, false);
	}

	sourceCheckExists(pSourceHash, fCallback)
	{
		return fCallback(null, false);
	}

	checkExists(pSourceHash, pRecordGUID, fCallback)
	{
		return fCallback(null, false);
	}

	readMetadata(pSourceHash, pRecordGUID, fCallback)
	{
		return fCallback(null, false);
	}

	read(pSourceHash, pRecordGUID, fCallback)
	{
		return fCallback(null, false);
	}

	write(pSourceHash, pRecordGUID, pRecord, fCallback)
	{
		return fCallback();
	}

	delete(pSourceHash, pRecordGUID, fCallback)
	{
		return fCallback();
	}
}

module.exports = BibliographServiceStorageBase;