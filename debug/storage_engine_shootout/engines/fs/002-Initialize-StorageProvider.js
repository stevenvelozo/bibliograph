function configure_FS_Storage_Provider(pPict, fNext)
{
	// The fs storage provider is built in, so we don't need to do anything.
	return fNext();
}

module.exports = configure_FS_Storage_Provider;