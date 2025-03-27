const libCLIProgram = require('pict-service-commandlineutility');
const _PackageJSON = require('../package.json');

/**
 * This object is the `pict` and `fable` settings for the program.
 * 
 * The object is exposed in commands as the `this.fable.settings` object.
 */
const _ProgramPictSettings = (
	{
		Product: 'Bibliograph-CLI',
		Description: 'Run an operation against a bibliograph store.',

		// This is the command that will be used to run the program from the command line.
		// Not necessary but nice to have inside the different commands.
		Command: 'bibliograph',
		Version: _PackageJSON.version,

		// This is the `fable-log` logstreams configuration.
		LogStreams:
			[
				/* Uncomment this stanza to log to a new file each time a command is run *
				{
					loggertype:'simpleflatfile',
					outputloglinestoconsole: false,
					showtimestamps: true,
					formattedtimestamps: true,
					level:'trace',
					path: `${process.cwd()}/Bibliograph-CLI-Run-${libCLIProgram.generateFileNameDateStamp()}.log`
				},
				/* */

				/* Uncomment this stanza to log to a unified file each time a command is run */
				{
					loggertype:'simpleflatfile',
					outputloglinestoconsole: false,
					showtimestamps: true,
					formattedtimestamps: true,
					level:'trace',
					path: `${process.cwd()}/Bibliograph-CLI-Run-Unified.log`
				},
				/* */

				{
					loggertype:'console',
					showtimestamps: true,
					formattedtimestamps: true,
					level: 'trace'
				}
			],

		ProgramConfigurationFileName: '.bibliograph.config.json',
		AutoAddConfigurationExplanationCommand: true,
		AutoGatherProgramConfiguration: true,

		DefaultProgramOptions:
			{
			},

		// This is exposed for convenience to the developer.
		PackageJSON: _PackageJSON
	});

let _Program = new libCLIProgram(_ProgramPictSettings,
	[
		require('./commands/CLI-Command-Bibliograph-Read.js'),
		require('./commands/CLI-Command-Bibliograph-Write.js'),
		require('./commands/CLI-Command-Bibliograph-Delete.js'),
		require('./commands/CLI-Command-Bibliograph-SourceCreate.js'),
		require('./commands/CLI-Command-Bibliograph-SourceCheck.js')
	]);

module.exports = _Program;