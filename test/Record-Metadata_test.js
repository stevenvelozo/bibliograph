/**
* Unit tests for Bibliograph - Record Metadata Operations
*
* Covers: metadata generation, hash values, metadata changes on update,
* deduplication comparison, hash generation, and the recordHash utility.
*
* @author      Steven Velozo <steven@velozo.com>
*/

const libPict = require('pict');
const libBibliograph = require('../source/Bibliograph.js');

const libFS = require('fs');

const Chai = require("chai");
const Expect = Chai.expect;

const _STORAGE_FOLDER = `${__dirname}/../debug/data/TestStorage-Metadata`;
const _SOURCE = 'MetadataTests';

function createBibliograph(fCallback)
{
	let _Pict = new libPict({ "Bibliograph-Storage-FS-Path": _STORAGE_FOLDER });
	_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
	_Pict.instantiateServiceProvider('Bibliograph', {});

	let tmpAnticipate = _Pict.newAnticipate();
	tmpAnticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.Bibliograph));
	tmpAnticipate.anticipate(
		function (fNext)
		{
			_Pict.Bibliograph.createSource(_SOURCE, fNext);
		});
	tmpAnticipate.wait(
		function (pError)
		{
			fCallback(pError, _Pict);
		});
}

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
			'Record Metadata',
			() =>
			{
				test
				(
					'metadata is generated on first write with correct structure',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'meta-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'meta-001',
										function (pError, pMetadata)
										{
											Expect(pMetadata).to.be.an('object', 'Metadata should be an object.');
											Expect(pMetadata.GUID).to.equal('meta-001', 'GUID should match the record GUID.');
											Expect(pMetadata.Length).to.be.a('number', 'Length should be a number.');
											Expect(pMetadata.Length).to.be.greaterThan(0, 'Length should be positive.');
											Expect(pMetadata.QHash).to.be.a('string', 'QHash should be a string.');
											Expect(pMetadata.QHash).to.match(/^HSH-/, 'QHash should start with HSH-.');
											Expect(pMetadata.MD5).to.be.a('string', 'MD5 should be a string.');
											Expect(pMetadata.MD5.length).to.equal(32, 'MD5 should be 32 characters.');
											Expect(pMetadata.Ingest).to.be.a('number', 'Ingest should be a timestamp number.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'metadata has known hash values for known record content',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							// Use the exact same record from the original unit tests
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'known-hash-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'known-hash-001',
										function (pError, pMetadata)
										{
											// These values come from the original Bibliograph_tests.js
											Expect(pMetadata.MD5).to.equal('461d65fea865254459a3c57f2f554ccf', 'MD5 should match known value for {Name:"Alice",Age:41}.');
											Expect(pMetadata.Length).to.equal(25, 'Length should be 25 characters.');
											Expect(pMetadata.QHash).to.equal('HSH-1024085287', 'QHash should match known value.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'metadata changes when record content changes',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpOriginalMetadata = false;

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'change-meta-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'change-meta-001',
										function (pError, pMetadata)
										{
											tmpOriginalMetadata = JSON.parse(JSON.stringify(pMetadata));
											fCallback(pError);
										});
								});

							// Update the record
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'change-meta-001',
										{ Age: 870 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'change-meta-001',
										function (pError, pMetadata)
										{
											Expect(pMetadata.GUID).to.equal(tmpOriginalMetadata.GUID, 'GUID should not change.');
											Expect(pMetadata.MD5).to.not.equal(tmpOriginalMetadata.MD5, 'MD5 should change when content changes.');
											Expect(pMetadata.QHash).to.not.equal(tmpOriginalMetadata.QHash, 'QHash should change when content changes.');
											// Length may or may not change depending on content
											Expect(pMetadata.Ingest).to.be.at.least(tmpOriginalMetadata.Ingest, 'Ingest should be updated.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'metadata has updated hash values after age change',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'age-change-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'age-change-001',
										{ Age: 870 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'age-change-001',
										function (pError, pMetadata)
										{
											// These values come from the original Bibliograph_tests.js after Age -> 870
											Expect(pMetadata.MD5).to.equal('e67ddd09559f12dc1740bfb11212b3bf');
											Expect(pMetadata.Length).to.equal(26);
											Expect(pMetadata.QHash).to.equal('HSH-1681750157');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'metadata does not change on identical write',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpOriginalMetadata = false;

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'no-change-meta-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'no-change-meta-001',
										function (pError, pMetadata)
										{
											tmpOriginalMetadata = JSON.parse(JSON.stringify(pMetadata));
											fCallback(pError);
										});
								});

							// Write same data again
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'no-change-meta-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'no-change-meta-001',
										function (pError, pMetadata)
										{
											Expect(pMetadata.MD5).to.equal(tmpOriginalMetadata.MD5, 'MD5 should not change.');
											Expect(pMetadata.QHash).to.equal(tmpOriginalMetadata.QHash, 'QHash should not change.');
											Expect(pMetadata.Length).to.equal(tmpOriginalMetadata.Length, 'Length should not change.');
											Expect(pMetadata.Ingest).to.equal(tmpOriginalMetadata.Ingest, 'Ingest should not change on skipped write.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'recordHash generates consistent MD5 hashes',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpHash1 = _Pict.Bibliograph.recordHash('test string');
							let tmpHash2 = _Pict.Bibliograph.recordHash('test string');
							let tmpHash3 = _Pict.Bibliograph.recordHash('different string');

							Expect(tmpHash1).to.equal(tmpHash2, 'Same input should produce same hash.');
							Expect(tmpHash1).to.not.equal(tmpHash3, 'Different input should produce different hash.');
							Expect(tmpHash1.length).to.equal(32, 'MD5 hash should be 32 characters.');
							fNext();
						});
					}
				);

				test
				(
					'recordHash of serialized record matches metadata MD5',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpRecord = { Name: 'Alice', Age: 41 };
							let tmpExpectedMD5 = _Pict.Bibliograph.recordHash(JSON.stringify(tmpRecord));

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'hash-match-001', tmpRecord, fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'hash-match-001',
										function (pError, pMetadata)
										{
											Expect(pMetadata.MD5).to.equal(tmpExpectedMD5, 'Metadata MD5 should match recordHash of the serialized record.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);
			}
		);
	}
);
