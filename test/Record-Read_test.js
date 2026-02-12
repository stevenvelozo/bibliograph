/**
* Unit tests for Bibliograph - Record Read Operations
*
* Covers: basic read, reading non-existent records, reading after updates,
* reading after deletion, reading multiple records, and input validation.
*
* @author      Steven Velozo <steven@velozo.com>
*/

const libPict = require('pict');
const libBibliograph = require('../source/Bibliograph.js');

const libFS = require('fs');

const Chai = require("chai");
const Expect = Chai.expect;

const _STORAGE_FOLDER = `${__dirname}/../debug/data/TestStorage-Read`;
const _SOURCE = 'ReadTests';

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
			'Record Read',
			() =>
			{
				test
				(
					'read a record that was written',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'read-001',
										{ Name: 'Barry', Age: 39, Occupation: 'Engineer' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'read-001',
										function (pError, pRecord)
										{
											Expect(pRecord).to.be.an('object');
											Expect(pRecord.Name).to.equal('Barry');
											Expect(pRecord.Age).to.equal(39);
											Expect(pRecord.Occupation).to.equal('Engineer');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'read returns undefined for a record that was never created',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.read(_SOURCE, 'does-not-exist',
								function (pError, pRecord)
								{
									Expect(pRecord).to.be.undefined;
									Expect(pError).to.not.be.an.instanceOf(Error, 'Reading a non-existent record is not an error.');
									fNext();
								});
						});
					}
				);

				test
				(
					'read returns merged result after partial update',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'partial-read-001',
										{ Name: 'Alice', Age: 41, City: 'Portland' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'partial-read-001',
										{ Age: 870 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'partial-read-001',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Alice', 'Name should be preserved.');
											Expect(pRecord.Age).to.equal(870, 'Age should reflect the update.');
											Expect(pRecord.City).to.equal('Portland', 'City should be preserved.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'read returns undefined after record is deleted',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'delete-read-001',
										{ Name: 'Ephemeral' },
										fCallback);
								});

							// Verify it exists
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'delete-read-001',
										function (pError, pRecord)
										{
											Expect(pRecord).to.be.an('object');
											Expect(pRecord.Name).to.equal('Ephemeral');
											fCallback(pError);
										});
								});

							// Delete it
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.delete(_SOURCE, 'delete-read-001', fCallback);
								});

							// Read should now return undefined
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'delete-read-001',
										function (pError, pRecord)
										{
											Expect(pRecord).to.be.undefined;
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'read multiple distinct records from the same source',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'multi-A', { Name: 'Alice' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'multi-B', { Name: 'Barry' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'multi-C', { Name: 'Cassandra' }, fCallback);
								});

							// Read each one independently
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'multi-A',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Alice');
											fCallback(pError);
										});
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'multi-B',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Barry');
											fCallback(pError);
										});
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'multi-C',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Cassandra');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'read reflects the latest value after multiple overwrites',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'multi-write-001',
										{ Value: 'first' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'multi-write-001',
										{ Value: 'second' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'multi-write-001',
										{ Value: 'third' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'multi-write-001',
										{ Value: 'final' }, fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'multi-write-001',
										function (pError, pRecord)
										{
											Expect(pRecord.Value).to.equal('final', 'Should reflect the last write.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'read rejects empty source hash',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.read('', 'rec-001',
								function (pError, pRecord)
								{
									Expect(pError).to.be.an.instanceOf(Error);
									Expect(pError.message).to.contain('source hash');
									fNext();
								});
						});
					}
				);

				test
				(
					'read rejects empty record GUID',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.read(_SOURCE, '',
								function (pError, pRecord)
								{
									Expect(pError).to.be.an.instanceOf(Error);
									Expect(pError.message).to.contain('record GUID');
									fNext();
								});
						});
					}
				);
			}
		);
	}
);
