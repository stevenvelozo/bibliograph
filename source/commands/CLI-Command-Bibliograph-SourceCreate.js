const libCLICommandLineCommand = require('pict-service-commandlineutility').ServiceCommandLineCommand;

const libBibliograph = require('../Bibliograph.js');

class PushComprehensionsViaIntegration extends libCLICommandLineCommand
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.options.CommandKeyword = 'source_create';
		this.options.Description = `Create a Source if one doesn't exist with this hash.`;

		// This is a shorthand alias for the command.
		this.options.Aliases.push('sc');
		this.options.Aliases.push('scr');

		this.options.CommandArguments.push({ Name: '<source_hash>', Description: `The hash of the source to create.` });

		this.addCommand();
	}

	/**
	 * Create the Source if it doesn't exist.
	 * 
	 * @param {function} fCallback
	 * 
	 * @returns void
	 */
	createSource(fCallback)
	{
		let tmpSourceHash = this.ArgumentString;

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			(fCallback) =>
			{
				this.fable.log.info(`Preparing the command to run...`);
				this.fable.log.info(`...initializing Bibliograph...`);

				this.fable.addServiceType('Bibliograph', libBibliograph);
				this.fable.instantiateServiceProviderIfNotExists('Bibliograph');

				this.fable.Bibliograph.initialize(fCallback);
			});

		tmpAnticipate.anticipate(
			(fCallback) =>
			{
				try
				{
					this.fable.log.info(`Creating source [${this.ArgumentString}]...`);
					this.fable.Bibliograph.createSource(tmpSourceHash, fCallback);
				}
				catch(pError)
				{
					this.fable.log.error(`Error creating the source: ${pError}`, pError);
					return fCallback(pError);
				}
			});

		tmpAnticipate.wait(
			(pError) =>
			{
				if (pError)
				{
					this.fable.log.error(`Execution error running the command: ${pError}`, pError);
					return fCallback(pError);
				}
				this.fable.log.info(`...source [${tmpSourceHash}] create completed.`);
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
		return this.createSource(fCallback);
	}
}

module.exports = PushComprehensionsViaIntegration;
