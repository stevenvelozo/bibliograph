const libPict = require('pict');

function initialize_Pict(pProviderName)
{
	let tmpProviderName = (typeof pProviderName === 'string') ? pProviderName : 'Bibliograph-Storage-Unknown';
	return new libPict(
		{
			Product: `Bibliograph-Speedtest-${tmpProviderName}`,
			LogStreams:
				[
					{
						loggertype:'simpleflatfile',
						outputloglinestoconsole: false,
						showtimestamps: true,
						formattedtimestamps: true,
						level:'trace',
						path: `${process.cwd()}/Bibliograph-Shootout-Run.log`
					}
					// ,{
					// 	loggertype:'console',
					// 	showtimestamps: true,
					// 	formattedtimestamps: true,
					// 	level: 'trace'
					// }
				],
			// FS Storage Settings
			"Bibliograph-Storage-FS-Path": `${process.cwd()}/data/HarnessLib`
		});
}