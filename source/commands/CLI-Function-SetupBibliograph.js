const libBibliograph = require('../Bibliograph.js');

module.exports = function (fNext)
{
	this.fable.log.info(`Preparing the read command to run...`);
	this.fable.log.info(`...initializing Bibliograph...`);

	this.fable.addServiceType('Bibliograph', libBibliograph);
	this.fable.instantiateServiceProviderIfNotExists('Bibliograph');

	if (this.fable.ProgramConfiguration.hasOwnProperty('Bibliograph-Storage-FS-Path'))
	{
		this.fable.BibliographStorage.setStorageFolder(this.fable.ProgramConfiguration['Bibliograph-Storage-FS-Path']);
	}

	this.fable.Bibliograph.initialize(fNext);
};
