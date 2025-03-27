/* */
const libPict = require('pict');
const libBibliograph = require('../source/Bibliograph.js');

const libReadline = require('readline');
const libFS = require('fs');

const _Pict = new libPict(
	{
		Product: 'Bibliograph-Harness-Integration',

		// This is the `fable-log` logstreams configuration.
		LogStreams:
			[
				// Uncomment this stanza to log to a new file each time the harness is run
				{
					loggertype:'simpleflatfile',
					outputloglinestoconsole: false,
					showtimestamps: true,
					formattedtimestamps: true,
					level:'trace',
					path: `${process.cwd()}/Bibliograph-Harness-Run-${libPict.generateFileNameDateStamp()}.log`
				},
				{
					loggertype:'console',
					showtimestamps: true,
					formattedtimestamps: true,
					level: 'trace'
				}
			],

		"Bibliograph-Storage-FS-Path": `${__dirname}/data/HarnessLib`
	});
_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
_Pict.instantiateServiceProvider('Bibliograph', {});

_Pict.settings.SourceName = 'RawDOECollegeData-2025';
_Pict.settings.InputFileName = 'Most-Recent-Cohorts-Institution.csv';
_Pict.settings.InputFilePath = `${__dirname}/input/${_Pict.settings.InputFileName}`;

let tmpAnticipate = _Pict.newAnticipate();

tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));

tmpAnticipate.anticipate(
	function (fNext)
	{
		_Pict.Bibliograph.createSource(_Pict.settings.SourceName, fNext);
	});

tmpAnticipate.anticipate(
	function (fNext)
	{
		let tmpCSVFilePath = _Pict.settings.InputFilePath;
		let tmpCSVExists = libFS.existsSync(tmpCSVFilePath);

		let tmpCSVParser = _Pict.instantiateServiceProvider('CSVParser');

		// This is a fun way to stream the CSV file into the Bibliograph service
		let tmpImportAnticipate = _Pict.newAnticipate();

		if (!tmpCSVExists)
		{
			console.log(`The CSV [${tmpCSVFilePath}] does not exist; please decompress the zipped file in the input folder.`);
			return fNext(new Error(`The CSV [${tmpCSVFilePath}] does not exist; please decompress the zipped file in the input folder.`));
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
							_Pict.log.trace(`Writing record GUID [${tmpRecordGUID}] ${tmpRecord.INSTNM} to the Bibliograph service...`);
							_Pict.Bibliograph.write(_Pict.settings.SourceName, tmpRecordGUID, tmpRecord, fWriteComplete);
						}.bind(this));
				}
			}.bind(this));

		tmpReadline.on('close',
			function ()
			{
				_Pict.log.trace(`Readline closed for ${tmpCSVFilePath}; awaiting write completion...`);
				tmpImportAnticipate.wait(fNext);
			}.bind(this));
	}.bind(this));

tmpAnticipate.wait(
	function(pError)
	{
		if (pError)
		{
			_Pict.log.error(`Error executing the Bibliograph harness: ${pError}`, pError);
		}
		_Pict.log.info(`Bibliograph harness execution complete...  Have a nice day!`)
	});
/* */

//////////////////////////////////////////////////////////////////////////////
//  _______  _       _________
// (  ____ \( \      \__   __/
// | (    \/| (         ) (   
// | |      | |         | |   
// | |      | |         | |   
// | |      | |         | |   
// | (____/\| (____/\___) (___
// (_______/(_______/\_______/ CLI cli ...
//
// Comment out the above and uncomment below to exercise the CLI interface.
// But.  Only exercise one at a time!  CLI doesn't allow multiple operations!
//////////////////////////////////////////////////////////////////////////////

/*
// Load the cli program class directly rather than exercising the wrapping "run" script
let libCLIService = require('../source/CLI-Program-Bibliograph.js');
// Execute the CLI program with the provided arguments array
libCLIService.run(['node', 'Harness.js', 'source_create', 'HarnessCLI']);
//libCLIService.run(['node', 'Harness.js', 'source_check', 'HarnessCLI']);
/* */

