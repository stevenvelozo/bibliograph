const libBibliographStorageBase = require('./Bibliograph-Storage-Base.js');

class BibliographStorageProvider extends libBibliographStorageBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.Initialized = false;
	}

	/**
	 * Initializes the Bibliograph _STORAGE_ Storage
	 * 
	 * @param {Function} fCallback - A callback function to be executed once the initialization is complete.
	 * @returns {Promise} A promise that resolves when all initialization steps are completed.
	 */
	initialize(fCallback)
	{
		this.fable.log.trace(`Bibliograph _STORAGE_ Storage Initialization.`);
		let tmpAnticipate = this.fable.newAnticipate();
		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Initialize the storage engine
				return fNext();
			}.bind(this));
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
	 * Creates a new source folder in the _STORAGE_ storage.
	 * 
	 * @param {string} pSourceHash - The unique identifier for the source to be created.
	 * @param {function(Error|null):void} fCallback - The callback function to execute once the process is complete.
	 * @returns {void} This method does not return a value. The result is passed to the callback function.
	 * @throws {Error} If the storage is not initialized, an error is passed to the callback.
	 */
	sourceCreate(pSourceHash, fCallback)
	{
		if (!this.Initialized)
		{
			this.fable.log.error(`Bibliograph _STORAGE_ Storage not initialized; creation of source [${pSourceHash}] failed.`);
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; creation of source [${pSourceHash}] failed.`));
		}

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Create the record source
				return fNext();
			}.bind(this));

		tmpAnticipate.wait(
			function(pError)
			{
				if (pError)
				{
					this.fable.log.error(`Bibliograph _STORAGE_ Source Creation [${pSourceHash}] initialization failed: ${pError}`);
					return fCallback(pError);
				}
				return fCallback();
			}.bind(this));
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
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; read of record [${pSourceHash}]:[${pRecordGUID}] metadata failed.`));
		}

		let tmpSourceExists = false;

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Check if a source exists and put it in tmpSourceExists
				return fNext();
			}.bind(this));

		tmpAnticipate.wait(
			function(pError)
			{
				if (pError)
				{
					return fCallback(pError);
				}
				return fCallback(null, tmpSourceExists);
			}.bind(this));
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
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; read of record [${pSourceHash}]:[${pRecordGUID}] metadata failed.`));
		}

		let tmpRecordMetadata = {};

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Read metadata into tmpRecordMetadata
				return fNext();
			}.bind(this));

		tmpAnticipate.wait(
			function(pError)
			{
				if (pError)
				{
					return fCallback(pError);
				}

				return fCallback(null, tmpRecordMetadata);
			}.bind(this));
	}

	readRecordDelta(pSourceHash, pRecordGUID, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; read of record [${pSourceHash}]:[${pRecordGUID}] delta failed.`));
		}

		let tmpRecordDeltaContainer = false;

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Read the Delta container into tmpDeltaContainer
				return fNext();
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
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; read of record keys [${pSourceHash}] failed.`));
		}

		let tmpRecordKeysContainer = false;

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				//Read the keys into tmpRecordKeysContainer
				return fNext();
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

	readRecordKeysByTimestamp(pSourceHash, pFromTimestamp, pToTimestamp, fCallback)
	{
		return fCallback(null, []);
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
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; check existence of record [${pSourceHash}]:[${pRecordGUID}] failed.`));
		}

		let tmpRecordExists = false;

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Read whether the record exists into tmpRecordExists
				return fNext();
			}.bind(this));


		tmpAnticipate.wait(
			function (pError)
			{
				if (pError)
				{
					return fCallback(pError);
				}
				return fCallback(null, tmpRecordExists);
			}.bind(this));
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
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; read of record [${pSourceHash}]:[${pRecordGUID}] failed.`));
		}

		let tmpRecord = false;

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Read the Record into tmpRecord
				return fNext();
			}.bind(this));


		tmpAnticipate.wait(
			function (pError)
			{
				if (pError)
				{
					return fCallback(pError);
				}

				return fCallback(null, tmpRecord);
			}.bind(this));
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
	persistRecordMetadata(pSourceHash, pRecordGUID, pMetadata, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; write of record [${pSourceHash}]:[${pRecordGUID}] metadata failed.`));
		}
		let tmpAnticipate = this.fable.newAnticipate();
		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Write the record metadata in pMetadata
				return fNext();
			}.bind(this));
		tmpAnticipate.wait(fCallback);
	}

	/**
	 * Persists a record delta to the storage engine.
	 *
	 * @param {string} pSourceHash - The hash of the source record.
	 * @param {Object} pRecordMetadata - Metadata of the record, including its GUID.
	 * @param {Object} pDeltaContainer - The container holding the delta changes to be persisted.
	 * @param {Function} fCallback - The callback function to execute after the operation is complete.
	 * @throws {Error} If the storage engine is not initialized, an error is passed to the callback.
	 */
	persistRecordDelta(pSourceHash, pRecordMetadata, pDeltaContainer, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; write of record [${pSourceHash}]:[${pRecordMetadata.GUID}] delta failed.`));
		}

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Persist the record delta in pDeltaContainer
				return fNext();
			}.bind(this));

		tmpAnticipate.wait(fCallback);
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
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; write of record [${pSourceHash}]:[${pRecordGUID}] failed.`));
		}

		let tmpAnticipate = this.fable.newAnticipate();
		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Write the record in the pRecordJSON string
				return fNext();
			}.bind(this));
		tmpAnticipate.wait(fCallback);
	}

	/**
	 * Stamps a record with a timestamp based on the provided source hash and record GUID.
	 *
	 * @param {Object} pSourceHash - The source hash object containing metadata or data related to the record.
	 * @param {string} pRecordGUID - The unique identifier (GUID) of the record to be stamped.
	 * @param {Function} fCallback - The callback function to be executed after stamping the record.
	 * @returns {void} - This function does not return a value; it invokes the callback instead.
	 */
	stampRecordTimestamp(pSourceHash, pRecordGUID, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; timestamp stamp of record [${pSourceHash}]:[${pRecordGUID}] failed.`));
		}

		let tmpAnticipate = this.fable.newAnticipate();
		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Stamp a timestamp for pRecordGUID
				return fNext();
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
	persistDelete(pSourceHash, pRecordGUID, fCallback)
	{
		if (!this.Initialized)
		{
			return fCallback(new Error(`Bibliograph _STORAGE_ Storage not initialized; delete of record [${pSourceHash}]:[${pRecordGUID}] failed.`));
		}

		let tmpAnticipate = this.fable.newAnticipate();
		tmpAnticipate.anticipate(
			function (fNext)
			{
				// Delete the record in pRecordGUID
				return fNext();
			}.bind(this));
		tmpAnticipate.wait(fCallback);
	}
}

module.exports = BibliographStorageProvider;