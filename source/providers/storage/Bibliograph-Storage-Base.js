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
		let tmpRecordJSONString = (typeof(pRecordJSONString) === 'string') ? pRecordJSONString : '{}';
		let tmpMetadata = {
			"GUID": pRecordGUID,
			"Length": tmpRecordJSONString.length,
			"QHash": this.fable.DataFormat.insecureStringHash(tmpRecordJSONString),
			"MD5": libCrypto.createHash('md5').update(tmpRecordJSONString).digest('hex'),
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
	persistRecordMetadata(pSourceHash, pRecordGUID, pMetadata, fCallback)
	{
		return fCallback(null);
	}

	generateDeltaContainer(pRecordGUID)
	{
		return (
			{
				RecordGUID: pRecordGUID,
				Deltas: []
			});
	}

	readRecordDelta(pSourceHash, pRecordGUID, fCallback)
	{
		return fCallback(null, this.generateDeltaContainer(pRecordGUID));
	}

	persistRecordDelta(pSourceHash, pMetadata, pDelta, fCallback)
	{
		// Off to /dev/null as with everything else in this base class
		return fCallback(null);
	}

	writeRecordDelta(pSourceHash, pRecordMetadata, pDelta, fCallback)
	{
		let tmpAnticipate = this.fable.newAnticipate();
		let tmpRecordDeltaContainer = this.generateDeltaContainer(pRecordMetadata.GUID);

		if (!pDelta)
		{
			return fCallback();
		}

		// Get the delta (or create a new one)
		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.readRecordDelta(pSourceHash, pRecordMetadata.GUID,
					function (pReadDeltaError, pRecordDeltaContainer)
					{
						if (pReadDeltaError)
						{
							this.log.warn(`Error reading existing delta for record [${pSourceHash}]:[${pRecordMetadata.GUID}]: ${pReadDeltaError}`);
						}

						if ((typeof(pRecordDeltaContainer) === 'object') && (pRecordDeltaContainer !== null))
						{
							tmpRecordDeltaContainer = pRecordDeltaContainer;
						}
						return fNext();
					}.bind(this))
			}.bind(this));

		// Now push the current Delta
		tmpAnticipate.anticipate(
			function (fNext)
			{
				tmpRecordDeltaContainer.Deltas.push(
					{
						Delta: pDelta,
						Ingest: pRecordMetadata.Ingest || +new Date(),
					});
				return fNext();
			}.bind(this));

		// Now persist the delta
		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.persistRecordDelta(pSourceHash, pRecordMetadata, tmpRecordDeltaContainer, fNext);
			}.bind(this));

		return fCallback(null);
	}

	/**
	 * Checks if a record exists in the storage.
	 *
	 * @param {Object} pSourceHash - The source hash containing context or configuration for the storage operation.
	 * @param {string} pRecordGUID - The unique identifier of the record to check for existence.
	 * @param {Function} fCallback - The callback function to execute after the check.
	 */
	exists(pSourceHash, pRecordGUID, fCallback)
	{
		return fCallback(null, false);
	}

	/**
	 * Reads the record keys from the specified source hash.
	 *
	 * @param {Object} pSourceHash - The source hash containing the data to read keys from.
	 * @param {Function} fCallback - The callback function to execute after reading the keys.
	 * @returns {void} The result is passed to the callback function.
	 */
	readRecordKeys(pSourceHash, fCallback)
	{
		return fCallback(null, []);
	}

	readRecordKeysByTimestamp(pSourceHash, pFromTimestamp, pToTimestamp, fCallback)
	{
		return fCallback(null, []);
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

	persistRecord(pSourceHash, pRecordGUID, pRecordJSONString, fCallback)
	{
		// Off to /dev/null as with everything else in this base class
		return fCallback(null);
	}

	stampRecordTimestamp(pSourceHash, pRecordGUID, fCallback)
	{
		// Off to /dev/null as with everything else in this base class
		return fCallback(null);
	}

	/**
	 * Writes a record to storage
	 *
	 * @param {string} pSourceHash - The hash of the source where the record should be stored.
	 * @param {string} pRecordGUID - The GUID of the record to store.
	 * @param {Object} pNewPartialRecord - The (potentially partial) record object to be written.
	 * @param {function} fCallback - A callback function to handle the result. 
	 */
	write(pSourceHash, pRecordGUID, pNewPartialRecord, fCallback)
	{
		// Start by checking the existing metadata
		let tmpExistingRecord = false;
		let tmpMergedNewRecord = false;
		let tmpRecordJSON = false;
		let tmpNewRecordMetadata = false;
		let tmpRecordChanged = true;

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.read(pSourceHash, pRecordGUID,
					function (pReadError, pExistingRecord)
					{
						if (pReadError)
						{
							this.log.warn(`Error reading record [${pSourceHash}]:[${pRecordGUID}]: ${pReadError}`);
						}

						tmpExistingRecord = pExistingRecord;
						tmpMergedNewRecord = { ...tmpExistingRecord, ...pNewPartialRecord };
						tmpRecordJSON = JSON.stringify(tmpMergedNewRecord);
						tmpNewRecordMetadata = this.generateMetadataForRecord(pRecordGUID, tmpRecordJSON);

						return fNext();
					}.bind(this));
			}.bind(this));

		if (this.pict.Bibliograph.options['Bibliograph-Check-Metadata-On-Write'])
		{
			let tmpExistingMetadata = false;

			tmpAnticipate.anticipate(
				function (fNext)
				{
					this.readRecordMetadata(pSourceHash, pRecordGUID,
						function (pReadMetadataError, pExistingMetadata)
						{
							if (pReadMetadataError)
							{
								this.log.warn(`Error reading metadata for record [${pSourceHash}]:[${pRecordGUID}]: ${pReadMetadataError}`);
							}

							tmpExistingMetadata = pExistingMetadata;
							return fNext();
						}.bind(this));
				}.bind(this));

			tmpAnticipate.anticipate(
				function (fNext)
				{
					if (!tmpExistingMetadata)
					{
						// There is no existing metadata; don't worry about comparing
						return fNext();
					}
					else
					{
						if (tmpExistingMetadata.GUID !== tmpNewRecordMetadata.GUID)
						{
							this.log.warn(`Record GUIDs do not match: ${tmpExistingMetadata.GUID} != ${tmpNewRecordMetadata.GUID}`);
							// This is the only problem that throws an error -- how would this even be possible?!
							return fNext(new Error('Record GUIDs do not match'));
						}
						else if (tmpExistingMetadata.Length !== tmpNewRecordMetadata.Length)
						{
							this.log.warn(`Record lengths do not match: ${tmpExistingMetadata.Length} != ${tmpNewRecordMetadata.Length}`);
							return fNext();
						}
						else if (tmpExistingMetadata.QHash !== tmpNewRecordMetadata.QHash)
						{
							this.log.warn(`Record hashes do not match: ${tmpExistingMetadata.QHash} != ${tmpNewRecordMetadata.QHash}`);
							return fNext();
						}
						else if (tmpExistingMetadata.MD5 !== tmpNewRecordMetadata.MD5)
						{
							this.log.warn(`Record hashes do not match: ${tmpExistingMetadata.MD5} != ${tmpNewRecordMetadata.MD5}`);
							return fNext();
						}

						// The metadata is definitely the same; no need to write
						tmpRecordChanged = false;
						return fNext();
					}
				}.bind(this));
		}

		if (this.pict.Bibliograph.options['Bibliograph-Store-Deltas'])
		{
			tmpAnticipate.anticipate(
				function (fNext)
				{
					this.writeRecordDelta(pSourceHash, tmpNewRecordMetadata, this.pict.BibliographRecordDiff.generateDelta(tmpExistingRecord, tmpMergedNewRecord),
						function (pWriteRecordDeltaError)
						{
							if (pWriteRecordDeltaError)
							{
								this.log.warn(`Error writing record delta [${pSourceHash}]:[${pRecordGUID}]: ${pWriteRecordDeltaError}`);
							}
							return fNext();
						}.bind(this));
				}.bind(this));
		}

		tmpAnticipate.anticipate(
			function (fNext)
			{
				if (!tmpRecordChanged)
				{
					return fNext();
				}
				this.persistRecordMetadata(pSourceHash, pRecordGUID, tmpNewRecordMetadata, fNext);
			}.bind(this));

		tmpAnticipate.anticipate(
			function (fNext)
			{
				if (!tmpRecordChanged)
				{
					return fNext();
				}
				else
				{

					tmpAnticipate.anticipate(
						function (fPersistComplete)
						{
							this.persistRecord(pSourceHash, pRecordGUID, tmpRecordJSON, fPersistComplete);
						}.bind(this));

					tmpAnticipate.anticipate(
						function (fTimeStampSetComplete)
						{
							this.stampRecordTimestamp(pSourceHash, pRecordGUID, fTimeStampSetComplete);
						}.bind(this));
				}

				return fNext();
			}.bind(this));

		tmpAnticipate.wait(fCallback);
	}

	persistDelete(pSourceHash, pRecordGUID, fCallback)
	{
		// Off to /dev/null as with everything else in this base class
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
		// Start by checking the existing metadata
		let tmpNewRecordMetadata = false;
		let tmpExistingMetadata = false;

		let tmpAnticipate = this.fable.newAnticipate();


		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.readRecordMetadata(pSourceHash, pRecordGUID,
					function (pReadMetadataError, pExistingMetadata)
					{
						if (pReadMetadataError)
						{
							this.log.warn(`Error reading metadata for record [${pSourceHash}]:[${pRecordGUID}]: ${pReadMetadataError}`);
						}

						tmpExistingMetadata = pExistingMetadata;
						return fNext();
					}.bind(this));
			}.bind(this));

		tmpAnticipate.anticipate(
			function (fNext)
			{
				if (!tmpExistingMetadata)
				{
					// There is no existing metadata; make just a deleted one.  This may mean the record doesn't exist.
					this.generateMetadataForRecord(pRecordGUID);
					return fNext();
				}

				tmpExistingMetadata.Deleted = +new Date();
				tmpNewRecordMetadata = tmpExistingMetadata;
				this.persistRecordMetadata(pSourceHash, pRecordGUID, tmpNewRecordMetadata, fNext);
			}.bind(this));

		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.persistDelete(pSourceHash, pRecordGUID, fNext);
			}.bind(this));

		tmpAnticipate.wait(fCallback);

	}
}

module.exports = BibliographServiceStorageBase;