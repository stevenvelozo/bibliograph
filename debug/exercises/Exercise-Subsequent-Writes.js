const libPict = require('pict');
const libBibliograph = require('../../source/Bibliograph.js');

const libReadline = require('readline');
const libFS = require('fs');

const _Pict = new libPict(
	{
		Product: 'Bibliograph-Harness-Subsequent-Writes',
		LogStreams:
			[
				{
					loggertype:'simpleflatfile',
					outputloglinestoconsole: false,
					showtimestamps: true,
					formattedtimestamps: true,
					level:'trace',
					path: `${process.cwd()}/Bibliograph-Harness-SubWrites-${libPict.generateFileNameDateStamp()}.log`
				},
				{
					loggertype:'console',
					showtimestamps: true,
					formattedtimestamps: true,
					level: 'trace'
				}
			],
		"Bibliograph-Storage-FS-Path": `${__dirname}/../data/HarnessLib`
	});
_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
_Pict.instantiateServiceProvider('Bibliograph', {});

_Pict.settings.SourceName = 'SubsequentWrites';

let tmpAnticipate = _Pict.newAnticipate();

tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));

tmpAnticipate.anticipate(
	function (fNext)
	{
		_Pict.Bibliograph.createSource(_Pict.settings.SourceName, fNext);
	});

tmpAnticipate.anticipate(
	function (fWriteComplete)
	{
		_Pict.Bibliograph.write(_Pict.settings.SourceName, `OverwriteMe`, {Name:'Clarissa', Species:'SeaTurtle', Color:'Pink'}, fWriteComplete);
	}.bind(this));

tmpAnticipate.anticipate(
	function (fWriteComplete)
	{
		_Pict.Bibliograph.write(_Pict.settings.SourceName, `OverwriteMe`, {Name:'Clarissa', Species:'SeaTurtle', Color:'Green'}, fWriteComplete);
	}.bind(this));

tmpAnticipate.anticipate(
	function (fWriteComplete)
	{
		_Pict.Bibliograph.write(_Pict.settings.SourceName, `OverwriteMe`, {Name:'Clarissa', Species:'SeaTurtle', Color:'Beautiful'}, fWriteComplete);
	}.bind(this));

tmpAnticipate.wait(
	function(pError)
	{
		if (pError)
		{
			_Pict.log.error(`Error executing the Bibliograph Subsequent Write harness: ${pError}`, pError);
		}
		_Pict.log.info(`Bibliograph Subsequent Write harness execution complete...  Have a nice day!`)
	});
