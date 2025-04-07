const libPictProvider = require('pict-provider');

/*
* This diff implementation is meant to operate on JSON records within
* a keyspace expecting gradual changes to data on parts of the records.
*
* Said in a less horrible way, this simple diff is meant to compare
* an old record to a new record and find the differences between the
* two records. It is not meant to be a full "diff" implementation.
* 
* There are more sophisticated diff algorithms that can be used to
* compare large strings, text, and binary data which this is not meant
* to do.
* 
*
* After researching and implementing different diff types, it became
* apparent that we really only need to compare whatever comes in the 
* new record with the old... the old record is the "base" and the new
* record is what is replacing or appending the data.
*
* Notes below kept for posterity:
*
* --
*
* For reference from W3Schools, the following are the valid data types:
*
* <CONTENT BEGINNING OF (https://www.w3schools.com/js/js_json_datatypes.asp) W3SCHOOL'S JSON DATA TYPES DOCUMENTATION>
*
* Valid Data Types
* 
* In JSON, values must be one of the following data types:
* 
* - a string
* - a number
* - an object (JSON object)
* - an array
* - a boolean
* - null
*
* JSON values cannot be one of the following data types:
*
* - a function
* - a date
* - undefined
*
* <CONTENT END OF W3SCHOOL'S JSON DATA TYPES>
*
* The result object contains at minimum the status of the comparison;
* if the records are identical, the result will be:
* 
* { "M": 1 }
* 
* If the records are different, the result will contain the differences
* broken out by classifications of these differences in three buckets:
*
* - "Schema" - the keys that are different between the two records
* - "Type" - the data types that are different between the two records
* - "Value" - the value keys that don't match between the two records
* - "Error" - any errors in the json content (e.g. a function)
*
* Because these are meant to be the same "record" but different versions,
* the diff is broken out by old and new records.
*
* Some examples:
* this.diffRecords({ "a": 1, "b": 2 }, { "a": 1, "b": 3 })
* { "M": 0, "V": ["b"]
*
* Because this is meant to run on zillions of JSON records, the default
* is a "compressed" version of the diff which only uses the first
* character of each diff type key (e.g. "Match" becomes "M", j"Schema"
* becomes "S", etc.) -- this adds up fast with millions of records.
*
* If you really hate optimized data structures, In fact, there is a
* function you can run to "uncompress" the diff to the full version.
*
* Regardless of if the keys are compressed or not, the diff uses
* numbers (0 and 1) for false and true, respectively.  This also
* adds up to storage savings fast with millions of records.
*/

class BibliographRecordDiff extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'BibliographRecordDiff';
	}

	/**
	 * Compares two records and returns the differences between them.
	 * 
	 *
	 * @param {Object} pOldRecord - The first record to compare.
	 * @param {Object} pNewRecord - The second record to compare.
	 * @returns {Object} An object containing the differences between the two records.
	 */
	diffRecords(pOldRecord, pNewRecord)
	{
		if (typeof(pOldRecord) !== 'object' || pOldRecord === null)
		{
			throw new Error('The first argument to diff must be a non-null object.');
		}
		if (typeof(pNewRecord) !== 'object' || pNewRecord === null)
		{
			throw new Error('The second argument to diff must be a non-null object.');
		}
		let tmpDiff = {};

		let tmpNewKeys = Object.keys(pNewRecord);

		// Presume they are the same
		tmpDiff.M = 1;

		// Check for value differences
		tmpDiff.V = [];
		for (let i = 0; i < tmpNewKeys.length; i++)
		{
			if (pOldRecord[tmpNewKeys[i]] !== pNewRecord[tmpNewKeys[i]])
			{
				tmpDiff.V.push(tmpNewKeys[i]);
			}
		}

		if (tmpDiff.V.length > 0)
		{
			tmpDiff.M = 0;
		}

		return tmpDiff;
	}

	generateDiffDelta(pOldRecord, pNewRecord, pDiff)
	{
		if (typeof(pOldRecord) !== 'object' || pOldRecord === null)
		{
			throw new Error('The first argument to generateDiffCommit must be a non-null object.');
		}
		if (typeof(pNewRecord) !== 'object' || pNewRecord === null)
		{
			throw new Error('The second argument to generateDiffCommit must be a non-null object.');
		}
		if (typeof(pDiff) !== 'object' || pDiff === null)
		{
			throw new Error('The third argument to generateDiffCommit must be a non-null diff object.');
		}

		// If there is nothing to do, return false
		if (!pDiff.V || pDiff.V.length < 1)
		{
			return false;
		}

		let tmpNewRecord = {}
		for (let i = 0; i < pDiff.V.length; i++)
		{
			tmpNewRecord[pDiff.V[i]] = pNewRecord[pDiff.V[i]];
		}

		return tmpNewRecord;
	}

	generateDelta(pOldRecord, pNewRecord)
	{
		let tmpOldRecord = (typeof(pOldRecord) !== 'object' || pOldRecord === null) ? {} : pOldRecord;
		return this.generateDiffDelta(tmpOldRecord, pNewRecord, this.diffRecords(tmpOldRecord, pNewRecord));
	}
}

module.exports = BibliographRecordDiff;