const libPictProvider = require('pict-provider');

class BibliographFormatBase extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'BibliographFormatBase';
	}

	/**
	 * Generate an output format for the given record set.
	 * @param {Array} pRecordSet - The set of records to generate a format for
	 */
	generate(pRecordSet)
	{
		// This is a stub.  The generate method should be implemented in subclasses.
		return false;
	}

	/**
	 * 
	 * @param {Any} pInput - The input (object, string, stream, etc.) to be ingested into the defined store
	 * @returns 
	 */
	ingest(pSpInput)
	{
		// This is a stub.  The ingest method should be implemented in subclasses.
		return false;
	}
}

module.exports = BibliographFormatBase;