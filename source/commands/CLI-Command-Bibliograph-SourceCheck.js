const libCLICommandLineCommand = require('pict-service-commandlineutility').ServiceCommandLineCommand;

const libBibliograph = require('../Bibliograph.js');

class SourceCheckCommand extends libCLICommandLineCommand
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.options.CommandKeyword = 'source_check';
		this.options.Description = `Check if a source exists.`;

		// This is a shorthand alias for the command.
		this.options.Aliases.push('sch');

		this.options.CommandArguments.push({ Name: '<source_hash>', Description: `The hash of the source to check.` });

		this.addCommand();
	}

	/**
	 * Check the Source
	 * 
	 * @param {function} fCallback
	 * 
	 * @returns void
	 */
	checkSource(fCallback)
	{
		let tmpSourceHash = this.ArgumentString;

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			(fNext) =>
			{
				this.fable.log.info(`Preparing the command to run...`);
				this.fable.log.info(`...initializing Bibliograph...`);

				this.fable.addServiceType('Bibliograph', libBibliograph);
				this.fable.instantiateServiceProviderIfNotExists('Bibliograph');

				this.fable.Bibliograph.initialize(fNext);
			});

		tmpAnticipate.anticipate(
			(fNext) =>
			{
				try
				{
					this.fable.log.info(`Checking source [${this.ArgumentString}]...`);
					return fNext();
				}
				catch(pError)
				{
					this.fable.log.error(`Error checking the source: ${pError}`, pError);
					return fNext(pError);
				}
			});
		
		tmpAnticipate.anticipate(
			function (fNext)
			{
				this.fable.Bibliograph.checkSourceExists(tmpSourceHash,
					function(pError, pExists)
					{
						if (pError)
						{
							this.fable.log.error(`Error checking the source's existence: ${pError}`, pError);
							return fNext(pError);
						}
						if (pExists)
						{
							this.fable.log.info(`Source [${tmpSourceHash}] exists.`);
						}
						else
						{
							this.fable.log.info(`Source [${tmpSourceHash}] does not exist.`);
						}
						return fNext(pError);
					}.bind(this));
			}.bind(this));

		tmpAnticipate.wait(
			(pError) =>
			{
				if (pError)
				{
					this.fable.log.error(`Execution error running the command: ${pError}`, pError);
					return fCallback(pError);
				}
				this.fable.log.info(`...source [${tmpSourceHash}] check completed.`);
				this.fable.log.info(`Have a nice day!`);
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
		return this.checkSource(fCallback);
	}
}

module.exports = SourceCheckCommand;
