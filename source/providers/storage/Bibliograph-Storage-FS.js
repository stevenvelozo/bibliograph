const libBibliographStorageBase = require('./Bibliograph-Storage-Base.js');
const libFS = require('fs');

class BibliographStorageFS extends libBibliographStorageBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.fable.instantiateServiceProviderIfNotExists('FilePersistence');

		this.StorageFolder = false;

		this.Initialized = false;
	}

	/**
	 * Initializes the Bibliograph FS Storage
	 * 
	 * Sets up and checks the storage folder, finalizes the initialization process.
	 *
	 * @param {Function} fCallback - A callback function to be executed once the initialization is complete.
	 * @returns {Promise} A promise that resolves when all initialization steps are completed.
	 */
	initialize(fCallback)
	{
		this.fable.log.trace(`Bibliograph FS Storage Initialization: ${this.StorageFolder}`);
		let tmpAnticipate = this.fable.newAnticipate();
		tmpAnticipate.anticipate(this.createStorageFolder.bind(this));
		tmpAnticipate.anticipate(this.checkStorageFolder.bind(this));
		tmpAnticipate.anticipate(this.finalizeInitialization.bind(this));
		return tmpAnticipate.wait(fCallback);
	}

	/**
	 * Finalizes the initialization process.
	 * 
	 * Sets the `Initialized` property to true and invokes the provided callback function.
	 * 
	 * This is somewhat like a `onAfterInitialize` method without the heavy scoping.  Meant
	 * to be overridden.
	 *
	 * @param {Function} fCallback - The callback function to be executed after initialization.
	 * @returns {*} - The result of the callback function execution.
	 */
	finalizeInitialization(fCallback)
	{
		this.Initialized = true;
		return fCallback();
	}

	/**
	 * Sets the storage folder for the Bibliograph-Storage-FS provider.
	 * 
	 * This method initializes the `StorageFolder` property if it has not already been set.
	 * The folder path can be provided as a parameter, or it will be determined from the
	 * configuration settings.
	 * 
	 * @param {string} pStorageFolder - The path to the storage folder.
	 * @returns {boolean} - Returns `true` if the storage folder was successfully set.
	 */
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

	/**
	 * Checks the storage folder for write permissions and other suitability metrics.
	 *
	 * This method sets the storage folder path and logs a trace message indicating
	 * the folder being checked. It then uses the Node.js `fs.access` method to verify
	 * if the folder has write permissions.
	 *
	 * @param {Function} fCallback - A callback function to handle the result of the permission check.
	 * @returns {void} The result of the permission check is passed to the callback function.
	 */
	checkStorageFolder(fCallback)
	{
		this.setStorageFolder();
		this.fable.log.trace(`Checking the storage folder for write permissions: [${this.StorageFolder}]`);
		return libFS.access(this.StorageFolder, libFS.constants.W_OK, fCallback);
	}

	/**
	 * Creates the storage folder if it doesn't already exist.
	 * 
	 * This method sets the storage folder path and ensures its existence
	 * by creating it recursively if necessary.
	 *
	 * @param {Function} fCallback - The callback function to execute after the folder creation process is complete.
	 */
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

	/**
	 * Creates the necessary source folders for a given source hash if they do not already exist.
	 *
	 * @param {string} pSourceHash - The hash representing the source folder to be created.
	 * @param {Function} fCallback - A callback function to be executed once the folder creation process is complete.
	 *
	 * @throws {Error} If the provided `pSourceHash` is not a string.
	 */
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
			|| (!libFS.existsSync(this.getSourceHistoryFolderPath(pSourceHash)))
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
			tmpAnticipate.anticipate(
				function (fNext)
				{
					this.fable.FilePersistence.makeFolderRecursive(this.getSourceHistoryFolderPath(pSourceHash), fNext);
				}.bind(this));
		}

		tmpAnticipate.wait(fCallback);
	}

	/**
	 * Retrieves the full path to the source folder based on the provided source hash.
	 *
	 * @param {string} pSourceHash - The unique hash representing the source folder.
	 * @returns {string} The full path to the source folder.
	 */
	getSourceFolderPath(pSourceHash)
	{
		return this.fable.FilePersistence.joinPath(this.StorageFolder, pSourceHash);
	}

	/**
	 * Retrieves the folder path for storing metadata associated with a specific source.
	 *
	 * @param {string} pSourceHash - The unique hash identifying the source.
	 * @returns {string} The full path to the metadata folder for the given source.
	 */
	getSourceMetadataFolderPath(pSourceHash)
	{
		return this.fable.FilePersistence.joinPath(this.getSourceFolderPath(pSourceHash), 'metadata');
	}

	/**
	 * Retrieves the folder path for storing source records based on the provided source hash.
	 *
	 * @param {string} pSourceHash - The unique hash identifying the source.
	 * @returns {string} The full path to the folder where source records are stored.
	 */
	getSourceRecordFolderPath(pSourceHash)
	{
		return this.fable.FilePersistence.joinPath(this.getSourceFolderPath(pSourceHash), 'record');
	}

	/**
	 * Retrieves the file system path to the history folder for a specific source.
	 *
	 * @param {string} pSourceHash - The unique hash identifier for the source.
	 * @returns {string} The full path to the history folder for the given source.
	 */
	getSourceHistoryFolderPath(pSourceHash)
	{
		return this.fable.FilePersistence.joinPath(this.getSourceFolderPath(pSourceHash), 'history');
	}

	/**
	 * Generates file location data for a record, including paths for the record file, metadata file, and history file.
	 *
	 * This is used to manage simple file read/writes for the Bibliograph service 
	 * running in File System mode.  This mode is not recommended for production use.
	 * Highly recommended for development use.
	 * 
	 *   - `RecordFileName`: The name of the record file.
	 *   - `Record`: The full path to the record file.
	 *   - `MetadataFileName`: The name of the metadata file.
	 *   - `Metadata`: The full path to the metadata file.
	 *   - `HistoryFileName`: The name of the history file.
	 *   - `History`: The full path to the history file.

	 * 
	 * @param {string} pSourceHash - The hash of the source to determine folder paths.
	 * @param {string} pRecordGUID - The unique identifier (GUID) of the record.
	 * @returns {Object} An object containing file names and their corresponding paths.
	 */
	getRecordFileLocationData(pSourceHash, pRecordGUID)
	{
		let tmpRecordFileName = `${pRecordGUID}.json`;
		let tmpRecordMetadataFileName = `__${pRecordGUID}__metadata__.json`;
		let tmpRecordHistoryFileName = `__${pRecordGUID}__history__.json`;
		return (
			{
				"RecordFileName": tmpRecordFileName,
				"Record": this.fable.FilePersistence.joinPath(this.getSourceRecordFolderPath(pSourceHash), tmpRecordFileName),

				"MetadataFileName": tmpRecordMetadataFileName,
				"Metadata": this.fable.FilePersistence.joinPath(this.getSourceMetadataFolderPath(pSourceHash), tmpRecordMetadataFileName),

				"HistoryFileName": tmpRecordHistoryFileName,
				"History": this.fable.FilePersistence.joinPath(this.getSourceHistoryFolderPath(pSourceHash), tmpRecordHistoryFileName)
			});
	}

	/**
	 * Creates a new source folder in the file system storage.
	 * 
	 * This method initializes the process of creating a source folder by ensuring
	 * the storage folder is initialized, creating the storage folder if necessary,
	 * and then creating the source folder for the given source hash.
	 * 
	 * @param {string} pSourceHash - The unique identifier for the source to be created.
	 * @param {function(Error|null):void} fCallback - The callback function to execute once the process is complete.
	 * @returns {void} This method does not return a value. The result is passed to the callback function.
	 * @throws {Error} If the storage is not initialized, an error is passed to the callback.
	 */
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
	 * @returns void
	 */
	checkSourceExists(pSourceHash, fCallback)
	{
		let tmpSourceFolder = this.fable.FilePersistence.joinPath(this.StorageFolder, `${pSourceHash}`);
		let tmpExists = this.fable.FilePersistence.existsSync(tmpSourceFolder);
		return fCallback(null, tmpExists);
	}

	/**
	 * Reads metadata for a specific record from the file system.
	 *
	 * @param {string} pSourceHash - The hash of the source to locate the metadata folder.
	 * @param {string} pRecordGUID - The unique identifier of the record whose metadata is being read.
	 * @param {function(Error|null, Object|boolean):void} fCallback - A callback function to handle the result.
	 *        - If successful, the second parameter will contain the parsed metadata object.
	 *        - If the metadata file does not exist, the second parameter will be `false`.
	 *        - If an error occurs, the first parameter will contain the error object.
	 * @returns {void} This function does not return a value; results are passed to the callback.
	 * @throws {Error} Throws an error if the storage is not initialized.
	 */
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

	/**
	 * Writes metadata for a specific record to a file in the filesystem.
	 *
	 * @param {string} pSourceHash - The hash of the source to which the record belongs.
	 * @param {string} pRecordGUID - The unique identifier (GUID) of the record.
	 * @param {Object} pMetadata - The metadata object to be written to the file.
	 * @param {Function} fCallback - The callback function to execute after the operation.
	 *                                It receives an error as the first argument if the operation fails.
	 *
	 * @throws {Error} Throws an error if the storage is not initialized.
	 */
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

	/**
	 * Reads a record from the file system storage.
	 *
	 * @param {string} pSourceHash - The hash of the source to identify the storage location.
	 * @param {string} pRecordGUID - The unique identifier (GUID) of the record to be read.
	 * @param {function(Error|null, Object|null):void} fCallback - The callback function to handle the result.
	 * @returns {void} - This function does not return a value; it uses a callback to handle the result.
	 * @throws {Error} - Throws an error if the storage is not initialized.
	 */
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

	/**
	 * Writes a record to the file system storage.
	 *
	 * @param {string} pSourceHash - The hash of the source where the record belongs.
	 * @param {string} pRecordGUID - The unique identifier (GUID) of the record to be written.
	 * @param {Object} pRecord - The record data to be written as a JSON object.
	 * @param {Function} fCallback - The callback function to execute after the write operation is complete.
	 * @throws {Error} Throws an error if the storage is not initialized.
	 */
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

	/**
	 * Deletes a record file from the file system based on the provided source hash and record GUID.
	 *
	 * @param {string} pSourceHash - The source hash identifying the record's source folder.
	 * @param {string} pRecordGUID - The unique identifier (GUID) of the record to delete.
	 * @param {Function} fCallback - A callback function to handle the result of the delete operation.
	 * @throws {Error} If the storage is not initialized, an error is passed to the callback.
	 */
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