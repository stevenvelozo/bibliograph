const libBibliographStorageBase = require('../../../../source/providers/storage/Bibliograph-Storage-Base.js');

const libLMDB = require('lmdb');

class BibliographStorageFS extends libBibliographStorageBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.fable.instantiateServiceProviderIfNotExists('FilePersistence');

		this.Initialized = false;
	}

	initialize(fCallback)
	{
		this.fable.log.trace(`Bibliograph FS Storage Initialization: ${this.StorageFolder}`);
		let tmpAnticipate = this.fable.newAnticipate();

		return tmpAnticipate.wait(fCallback);
	}

	sourceCreate(pSourceHash, fCallback)
	{
		this.fable.log.trace(`Bibliograph FS Storage Initialization: ${this.StorageFolder}`);
		if (!this.Initialized)
		{
			this.fable.log.error(`Bibliograph FS Storage not initialized; creation of source [${pSourceHash}] failed.`);
			return fCallback(new Error(`Bibliograph FS Storage not initialized; creation of source [${pSourceHash}] failed.`));
		}
		let tmpAnticipate = this.fable.newAnticipate();
		tmpAnticipate.anticipate(this.createStorageFolder.bind(this));
		tmpAnticipate.anticipate(this.checkStorageFolder.bind(this));
		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.createSourceFolder(pSourceHash, fNext);
			}.bind(this));
		tmpAnticipate.wait(fCallback);
	}

	checkSourceExists(pSourceHash, fCallback)
	{
		let tmpSourceFolder = this.fable.FilePersistence.joinPath(this.StorageFolder, `${pSourceHash}`);
		let tmpExists = this.fable.FilePersistence.existsSync(tmpSourceFolder);
		return fCallback(null, tmpExists);
	}

	readRecordMetadata(pSourceHash, pRecordGUID, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; read of record [${pSourceHash}]:[${pRecordGUID}] metadata failed.`));
		}

		let tmpRecordMetadataFileName = `${pRecordGUID}__metadata__.json`;
		let tmpRecordMetadataFilePath = this.fable.FilePersistence.joinPath(this.getSourceMetadataFolderPath(pSourceHash), tmpRecordMetadataFileName);
		if (!this.fable.FilePersistence.existsSync(tmpRecordMetadataFilePath))
		{
			// TODO: Generate metadata if we can?
			return fCallback(null, false);
		}

		this.fable.FilePersistence.readFile(tmpRecordMetadataFilePath, 'utf8',
			function(pError, pData)
			{
				try
				{
					return fCallback(pError, JSON.parse(pData));
				}
				catch(pDeserializeError)
				{
					this.fable.log.error(`Error deserializing [${pSourceHash}]:[${pRecordGUID}] in file [${tmpRecordMetadataFileName}] full path [${tmpRecordMetadataFilePath}]: ${pDeserializeError}`);
					return fCallback(pDeserializeError);
				}
			});
	}

	writeRecordMetadata(pSourceHash, pRecordGUID, pMetadata, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; write of record [${pSourceHash}]:[${pRecordGUID}] metadata failed.`));
		}

		let tmpRecordMetadataFileName = `${pRecordGUID}__metadata__.json`;
		let tmpRecordMetadataFilePath = this.fable.FilePersistence.joinPath(this.getSourceMetadataFolderPath(pSourceHash), tmpRecordMetadataFileName);
		let tmpRecordMetadataJSON = JSON.stringify(pMetadata);

		this.fable.FilePersistence.writeFile(tmpRecordMetadataFilePath, tmpRecordMetadataJSON, 'utf8', fCallback);
	}

	read(pSourceHash, pRecordGUID, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; read of record [${pSourceHash}]:[${pRecordGUID}] failed.`));
		}

		let tmpRecordFileName = `${pRecordGUID}.json`;
		let tmpRecordFilePath = this.fable.FilePersistence.joinPath(this.getSourceRecordFolderPath(pSourceHash), tmpRecordFileName);

		if (!this.fable.FilePersistence.existsSync(tmpRecordFilePath))
		{
			return fCallback();
		}

		this.fable.FilePersistence.readFile(tmpRecordFilePath, 'utf8',
			function(pError, pData)
			{
				if (pError)
				{
					return fCallback(pError);
				}

				try
				{
					return fCallback(pError, JSON.parse(pData));
				}
				catch(pDeserializeError)
				{
					this.fable.log.error(`Error deserializing [${pSourceHash}]:[${pRecordGUID}] in file [${tmpRecordFileName}] full path [${tmpRecordFilePath}]: ${pDeserializeError}`);
					return fCallback(pDeserializeError);
				}
			}.bind(this));
	}

	write(pSourceHash, pRecordGUID, pRecord, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; write of record [${pSourceHash}]:[${pRecordGUID}] failed.`));
		}

		let tmpRecordFileName = `${pRecordGUID}.json`;
		let tmpRecordFilePath = this.fable.FilePersistence.joinPath(this.getSourceRecordFolderPath(pSourceHash), tmpRecordFileName);
		let tmpRecordJSON = JSON.stringify(pRecord);

		let tmpAnticipate = this.fable.newAnticipate();

		// TODO: Do the metadata twiddling here
		// TODO: Setup the roll-back capability here

		tmpAnticipate.anticipate(
			function (fNext)
			{
				let tmpMetadata = this.generateMetadataForRecord(pRecordGUID, tmpRecordJSON);
				this.writeRecordMetadata(pSourceHash, pRecordGUID, tmpMetadata, fNext);
			}.bind(this));

		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.fable.FilePersistence.writeFile(tmpRecordFilePath, tmpRecordJSON, 'utf8', fNext);
			}.bind(this));

		tmpAnticipate.wait(fCallback);
	}

	delete(pSourceHash, pRecordGUID, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; delete of record [${pSourceHash}]:[${pRecordGUID}] failed.`));
		}

		let tmpRecordFileName = `${pRecordGUID}.json`;
		let tmpRecordFilePath = this.fable.FilePersistence.joinPath(this.getSourceRecordFolderPath(pSourceHash), tmpRecordFileName);

		if (!this.fable.FilePersistence.existsSync(tmpRecordFilePath))
		{
			this.fable.log.warn(`Record [${pSourceHash}]:[${pRecordGUID}] not found in file [${tmpRecordFileName}] full path [${tmpRecordFilePath}] - delete failed.`);
			return fCallback();
		}

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.fable.FilePersistence.readFile(tmpRecordFilePath, 'utf8',
					function(pError, pData)
					{
						if (pError)
						{
							return fCallback(pError);
						}

						try
						{
							console.log(JSON.stringify(JSON.parse(pData), null, 4));
							// TODO: Create an undelete capability with the history location
							return fNext();
						}
						catch(pDeserializeError)
						{
							this.fable.log.warn(`Error deserializing [${pSourceHash}]:[${pRecordGUID}] in file [${tmpRecordFileName}] full path [${tmpRecordFilePath}]: ${pDeserializeError} -- delete will continue.`);
							return fNext();
						}
					}.bind(this));

			}.bind(this));

		tmpAnticipate.anticipate(
			function (fNext)
			{
				libFS.unlink(tmpRecordFilePath, fNext);
			}.bind(this));

		// TODO: Set the delete date stamp on the metadata for the record.

		tmpAnticipate.wait(fCallback);
	}
}

module.exports = BibliographStorageFS;