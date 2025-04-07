const libStorageProvider = require(`./Bibliograph-Storage-LMDB.js`);

function configure_LMDB_Storage_Provider(pPict, fNext)
{
	pPict.addServiceTypeIfNotExists('BibliographStorage', libStorageProvider);
	pPict.instantiateServiceProvider('BibliographStorage', pPict.settings);
	return fNext();
}

module.exports = configure_LMDB_Storage_Provider;