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
	 * Extracts the record key from a metadata file name.
	 * 	
	 * This method is used to derive the record key from the metadata file name
	 * by removing the leading underscore and the trailing "_metadata.json" suffix.
	 * 
	 * @param {string} pFileName - The name of the metadata file.
	 * @returns {string} The extracted record key.
	 */
	getRecordKeyFromMetadataFileName(pFileName)
	{
		return pFileName.replace(/^_/, '').replace(/_metadata.json$/, '');
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
		let tmpRecordMetadataFileName = `_${pRecordGUID}_metadata.json`;
		let tmpRecordHistoryFileName = `_${pRecordGUID}_deltas.json`;
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
		this.fable.log.trace(`Bibliograph FS Source Create [${pSourceHash}]`);
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

		let tmpRecordMetadataFileName = `_${pRecordGUID}_metadata.json`;
		let tmpRecordMetadataFilePath = this.fable.FilePersistence.joinPath(this.getSourceMetadataFolderPath(pSourceHash), tmpRecordMetadataFileName);
		if (!this.fable.FilePersistence.existsSync(tmpRecordMetadataFilePath))
		{
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
					this.fable.log.error(`Error deserializing [${pSourceHash}]:[${pRecordGUID}] in Metadata file [${tmpRecordMetadataFileName}] full path [${tmpRecordMetadataFilePath}]: ${pDeserializeError}`);
					return fCallback(pDeserializeError);
				}
			}.bind(this));
	}

	readRecordDelta(pSourceHash, pRecordGUID, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; read of record [${pSourceHash}]:[${pRecordGUID}] delta failed.`));
		}

		let tmpRecordDeltaFileName = `_${pRecordGUID}_deltas.json`;
		let tmpRecordDeltaFilePath = this.fable.FilePersistence.joinPath(this.getSourceHistoryFolderPath(pSourceHash), tmpRecordDeltaFileName);
		let tmpRecordDeltaContainer = false;

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.fable.FilePersistence.readFile(tmpRecordDeltaFilePath, 'utf8', 
					function (pError, pData)
					{
						if (pError && pError.code === 'ENOENT')
						{
							tmpRecordDeltaContainer = this.generateDeltaContainer(pRecordGUID);
							return fNext();
						}
						else if (pError)
						{
							return fNext(pError);
						}

						try
						{
							tmpRecordDeltaContainer = JSON.parse(pData);
						}
						catch(pDeserializeError)
						{
							this.fable.log.error(`Error deserializing [${pSourceHash}]:[${pRecordGUID}] in Delta file [${tmpRecordDeltaFileName}] full path [${tmpRecordDeltaFilePath}]: ${pDeserializeError}`);
							return fNext(pDeserializeError);
						}

						return fNext(null);
					}.bind(this));
			}.bind(this));

		tmpAnticipate.wait(
			function (pError)
			{
				if (pError)
				{
					return fCallback(pError);
				}

				if (!tmpRecordDeltaContainer || !tmpRecordDeltaContainer.hasOwnProperty('Deltas') || !tmpRecordDeltaContainer.hasOwnProperty('RecordGUID'))
				{
					this.log.warn(`Record [${pSourceHash}]:[${pRecordGUID}] delta file [${tmpRecordDeltaFileName}] is not valid -- a valid delta container must be an object with RecordGUID string and a Deltas array properties.`);
					return fCallback(null, this.generateDeltaContainer(pRecordGUID));
				}

				return fCallback(null, tmpRecordDeltaContainer);
			}.bind(this));
	}

	/**
	 * Reads the record keys from the file system for a specific source hash.
	 * 
	 * @param {string} pSourceHash - The hash representing the source whose record keys are to be read.
	 * @param {function(Error|null, string[]|null): void} fCallback - The callback function to handle the result.
	 * @throws {Error} If the storage is not initialized.
	 */
	readRecordKeys(pSourceHash, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; read of record keys [${pSourceHash}] failed.`));
		}

		libFS.readdir(this.getSourceRecordFolderPath(pSourceHash), function(pError, pFiles)
		{
			if (pError)
			{
				return fCallback(pError);
			}

			let tmpKeys = [];
			for (let i = 0; i < pFiles.length; i++)
			{
				// If it isn't a JSON file, skip it.
				if (pFiles[i].indexOf('.json') === -1)
				{
					continue;
				}
				tmpKeys.push(pFiles[i].replace('.json', ''));
			}

			return fCallback(null, tmpKeys);
		});
	}

	readRecordKeysByTimestamp(pSourceHash, pFromTimestamp, pToTimestamp, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; write of record [${pSourceHash}]:[${pRecordMetadata.GUID}] delta failed.`));
		}

		let tmpRecordKeysContainer = [];

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				libFS.readdir(this.getSourceMetadataFolderPath(pSourceHash), function(pError, pFiles)
				{
					if (pError)
					{
						return fCallback(pError);
					}

					for (let i = 0; i < pFiles.length; i++)
					{
						const tmpFilePath = this.fable.FilePersistence.joinPath(this.getSourceMetadataFolderPath(pSourceHash), pFiles[i]);
						tmpAnticipate.anticipate(
							function (fNextFile)
							{
								libFS.stat(tmpFilePath, function(pStatError, pFileStats)
								{
									if (pFileStats.isFile())
									{
										const tmpModifiedTime = pFileStats.mtime;
										if (tmpModifiedTime >= pFromTimestamp && tmpModifiedTime <= pToTimestamp)
										{
											tmpRecordKeysContainer.push(this.getRecordKeyFromMetadataFileName(pFiles[i]));
										}
									}
									return fNextFile(pStatError);
								}.bind(this))
							}.bind(this));
					}

					return fNext(null);
				}.bind(this));
			}.bind(this));

		tmpAnticipate.wait(
			function (pError)
			{
				if (pError)
				{
					return fCallback(pError);
				}

				if (!Array.isArray(tmpRecordKeysContainer))
				{
					this.log.warn(`Read record keys failed for record source [${pSourceHash}]: ${pError}`);
					return fCallback(null, []);
				}

				return fCallback(null, tmpRecordKeysContainer);
			}.bind(this));
	}

	/**
	 * Checks if a record exists in the file system storage.
	 *
	 * @param {string} pSourceHash - The hash of the source to locate the record folder.
	 * @param {string} pRecordGUID - The unique identifier (GUID) of the record to check for existence.
	 * @param {function(Error|null, boolean):void} fCallback - A callback function that is invoked with an error (if any) and a boolean indicating the existence of the record.
	 * @returns {void} - This function does not return a value; it uses the callback to provide results.
	 * @throws {Error} - Throws an error if the storage is not initialized.
	 */
	exists(pSourceHash, pRecordGUID, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; check existence of record [${pSourceHash}]:[${pRecordGUID}] failed.`));
		}

		let tmpRecordFileName = `${pRecordGUID}.json`;
		let tmpRecordFilePath = this.fable.FilePersistence.joinPath(this.getSourceRecordFolderPath(pSourceHash), tmpRecordFileName);

		this.fable.FilePersistence.exists(tmpRecordFilePath, fCallback);
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
					this.fable.log.error(`Error deserializing [${pSourceHash}]:[${pRecordGUID}] in Record file [${tmpRecordFileName}] full path [${tmpRecordFilePath}]: ${pDeserializeError}`);
					return fCallback(pDeserializeError);
				}
			}.bind(this));
	}

	/**
	 * Writes a record to the file system storage.
	 *
	 * @param {string} pSourceHash - The hash of the source where the record belongs.
	 * @param {string} pRecordGUID - The unique identifier (GUID) of the record to be written.
	 * @param {string} pRecordJSON - The record data to be written to the store
	 * @param {Function} fCallback - The callback function to execute after the write operation is complete.
	 * @throws {Error} Throws an error if the storage is not initialized.
	 */
	persistRecord(pSourceHash, pRecordGUID, pRecordJSON, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; write of record [${pSourceHash}]:[${pRecordGUID}] failed.`));
		}

		let tmpRecordFileName = `${pRecordGUID}.json`;
		let tmpRecordFilePath = this.fable.FilePersistence.joinPath(this.getSourceRecordFolderPath(pSourceHash), tmpRecordFileName);

		this.fable.FilePersistence.writeFile(tmpRecordFilePath, pRecordJSON, 'utf8', fCallback);
	}


	/**
	 * Saves the delta container of a record
	 *
	 * @param {string} pSourceHash - The source hash identifying the record's source folder.
	 * @param {object} pRecordMetadata - the Metadata object for the record
	 * @param {object} pDeltaContainer - the delta snapshots object for the record
	 * @throws {Error} If the storage is not initialized, an error is passed to the callback.
	 */
	persistRecordDelta(pSourceHash, pRecordMetadata, pDeltaContainer, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; write of record [${pSourceHash}]:[${pRecordMetadata.GUID}] delta failed.`));
		}

		let tmpRecordDeltaFileName = `_${pRecordMetadata.GUID}_deltas.json`;
		let tmpRecordDeltaFilePath = this.fable.FilePersistence.joinPath(this.getSourceHistoryFolderPath(pSourceHash), tmpRecordDeltaFileName);

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.fable.FilePersistence.writeFile(tmpRecordDeltaFilePath, JSON.stringify(pDeltaContainer), 'utf8', fNext);
			}.bind(this));

		tmpAnticipate.wait(fCallback);
	}


	// For filesystem, the modified time of the metadata file is analagous with
	// the record timestamp, so no need to do anything explicit like with
	// the indexed methods.
	// stampRecordTimestamp(pSourceHash, pRecordGUID, fCallback)
	// {
	// 	return fCallback(null);
	// }


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
	persistRecordMetadata(pSourceHash, pRecordGUID, pMetadata, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph FS Storage not initialized; write of record [${pSourceHash}]:[${pRecordGUID}] metadata failed.`));
		}

		let tmpRecordMetadataFileName = `_${pRecordGUID}_metadata.json`;
		let tmpRecordMetadataFilePath = this.fable.FilePersistence.joinPath(this.getSourceMetadataFolderPath(pSourceHash), tmpRecordMetadataFileName);
		let tmpRecordMetadataJSON = JSON.stringify(pMetadata);

		this.fable.FilePersistence.writeFile(tmpRecordMetadataFilePath, tmpRecordMetadataJSON, 'utf8', fCallback);
	}

	/**
	 * Deletes a record file from the file system based on the provided source hash and record GUID.
	 *
	 * @param {string} pSourceHash - The source hash identifying the record's source folder.
	 * @param {string} pRecordGUID - The unique identifier (GUID) of the record to delete.
	 * @param {Function} fCallback - A callback function to handle the result of the delete operation.
	 * @throws {Error} If the storage is not initialized, an error is passed to the callback.
	 */
	persistDelete(pSourceHash, pRecordGUID, fCallback)
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
				libFS.unlink(tmpRecordFilePath, fNext);
			}.bind(this));

		tmpAnticipate.wait(fCallback);
	}
}

module.exports = BibliographStorageFS;