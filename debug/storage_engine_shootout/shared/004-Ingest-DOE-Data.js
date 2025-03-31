/*
 * Pull in the raw DOE Institution data
 *
 * This is an excessively wide CSV file; some rows are 13+k characters long.
 * The file is a CSV file with a header row and a data row for each institution.
 * The file is 6,484 rows long and >100M in size.
 */

const __SOURCE_NAME = 'DoE-Institutions';

function ingest_DepartmentOfEducation_InstitutionData(pPict)
{
	let tmpAnticipate = pPict.newAnticipate();

	tmpAnticipate.anticipate(pPict.Bibliograph.initialize.bind(pPict.Bibliograph));

	tmpAnticipate.anticipate(
		function (fNext)
		{
			pPict.Bibliograph.createSource(__SOURCE_NAME, fNext);
		});

	tmpAnticipate.anticipate(
		function (fNext)
		{
			let tmpCSVFilePath = pPict.settings.InputFilePath;
			let tmpCSVExists = libFS.existsSync(tmpCSVFilePath);

			let tmpCSVParser = pPict.instantiateServiceProvider('CSVParser');

			// This is a fun way to stream the CSV file into the Bibliograph service
			let tmpImportAnticipate = pPict.newAnticipate();

			if (!tmpCSVExists)
			{
				const tmpErrorMessage = `The CSV [${tmpCSVFilePath}] does not exist; please decompress the zipped file in the input folder.`;
				return fNext(new Error(tmpErrorMessage));
			}

			const tmpReadline = libReadline.createInterface(
				{
					input: libFS.createReadStream(tmpCSVFilePath),
					crlfDelay: Infinity
				});

			tmpReadline.on('line', 
				function (pLine)
				{
					let tmpRecord = tmpCSVParser.parseCSVLine(pLine);
					if (tmpRecord)
					{
						tmpImportAnticipate.anticipate(
							function (fWriteComplete)
							{
								let tmpRecordGUID = tmpRecord.UNITID;
								//pPict.log.trace(`Writing record GUID [${tmpRecordGUID}] ${tmpRecord.INSTNM} to the Bibliograph service...`);
								pPict.Bibliograph.write(__SOURCE_NAME, tmpRecordGUID, tmpRecord, fWriteComplete);
							});
					}
				});

			tmpReadline.on('close',
				function ()
				{
					//pPict.log.trace(`Readline closed for ${tmpCSVFilePath}; awaiting write completion...`);
					tmpImportAnticipate.wait(fNext);
				});
		});

	tmpAnticipate.wait(
		function(pError)
		{
			if (pError)
			{
				pPict.log.error(`Error executing the Bibliograph harness: ${pError}`, pError);
			}
			pPict.log.info(`Bibliograph harness execution complete...  Have a nice day!`)
		});
}

module.exports = ingest_DepartmentOfEducation_InstitutionData;
