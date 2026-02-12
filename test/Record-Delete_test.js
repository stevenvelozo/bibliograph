/**
* Unit tests for Bibliograph - Record Delete Operations
*
* Covers: basic delete, delete metadata marking, delete non-existent records,
* effects on exists/read/keys, and input validation.
*
* @author      Steven Velozo <steven@velozo.com>
*/

const libPict = require('pict');
const libBibliograph = require('../source/Bibliograph.js');

const libFS = require('fs');

const Chai = require("chai");
const Expect = Chai.expect;

const _STORAGE_FOLDER = `${__dirname}/../debug/data/TestStorage-Delete`;
const _SOURCE = 'DeleteTests';

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
			'Record Delete',
			() =>
			{
				test
				(
					'delete a record makes it unreadable',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'del-001',
										{ Name: 'Barry', Age: 39 },
										fCallback);
								});

							// Verify it exists first
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'del-001',
										function (pError, pRecord)
										{
											Expect(pRecord).to.be.an('object');
											Expect(pRecord.Name).to.equal('Barry');
											fCallback(pError);
										});
								});

							// Delete
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.delete(_SOURCE, 'del-001', fCallback);
								});

							// Read should return undefined
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'del-001',
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
					'delete makes exists() return false',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'del-exists-001',
										{ Name: 'Doomed' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.exists(_SOURCE, 'del-exists-001',
										function (pError, pExists)
										{
											Expect(pExists).to.equal(true, 'Record should exist before delete.');
											fCallback(pError);
										});
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.delete(_SOURCE, 'del-exists-001', fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.exists(_SOURCE, 'del-exists-001',
										function (pError, pExists)
										{
											Expect(pExists).to.equal(false, 'Record should not exist after delete.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'delete removes record from key listing',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'key-A', { Name: 'Alice' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'key-B', { Name: 'Barry' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'key-C', { Name: 'Cassandra' }, fCallback);
								});

							// Verify all three keys
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordKeys(_SOURCE,
										function (pError, pKeys)
										{
											Expect(pKeys.length).to.equal(3);
											fCallback(pError);
										});
								});

							// Delete the middle one
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.delete(_SOURCE, 'key-B', fCallback);
								});

							// Verify only two remain
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordKeys(_SOURCE,
										function (pError, pKeys)
										{
											Expect(pKeys.length).to.equal(2, 'Should have 2 records after deleting one.');
											Expect(pKeys).to.include('key-A');
											Expect(pKeys).to.include('key-C');
											Expect(pKeys).to.not.include('key-B');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'deleting a non-existent record is not an error',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.delete(_SOURCE, 'never-existed',
								function (pError)
								{
									Expect(pError).to.not.be.an.instanceOf(Error, 'Deleting non-existent record should not error.');
									fNext();
								});
						});
					}
				);

				test
				(
					'delete multiple records in sequence',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							// Create 4 records
							for (let i = 1; i <= 4; i++)
							{
								let tmpID = `multi-del-${i}`;
								tmpAnticipate.anticipate(
									function (fCallback)
									{
										_Pict.Bibliograph.write(_SOURCE, tmpID,
											{ Index: i, Name: `Record ${i}` }, fCallback);
									});
							}

							// Delete records 2 and 4
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.delete(_SOURCE, 'multi-del-2', fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.delete(_SOURCE, 'multi-del-4', fCallback);
								});

							// Verify only 1 and 3 remain
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordKeys(_SOURCE,
										function (pError, pKeys)
										{
											Expect(pKeys.length).to.equal(2);
											Expect(pKeys).to.include('multi-del-1');
											Expect(pKeys).to.include('multi-del-3');
											fCallback(pError);
										});
								});

							// Verify deleted records are unreadable
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'multi-del-2',
										function (pError, pRecord)
										{
											Expect(pRecord).to.be.undefined;
											fCallback(pError);
										});
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'multi-del-4',
										function (pError, pRecord)
										{
											Expect(pRecord).to.be.undefined;
											fCallback(pError);
										});
								});

							// Verify surviving records are intact
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'multi-del-1',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Record 1');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'delete rejects empty source hash',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.delete('', 'rec-001',
								function (pError)
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
					'delete rejects empty record GUID',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.delete(_SOURCE, '',
								function (pError)
								{
									Expect(pError).to.be.an.instanceOf(Error);
									Expect(pError.message).to.contain('record GUID');
									fNext();
								});
						});
					}
				);

				test
				(
					'write after delete creates a fresh record',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							// Write original
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'resurrect-001',
										{ Name: 'Original', Version: 1 },
										fCallback);
								});

							// Delete
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.delete(_SOURCE, 'resurrect-001', fCallback);
								});

							// Write new record with same GUID
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'resurrect-001',
										{ Name: 'Resurrected', Version: 2 },
										fCallback);
								});

							// Read should have the new data
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'resurrect-001',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Resurrected');
											Expect(pRecord.Version).to.equal(2);
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
