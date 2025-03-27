const libCLICommandLineCommand = require('pict-service-commandlineutility').ServiceCommandLineCommand;

class RecordReadCommand extends libCLICommandLineCommand
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.options.CommandKeyword = 'record_read';
		this.options.Description = `Read a record by GUID.`;

		// This is a shorthand alias for the command.
		this.options.Aliases.push('read');
		this.options.Aliases.push('r');

		this.options.CommandArguments.push({ Name: '<record_guid>', Description: `The GUID of the record to read.` });

		this.options.CommandOptions.push({ Name: '-s, --source [source_hash]', Description: 'Which source to use; default is Default but can be overridden by Bibliograph-Source in your config json.'});
		this.options.CommandOptions.push({ Name: '-o, --output [output_file]', Description: 'A file to output to.'});

		this.fable.instantiateServiceProviderIfNotExists('FilePersistence');

		this.addCommand();
	}

	/**
	 * Read a record.
	 * 
	 * @param {function} fCallback
	 * 
	 * @returns void
	 */
	readRecord(fCallback)
	{
		let tmpRecordGUID = this.ArgumentString;
		let tmpSourceHash = this.CommandOptions.hasOwnProperty('source') ? this.CommandOptions.source
							: this.fable.ProgramConfiguration.hasOwnProperty('Bibliograph-Source') ? this.fable.ProgramConfiguration['Bibliograph-Source']
							: 'Default';

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(require('./CLI-Function-SetupBibliograph.js').bind(this));

		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.fable.Bibliograph.read(tmpSourceHash, tmpRecordGUID,
					function(pError, pRecord)
					{
						if (pError)
						{
							this.fable.log.error(`Error reading record [${tmpSourceHash}]:[${tmpRecordGUID}]: ${pError}`, pError);
							return fNext(pError);
						}
						if (typeof(pRecord) === 'undefined')
						{
							this.fable.log.info(`Failed to read record [${tmpSourceHash}]:[${tmpRecordGUID}]: Record not found.`);
							return fNext();
						}
						console.log(JSON.stringify(pRecord, null, 4));
						if (this.CommandOptions.hasOwnProperty('output'))
						{
							const tmpOutputFilePath = this.fable.FilePersistence.joinPath(this.CommandOptions.output);
							try
							{
								this.fable.log.info(`Writing record [${tmpSourceHash}]:[${tmpRecordGUID}] to file [${tmpOutputFilePath}]...`);
								this.fable.FilePersistence.writeFileSync(tmpOutputFilePath, JSON.stringify(pRecord))
							}
							catch (pWriteError)
							{
								this.fable.log.error(`Error writing record [${tmpSourceHash}]:[${tmpRecordGUID}] to file [${tmpOutputFilePath}]: ${pWriteError}`, pWriteError);
								return fNext(pWriteError);
							}
						}
						return fNext(pError);
					}.bind(this));
			}.bind(this));

		tmpAnticipate.wait(
			(pError) =>
			{
				if (pError)
				{
					this.fable.log.error(`Execution error running the read command: ${pError}`, pError);
					return fCallback(pError);
				}
				return fCallback(pError);
			});
	}

	/**
	 * The overloaded command function from the `pict-service-commandlineutility` class.
	 * 
	 * @param {function} fCallback 
	 * @returns void
	 */
	onRunAsync(fCallback)
	{
		return this.readRecord(fCallback);
	}
}

module.exports = RecordReadCommand;
