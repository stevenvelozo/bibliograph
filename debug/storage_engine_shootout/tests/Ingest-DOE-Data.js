
function ingest_DOE_Data(_ProviderDescription)
{
	const _001_Initialize_Pict = require(`${__dirname}/../../shared/001-Initialize-Pict.js`);
	const _002_Initialize_StorageProvider = require(`${__dirname}/../../engines/002-Initialize-StorageProvider.js`);
	const _003_Initialize_Bibliograph = require(`${__dirname}/../../shared/003-Initialize-Bibliograph.js`);
	const _004_Ingest_DOE_Data = require(`${__dirname}/../../shared/004-Ingest-DOE-Data.js`);

	const _Pict = _001_Initialize_Pict(_ProviderName);
}

module.exports = ingest_DOE_Data;