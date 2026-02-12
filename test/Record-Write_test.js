/**
* Unit tests for Bibliograph - Record Write Operations
*
* Covers: basic write, partial update merging, deduplication via hash,
* writing with deltas disabled, writing with metadata check disabled,
* bulk sequential writes, and input validation.
*
* @author      Steven Velozo <steven@velozo.com>
*/

const libPict = require('pict');
const libBibliograph = require('../source/Bibliograph.js');

const libFS = require('fs');

const Chai = require("chai");
const Expect = Chai.expect;

const _STORAGE_FOLDER = `${__dirname}/../debug/data/TestStorage-Write`;
const _SOURCE = 'WriteTests';

// Helper to create a fresh Bibliograph environment
function createBibliograph(pSettings, fCallback)
{
	let tmpSettings = Object.assign(
		{ "Bibliograph-Storage-FS-Path": _STORAGE_FOLDER },
		pSettings || {});
	let _Pict = new libPict(tmpSettings);
	_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
	_Pict.instantiateServiceProvider('Bibliograph', tmpSettings);

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
		// Clean up before and after
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
			'Record Write',
			() =>
			{
				test
				(
					'write a new record and read it back',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'fruit-001',
										{ Name: 'Apple', Color: 'Red', Weight: 182 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'fruit-001',
										function (pError, pRecord)
										{
											Expect(pRecord).to.be.an('object', 'The record should be an object.');
											Expect(pRecord.Name).to.equal('Apple');
											Expect(pRecord.Color).to.equal('Red');
											Expect(pRecord.Weight).to.equal(182);
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'partial update merges with existing record',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							// Write the initial record
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'merge-001',
										{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Pink' },
										fCallback);
								});

							// Partial update -- only Color changes
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'merge-001',
										{ Color: 'Green' },
										fCallback);
								});

							// Read back and verify merge
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'merge-001',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Clarissa', 'Name should be preserved from original.');
											Expect(pRecord.Species).to.equal('SeaTurtle', 'Species should be preserved from original.');
											Expect(pRecord.Color).to.equal('Green', 'Color should be updated to Green.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'multiple partial updates accumulate fields',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'accum-001',
										{ Name: 'Alice' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'accum-001',
										{ Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'accum-001',
										{ City: 'Portland' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'accum-001',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Alice');
											Expect(pRecord.Age).to.equal(41);
											Expect(pRecord.City).to.equal('Portland');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'deduplication skips identical write',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpFirstIngest = false;

							let tmpAnticipate = _Pict.newAnticipate();

							// First write
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'dedup-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							// Capture the ingest timestamp
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'dedup-001',
										function (pError, pMetadata)
										{
											tmpFirstIngest = pMetadata.Ingest;
											Expect(tmpFirstIngest).to.be.a('number');
											fCallback(pError);
										});
								});

							// Small delay so timestamps would differ if a write occurs
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									setTimeout(fCallback, 20);
								});

							// Write identical data
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'dedup-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							// Verify the ingest timestamp did NOT change (write was skipped)
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'dedup-001',
										function (pError, pMetadata)
										{
											Expect(pMetadata.Ingest).to.equal(tmpFirstIngest, 'Ingest timestamp should not change for identical writes.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'partial write with same values is skipped by deduplication',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpFirstMD5 = false;

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'partial-same-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'partial-same-001',
										function (pError, pMetadata)
										{
											tmpFirstMD5 = pMetadata.MD5;
											fCallback(pError);
										});
								});

							// Write only Age: 41 -- merges to same record, should skip
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'partial-same-001',
										{ Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'partial-same-001',
										function (pError, pMetadata)
										{
											Expect(pMetadata.MD5).to.equal(tmpFirstMD5, 'MD5 should not change when partial write does not change merged content.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'write with metadata check disabled always persists',
					(fNext) =>
					{
						createBibliograph({ "Bibliograph-Check-Metadata-On-Write": false }, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpFirstIngest = false;

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'nocheck-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'nocheck-001',
										function (pError, pMetadata)
										{
											tmpFirstIngest = pMetadata.Ingest;
											fCallback(pError);
										});
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									setTimeout(fCallback, 20);
								});

							// Write identical data -- should still persist because check is disabled
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'nocheck-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordMetadata(_SOURCE, 'nocheck-001',
										function (pError, pMetadata)
										{
											Expect(pMetadata.Ingest).to.not.equal(tmpFirstIngest, 'Ingest should change when metadata check is disabled.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'sequential writes to multiple records',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							let tmpRecords =
								[
									{ id: 'bulk-001', data: { Name: 'Alice', Age: 41 } },
									{ id: 'bulk-002', data: { Name: 'Barry', Age: 39 } },
									{ id: 'bulk-003', data: { Name: 'Cassandra', Age: 34 } },
									{ id: 'bulk-004', data: { Name: 'Dmitri', Age: 55 } },
									{ id: 'bulk-005', data: { Name: 'Elena', Age: 28 } }
								];

							// Write all records
							for (let i = 0; i < tmpRecords.length; i++)
							{
								let tmpRecord = tmpRecords[i];
								tmpAnticipate.anticipate(
									function (fCallback)
									{
										_Pict.Bibliograph.write(_SOURCE, tmpRecord.id, tmpRecord.data, fCallback);
									});
							}

							// Verify all records were written
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordKeys(_SOURCE,
										function (pError, pKeys)
										{
											Expect(pKeys).to.be.an('array');
											Expect(pKeys.length).to.equal(5, 'All 5 records should be present.');
											fCallback(pError);
										});
								});

							// Spot-check a couple records
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'bulk-003',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Cassandra');
											Expect(pRecord.Age).to.equal(34);
											fCallback(pError);
										});
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'bulk-005',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Elena');
											Expect(pRecord.Age).to.equal(28);
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'subsequent writes track color changes like the debug harness',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							// Mirrors debug/exercises/Exercise-Subsequent-Writes.js
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'OverwriteMe',
										{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Pink' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'OverwriteMe',
										{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Green' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'OverwriteMe',
										{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Beautiful' },
										fCallback);
								});

							// Verify final state
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'OverwriteMe',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Clarissa');
											Expect(pRecord.Species).to.equal('SeaTurtle');
											Expect(pRecord.Color).to.equal('Beautiful');
											fCallback(pError);
										});
								});

							// Verify deltas were tracked
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordDelta(_SOURCE, 'OverwriteMe',
										function (pError, pDeltaContainer)
										{
											Expect(pDeltaContainer).to.be.an('object');
											Expect(pDeltaContainer.RecordGUID).to.equal('OverwriteMe');
											Expect(pDeltaContainer.Deltas).to.be.an('array');
											Expect(pDeltaContainer.Deltas.length).to.be.at.least(2, 'Should have at least 2 deltas for 2 changes.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'write rejects invalid source hash',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.write('', 'rec-001', { Name: 'Test' },
								function (pError)
								{
									Expect(pError).to.be.an.instanceOf(Error, 'Should error on empty source hash.');
									Expect(pError.message).to.contain('source hash');
									fNext();
								});
						});
					}
				);

				test
				(
					'write rejects invalid record GUID',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.write(_SOURCE, '', { Name: 'Test' },
								function (pError)
								{
									Expect(pError).to.be.an.instanceOf(Error, 'Should error on empty GUID.');
									Expect(pError.message).to.contain('record GUID');
									fNext();
								});
						});
					}
				);

				test
				(
					'write rejects non-object record',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.write(_SOURCE, 'bad-001', 'not an object',
								function (pError)
								{
									Expect(pError).to.be.an.instanceOf(Error, 'Should error on non-object record.');
									Expect(pError.message).to.contain('must be an object');
									fNext();
								});
						});
					}
				);

				test
				(
					'overwrite replaces field values',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'overwrite-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'overwrite-001',
										{ Age: 870 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'overwrite-001',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Alice', 'Name should be preserved.');
											Expect(pRecord.Age).to.equal(870, 'Age should be updated to 870.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'write with deltas disabled does not create delta history',
					(fNext) =>
					{
						createBibliograph({ "Bibliograph-Store-Deltas": false }, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'nodelta-001',
										{ Name: 'Alice', Age: 41 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'nodelta-001',
										{ Age: 42 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordDelta(_SOURCE, 'nodelta-001',
										function (pError, pDeltaContainer)
										{
											Expect(pDeltaContainer).to.be.an('object');
											Expect(pDeltaContainer.Deltas).to.be.an('array');
											Expect(pDeltaContainer.Deltas.length).to.equal(0, 'No deltas should be stored when disabled.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'write records with complex nested objects',
					(fNext) =>
					{
						createBibliograph({}, function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpComplexRecord =
								{
									Name: 'Complex University',
									Address:
										{
											Street: '123 Main St',
											City: 'Springfield',
											State: 'IL',
											Zip: '62701'
										},
									Departments: ['CS', 'Math', 'Physics'],
									Enrollment: 15000,
									Active: true
								};

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'complex-001', tmpComplexRecord, fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.read(_SOURCE, 'complex-001',
										function (pError, pRecord)
										{
											Expect(pRecord.Name).to.equal('Complex University');
											Expect(pRecord.Address).to.be.an('object');
											Expect(pRecord.Address.City).to.equal('Springfield');
											Expect(pRecord.Departments).to.be.an('array');
											Expect(pRecord.Departments.length).to.equal(3);
											Expect(pRecord.Active).to.equal(true);
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
