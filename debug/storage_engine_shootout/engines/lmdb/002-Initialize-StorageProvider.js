const libStorageProvider = require(`./Bibliograph-Storage-LMDB.js`);

function configure_LMDB_Storage_Provider(pPict)
{
	pPict.addServiceTypeIfNotExists('BibliographStorage', libStorageProvider);
	pPict.instantiateServiceProvider('BibliographStorage', pPict.settings);
	return true;
}

module.exports = configure_LMDB_Storage_Provider;