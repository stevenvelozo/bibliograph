const libCLICommandLineCommand = require('pict-service-commandlineutility').ServiceCommandLineCommand;

class RecordDeleteCommand extends libCLICommandLineCommand
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.options.CommandKeyword = 'record_delete';
		this.options.Description = `Delete a record by GUID.`;

		// This is a shorthand alias for the command.
		this.options.Aliases.push('delete');
		this.options.Aliases.push('d');

		this.options.CommandArguments.push({ Name: '<record_guid>', Description: `The GUID of the record to delete.` });

		this.options.CommandOptions.push({ Name: '-s, --source [source_hash]', Description: 'Which source to use; default is Default but can be overridden by Bibliograph-Source in your config json.'});

		this.fable.instantiateServiceProviderIfNotExists('FilePersistence');

		this.addCommand();
	}

	/**
	 * Delete a record.
	 * 
	 * @param {function} fCallback - a Callback function to call when the command is complete
	 * @returns void
	 */
	deleteRecord(fCallback)
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
				this.fable.Bibliograph.delete(tmpSourceHash, tmpRecordGUID,
					function(pError)
					{
						if (pError)
						{
							this.fable.log.error(`Error deleteing record [${tmpSourceHash}]:[${tmpRecordGUID}]: ${pError}`, pError);
							return fNext(pError);
						}
						return fNext(pError);
					}.bind(this));
			}.bind(this));

		tmpAnticipate.wait(
			(pError) =>
			{
				if (pError)
				{
					this.fable.log.error(`Execution error running the delete command: ${pError}`, pError);
					return fCallback(pError);
				}
				this.fable.log.info(`...record [${tmpRecordGUID}] delete completed.`);
				return fCallback();
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
		return this.deleteRecord(fCallback);
	}
}

module.exports = RecordDeleteCommand;
