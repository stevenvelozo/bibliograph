/**
* Unit tests for Bibliograph - Source Management Operations
*
* Covers: source creation, idempotent creation, source existence checks,
* multiple sources, and input validation.
*
* @author      Steven Velozo <steven@velozo.com>
*/

const libPict = require('pict');
const libBibliograph = require('../source/Bibliograph.js');

const libFS = require('fs');

const Chai = require("chai");
const Expect = Chai.expect;

const _STORAGE_FOLDER = `${__dirname}/../debug/data/TestStorage-Sources`;

suite
(
	'Bibliograph',
	() =>
	{
		setup
		(
			() =>
			{
				try { libFS.rmSync(_STORAGE_FOLDER, { recursive: true }); }
				catch (pError) { }
			}
		);
		suiteTeardown
		(
			() =>
			{
				try { libFS.rmSync(_STORAGE_FOLDER, { recursive: true }); }
				catch (pError) { }
			}
		);

		suite
		(
			'Source Management',
			() =>
			{
				test
				(
					'create a source and verify it exists',
					(fNext) =>
					{
						let _Pict = new libPict({ "Bibliograph-Storage-FS-Path": _STORAGE_FOLDER });
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpAnticipate = _Pict.newAnticipate();

						tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));

						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.createSource('NewSource',
									function (pError)
									{
										Expect(pError).to.not.be.an.instanceOf(Error);
										fCallback(pError);
									});
							});

						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.checkSourceExists('NewSource',
									function (pError, pExists)
									{
										Expect(pExists).to.equal(true, 'Source should exist after creation.');
										fCallback(pError);
									});
							});

						tmpAnticipate.wait(fNext);
					}
				);

				test
				(
					'creating a source that already exists is idempotent',
					(fNext) =>
					{
						let _Pict = new libPict({ "Bibliograph-Storage-FS-Path": _STORAGE_FOLDER });
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpAnticipate = _Pict.newAnticipate();

						tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));

						// Create the source twice
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.createSource('IdempotentSource', fCallback);
							});

						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.createSource('IdempotentSource',
									function (pError)
									{
										Expect(pError).to.not.be.an.instanceOf(Error, 'Creating an existing source should not error.');
										fCallback(pError);
									});
							});

						// Third time for good measure
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.createSource('IdempotentSource',
									function (pError)
									{
										Expect(pError).to.not.be.an.instanceOf(Error);
										fCallback(pError);
									});
							});

						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.checkSourceExists('IdempotentSource',
									function (pError, pExists)
									{
										Expect(pExists).to.equal(true, 'Source should still exist after idempotent creates.');
										fCallback(pError);
									});
							});

						tmpAnticipate.wait(fNext);
					}
				);

				test
				(
					'non-existent source returns false for checkSourceExists',
					(fNext) =>
					{
						let _Pict = new libPict({ "Bibliograph-Storage-FS-Path": _STORAGE_FOLDER });
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpAnticipate = _Pict.newAnticipate();

						tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));

						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.checkSourceExists('DefinitelyDoesNotExist',
									function (pError, pExists)
									{
										Expect(pExists).to.equal(false, 'Non-existent source should return false.');
										fCallback(pError);
									});
							});

						tmpAnticipate.wait(fNext);
					}
				);

				test
				(
					'multiple sources coexist independently',
					(fNext) =>
					{
						let _Pict = new libPict({ "Bibliograph-Storage-FS-Path": _STORAGE_FOLDER });
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpAnticipate = _Pict.newAnticipate();

						tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));

						// Create multiple sources
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.createSource('SourceAlpha', fCallback);
							});
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.createSource('SourceBeta', fCallback);
							});
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.createSource('SourceGamma', fCallback);
							});

						// Write records to different sources
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.write('SourceAlpha', 'rec-001',
									{ Name: 'Alpha Record' }, fCallback);
							});
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.write('SourceBeta', 'rec-001',
									{ Name: 'Beta Record' }, fCallback);
							});

						// Same GUID in different sources should return different data
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.read('SourceAlpha', 'rec-001',
									function (pError, pRecord)
									{
										Expect(pRecord.Name).to.equal('Alpha Record');
										fCallback(pError);
									});
							});
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.read('SourceBeta', 'rec-001',
									function (pError, pRecord)
									{
										Expect(pRecord.Name).to.equal('Beta Record');
										fCallback(pError);
									});
							});

						// Gamma should have no records
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.readRecordKeys('SourceGamma',
									function (pError, pKeys)
									{
										Expect(pKeys).to.be.an('array');
										Expect(pKeys.length).to.equal(0, 'Empty source should have no keys.');
										fCallback(pError);
									});
							});

						// Verify all three sources exist
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.checkSourceExists('SourceAlpha',
									function (pError, pExists)
									{
										Expect(pExists).to.equal(true);
										fCallback(pError);
									});
							});
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.checkSourceExists('SourceBeta',
									function (pError, pExists)
									{
										Expect(pExists).to.equal(true);
										fCallback(pError);
									});
							});
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.checkSourceExists('SourceGamma',
									function (pError, pExists)
									{
										Expect(pExists).to.equal(true);
										fCallback(pError);
									});
							});

						tmpAnticipate.wait(fNext);
					}
				);

				test
				(
					'source creates the expected folder structure',
					(fNext) =>
					{
						let _Pict = new libPict({ "Bibliograph-Storage-FS-Path": _STORAGE_FOLDER });
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpAnticipate = _Pict.newAnticipate();

						tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));

						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.createSource('FolderCheck', fCallback);
							});

						tmpAnticipate.anticipate(
							function (fCallback)
							{
								let tmpSourcePath = `${_STORAGE_FOLDER}/FolderCheck`;
								Expect(libFS.existsSync(tmpSourcePath)).to.equal(true, 'Source folder should exist.');
								Expect(libFS.existsSync(`${tmpSourcePath}/metadata`)).to.equal(true, 'metadata subfolder should exist.');
								Expect(libFS.existsSync(`${tmpSourcePath}/record`)).to.equal(true, 'record subfolder should exist.');
								Expect(libFS.existsSync(`${tmpSourcePath}/history`)).to.equal(true, 'history subfolder should exist.');
								fCallback();
							});

						tmpAnticipate.wait(fNext);
					}
				);

				test
				(
					'createSource rejects empty source hash',
					(fNext) =>
					{
						let _Pict = new libPict({ "Bibliograph-Storage-FS-Path": _STORAGE_FOLDER });
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpAnticipate = _Pict.newAnticipate();
						tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.createSource('',
									function (pError)
									{
										Expect(pError).to.be.an.instanceOf(Error);
										Expect(pError.message).to.contain('source hash');
										fCallback();
									});
							});
						tmpAnticipate.wait(fNext);
					}
				);

				test
				(
					'checkSourceExists rejects empty source hash',
					(fNext) =>
					{
						let _Pict = new libPict({ "Bibliograph-Storage-FS-Path": _STORAGE_FOLDER });
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpAnticipate = _Pict.newAnticipate();
						tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));
						tmpAnticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.checkSourceExists('',
									function (pError, pExists)
									{
										Expect(pError).to.be.an.instanceOf(Error);
										Expect(pError.message).to.contain('source hash');
										fCallback();
									});
							});
						tmpAnticipate.wait(fNext);
					}
				);
			}
		);
	}
);
