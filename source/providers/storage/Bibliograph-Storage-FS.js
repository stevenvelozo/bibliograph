const libBibliographStorageBase = require('./Bibliograph-Storage-Base.js');
const libFS = require('fs');

const libCrypto = require('crypto');

class BibliographStorageFS extends libBibliographStorageBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.fable.instantiateServiceProviderIfNotExists('FilePersistence');

		this.StorageFolder = false;

		this.Initialized = false;
	}

	setStorageFolder(pStorageFolder)
	{
		if (this.StorageFolder)
		{
			//this.fable.log.trace(`Storage folder already set: [${this.StorageFolder}]`);
			return false;
		}

		if (typeof(pStorageFolder) == 'string')
		{
			this.StorageFolder = this.fable.FilePersistence.joinPath(pStorageFolder);
		}
		else if (this.fable.settings.hasOwnProperty('Bibliograph-Storage-FS-Path'))
		{
			this.StorageFolder = this.fable.FilePersistence.joinPath(this.fable.settings['Bibliograph-Storage-FS-Path']);
		}
		else
		{
			this.StorageFolder = this.fable.FilePersistence.joinPath(this.fable.Bibliograph.options['Bibliograph-Storage-FS-Path']);
		}

		return true;
	}

	checkStorageFolder(fCallback)
	{
		this.setStorageFolder();
		this.fable.log.trace(`Checking the storage folder for write permissions: [${this.StorageFolder}]`);
		return libFS.access(this.StorageFolder, libFS.constants.W_OK, fCallback);
	}

	createStorageFolder(fCallback)
	{
		this.setStorageFolder();
		this.fable.log.trace(`Creating the storage folder if it doesn't exist: [${this.StorageFolder}]`);

		let tmpAnticipate = this.fable.newAnticipate();
		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.fable.FilePersistence.makeFolderRecursive(this.StorageFolder, fNext);
			}.bind(this));
		tmpAnticipate.wait(fCallback);
	}

	getSourceFolderPath(pSourceHash)
	{
		return this.fable.FilePersistence.joinPath(this.StorageFolder, pSourceHash);
	}
	getSourceMetadataFolderPath(pSourceHash)
	{
		return this.fable.FilePersistence.joinPath(this.getSourceFolderPath(pSourceHash), 'metadata');
	}
	getSourceRecordFolderPath(pSourceHash)
	{
		return this.fable.FilePersistence.joinPath(this.getSourceFolderPath(pSourceHash), 'record');
	}

	createSourceFolder(pSourceHash, fCallback)
	{
		if (typeof(pSourceHash) !== 'string')
		{
			return fCallback(new Error(`Source folder must be a string.`));
		}

		let tmpAnticipate = this.fable.newAnticipate();

		if ((!libFS.existsSync(this.getSourceFolderPath(pSourceHash))) 
			|| (!libFS.existsSync(this.getSourceMetadataFolderPath(pSourceHash))) 
			|| (!libFS.existsSync(this.getSourceRecordFolderPath(pSourceHash)))
			)
		{
			tmpAnticipate.anticipate(
				function (fNext)
				{
					this.fable.FilePersistence.makeFolderRecursive(this.getSourceFolderPath(pSourceHash), fNext);
				}.bind(this));
			tmpAnticipate.anticipate(
				function (fNext)
				{
					this.fable.FilePersistence.makeFolderRecursive(this.getSourceMetadataFolderPath(pSourceHash), fNext);
				}.bind(this));
			tmpAnticipate.anticipate(
				function (fNext)
				{
					this.fable.FilePersistence.makeFolderRecursive(this.getSourceRecordFolderPath(pSourceHash), fNext);
				}.bind(this));
		}

		tmpAnticipate.wait(fCallback);
	}

	initialize(fCallback)
	{
		this.fable.log.trace(`Bibliograph FS Storage Initialization: ${this.StorageFolder}`);
		let tmpAnticipate = this.fable.newAnticipate();
		tmpAnticipate.anticipate(this.createStorageFolder.bind(this));
		tmpAnticipate.anticipate(this.checkStorageFolder.bind(this));
		tmpAnticipate.anticipate(this.finalizeInitialization.bind(this));
		return tmpAnticipate.wait(fCallback);
	}

	finalizeInitialization(fCallback)
	{
		this.Initialized = true;
		return fCallback();
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

	/**
	 * Check to see if a source exists.
	 * 
	 * @param {string} pSourceHash
	 * @param {function} fCallback
	 * 
	 * @returns void
	 */
	checkSourceExists(pSourceHash, fCallback)
	{
		let tmpSourceFolder = this.fable.FilePersistence.joinPath(this.StorageFolder, `${pSourceHash}`);
		let tmpExists = this.fable.FilePersistence.existsSync(tmpSourceFolder);
		return fCallback(null, tmpExists);
	}

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

	writeMetadata(pSourceHash, pRecordGUID, pMetadata, fCallback)
	{
		let tmpRecordMetadataFileName = `${pRecordGUID}__metadata__.json`;
		let tmpRecordMetadataFilePath = this.fable.FilePersistence.joinPath(this.getSourceMetadataFolderPath(pSourceHash), tmpRecordMetadataFileName);
		let tmpRecordMetadataJSON = JSON.stringify(pMetadata);
		this.fable.FilePersistence.writeFile(tmpRecordMetadataFilePath, tmpRecordMetadataJSON, 'utf8', fCallback);
	}

	write(pSourceHash, pRecordGUID, pRecord, fCallback)
	{
		let tmpRecordFileName = `${pRecordGUID}.json`;
		let tmpRecordFilePath = this.fable.FilePersistence.joinPath(this.getSourceRecordFolderPath(pSourceHash), tmpRecordFileName);
		let tmpRecordJSON = JSON.stringify(pRecord);

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				let tmpMetadata = this.generateMetadataForRecord(pRecordGUID, tmpRecordJSON);
				this.writeMetadata(pSourceHash, pRecordGUID, tmpMetadata, fNext);
			}.bind(this));

		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.fable.FilePersistence.writeFile(tmpRecordFilePath, tmpRecordJSON, 'utf8', fNext);
			}.bind(this));

		tmpAnticipate.wait(fCallback);
	}

	readMetadata(pSourceHash, pRecordGUID, fCallback)
	{
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

	read(pSourceHash, pRecordGUID, fCallback)
	{
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
			});
	}
}

module.exports = BibliographStorageFS;