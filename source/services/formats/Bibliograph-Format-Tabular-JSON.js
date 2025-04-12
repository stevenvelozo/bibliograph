const libPictProvider = require('pict-provider');

/*
* Generate a Tabular JSON representation of a data set.
*
* This came about because CSV is not quite opinionated enough and has no room
* for metadata.  And.  JSON stores a copy of the keys every single record.
*
* Just in the example test harness in this repository, which has a CSV file
* from the Department of Education.  The data contains a number of stats about
* colleges and universities in the United States.  There are about 6,500 rows
* of data.
*
* Serializing these records in JSON, a SIGNIFICANT percentage of the space
* usage is the keys.
*/

class TabularJSON extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'TabularJSON';
	}
}

module.exports = TabularJSON;