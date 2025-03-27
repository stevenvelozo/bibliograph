const libCLICommandLineCommand = require('pict-service-commandlineutility').ServiceCommandLineCommand;

class RecordWriteCommand extends libCLICommandLineCommand
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.options.CommandKeyword = 'record_write';
		this.options.Description = `Write a record by GUID.`;

		// This is a shorthand alias for the command.
		this.options.Aliases.push('write');
		this.options.Aliases.push('w');

		this.options.CommandOptions.push({ Name: '-s, --source [source_hash]', Description: 'Which source to use; default is Default but can be overridden by Bibliograph-Source in your config json.'});
		this.options.CommandOptions.push({ Name: '-i, --input [input_file]', Description: 'A file to read with record(s).'});
		this.options.CommandOptions.push({ Name: '-g, --guid [guid_template]', Description: 'A template expression for GUIDs.  The default when this is absent is the md5 of the record JSON.'});

		this.fable.instantiateServiceProviderIfNotExists('FilePersistence');

		this.addCommand();
	}

	queueRecordWrite(pAnticipate, pSourceHash, pRecordGUIDTemplate, pRecord)
	{
		let tmpRecordGUID = (pRecordGUIDTemplate) ? this.pict.parseTemplate(pRecordGUIDTemplate, pRecord)
													: this.fable.Bibliograph.recordHash(JSON.stringify(pRecord));

		pAnticipate.anticipate(
			function (fWriteComplete)
			{
				this.fable.Bibliograph.write(pSourceHash, tmpRecordGUID, pRecord, fWriteComplete);
			}.bind(this));
	}

	/**
	 * Write a record.
	 * 
	 * @param {function} fCallback
	 * @returns void
	 */
	writeRecord(fCallback)
	{
		let tmpRecordGUID = this.CommandOptions.hasOwnProperty('guid') ? this.CommandOptions.guid : false;
		let tmpSourceHash = this.CommandOptions.hasOwnProperty('source') ? this.CommandOptions.source
							: this.fable.ProgramConfiguration.hasOwnProperty('Bibliograph-Source') ? this.fable.ProgramConfiguration['Bibliograph-Source']
							: 'Default';

		let tmpInputFile = this.CommandOptions.hasOwnProperty('input') ? this.CommandOptions.input : false;
		if (!tmpInputFile)
		{
			this.fable.log.error(`The input file was not specified; please use the -i or --input option.`);
			return fCallback(new Error(`The input file was not specified; please use the -i or --input option.`));
		}
		let tmpInputFilePath = this.fable.FilePersistence.joinPath(tmpInputFile);
		let tmpInputFileExists = this.fable.FilePersistence.existsSync(tmpInputFilePath);

		if (!tmpInputFileExists)
		{
			this.fable.log.error(`The input file [${tmpInputFilePath}] does not exist from input parameter [${tmpInputFile}]; please check the path and try again.`);
			return fCallback(new Error(`The input file [${tmpInputFilePath}] does not exist; please check the path.`));
		}

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(require('./CLI-Function-SetupBibliograph.js').bind(this));

		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.fable.FilePersistence.readFile(tmpInputFilePath, 'utf8',
					function(pError, pData)
					{
						if (pError)
						{
							this.fable.log.error(`Error reading input file [${tmpInputFilePath}]: ${pError}`, pError);
							return fNext(pError);
						}
						if (typeof(pData) === 'undefined')
						{
							this.fable.log.error(`Failed to read input file [${tmpInputFilePath}]: File not found or empty.`);
							return fNext(new Error(`Failed to read input file [${tmpInputFilePath}]: File not found or empty.`));
						}
						if (pData.length === 0)
						{
							this.fable.log.error(`Failed to read input file [${tmpInputFilePath}]: File is empty.`);
							return fNext(new Error(`Failed to read input file [${tmpInputFilePath}]: File is empty.`));
						}
						try
						{
							let tmpData = JSON.parse(pData);

							if (Array.isArray(tmpData))
							{
								for (let i = 0; i < tmpData.length; i++)
								{
									this.queueRecordWrite(tmpAnticipate, tmpSourceHash, tmpRecordGUID, tmpData[i]);
								}
							}
							else if (typeof(tmpData) === 'object')
							{
								this.queueRecordWrite(tmpAnticipate, tmpSourceHash, tmpRecordGUID, tmpData);
							}
							else
							{
								this.fable.log.error(`Failed to read input file [${tmpInputFilePath}]: Could not marshal file to either of an Array or Object.`);
								return fNext(new Error(`Failed to read input file [${tmpInputFilePath}]: Could not marshal file to either of an Array or Object.`));
							}
							return fNext();
						}
						catch (pParseError)
						{
							this.fable.log.error(`Error parsing input file [${tmpInputFilePath}]: ${pParseError}`, pParseError);
							return fNext(pParseError);
						}
					}.bind(this));
			}.bind(this));

		tmpAnticipate.wait(
			function (pError)
			{
				if (pError)
				{
					this.fable.log.error(`Execution error running the write command: ${pError}`, pError);
					return fCallback(pError);
				}

				this.fable.log.info(`...write command completed.`);
				this.fable.log.info(`Have a nice day!`);

				return fCallback(pError);
			}.bind(this));
	}

	/**
	 * The overloaded command function from the `pict-service-commandlineutility` class.
	 * 
	 * @param {function} fCallback 
	 * @returns void
	 */
	onRunAsync(fCallback)
	{
		return this.writeRecord(fCallback);
	}
}

module.exports = RecordWriteCommand;
