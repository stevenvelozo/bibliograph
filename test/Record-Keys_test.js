/**
* Unit tests for Bibliograph - Record Keys Operations
*
* Covers: readRecordKeys listing, readRecordKeysByTimestamp filtering,
* key list after CRUD operations, and input validation.
*
* @author      Steven Velozo <steven@velozo.com>
*/

const libPict = require('pict');
const libBibliograph = require('../source/Bibliograph.js');

const libFS = require('fs');

const Chai = require("chai");
const Expect = Chai.expect;

const _STORAGE_FOLDER = `${__dirname}/../debug/data/TestStorage-Keys`;
const _SOURCE = 'KeysTests';

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
			'Record Keys',
			() =>
			{
				test
				(
					'empty source returns empty keys array',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.readRecordKeys(_SOURCE,
								function (pError, pKeys)
								{
									Expect(pKeys).to.be.an('array');
									Expect(pKeys.length).to.equal(0, 'Empty source should have no keys.');
									fNext(pError);
								});
						});
					}
				);

				test
				(
					'keys reflect all written records',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'alpha', { Name: 'Alpha' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'beta', { Name: 'Beta' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'gamma', { Name: 'Gamma' }, fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordKeys(_SOURCE,
										function (pError, pKeys)
										{
											Expect(pKeys).to.be.an('array');
											Expect(pKeys.length).to.equal(3);
											Expect(pKeys).to.include('alpha');
											Expect(pKeys).to.include('beta');
											Expect(pKeys).to.include('gamma');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'keys decrease after deletion',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'A', { Name: 'Alice' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'B', { Name: 'Barry' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'C', { Name: 'Cassandra' }, fCallback);
								});

							// Delete B
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.delete(_SOURCE, 'B', fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordKeys(_SOURCE,
										function (pError, pKeys)
										{
											Expect(pKeys.length).to.equal(2);
											Expect(pKeys).to.include('A');
											Expect(pKeys).to.include('C');
											Expect(pKeys).to.not.include('B');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'duplicate writes do not create duplicate keys',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'dup-key-001',
										{ Name: 'First' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'dup-key-001',
										{ Name: 'Second' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'dup-key-001',
										{ Name: 'Third' }, fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordKeys(_SOURCE,
										function (pError, pKeys)
										{
											Expect(pKeys.length).to.equal(1, 'Overwriting the same GUID should not create duplicates.');
											Expect(pKeys[0]).to.equal('dup-key-001');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'readRecordKeys rejects empty source hash',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.readRecordKeys('',
								function (pError, pKeys)
								{
									Expect(pError).to.be.an.instanceOf(Error);
									Expect(pError.message).to.contain('source hash');
									fNext();
								});
						});
					}
				);
			}
		);

		suite
		(
			'Record Keys By Timestamp',
			() =>
			{
				test
				(
					'filters records by ingest time window',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpTestStart = new Date();
							let tmpMidpoint = false;

							let tmpAnticipate = _Pict.newAnticipate();

							// Write A and B before the midpoint
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'ts-A', { Name: 'Alice' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'ts-B', { Name: 'Barry' }, fCallback);
								});

							// Wait to create a clear time gap, capture midpoint AFTER the delay
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									setTimeout(
										function ()
										{
											tmpMidpoint = new Date();
											fCallback();
										}, 100);
								});

							// Write C after the midpoint
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'ts-C', { Name: 'Cassandra' }, fCallback);
								});

							// Query for records after midpoint -- should include C
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordKeysByTimestamp(_SOURCE, tmpMidpoint, new Date(),
										function (pError, pKeys)
										{
											Expect(pKeys).to.be.an('array');
											Expect(pKeys).to.include('ts-C', 'C was written after the midpoint.');
											fCallback(pError);
										});
								});

							// Query for all records from start
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordKeysByTimestamp(_SOURCE, tmpTestStart, new Date(),
										function (pError, pKeys)
										{
											Expect(pKeys).to.be.an('array');
											Expect(pKeys.length).to.equal(3, 'All 3 records should be in the full range.');
											Expect(pKeys).to.include('ts-A');
											Expect(pKeys).to.include('ts-B');
											Expect(pKeys).to.include('ts-C');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'empty time range returns no keys',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'old-001', { Name: 'Old' }, fCallback);
								});

							// Query a range far in the past
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									let tmpPastStart = new Date('2020-01-01');
									let tmpPastEnd = new Date('2020-01-02');
									_Pict.Bibliograph.readRecordKeysByTimestamp(_SOURCE, tmpPastStart, tmpPastEnd,
										function (pError, pKeys)
										{
											Expect(pKeys).to.be.an('array');
											Expect(pKeys.length).to.equal(0, 'No records should match a past time range.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'readRecordKeysByTimestamp rejects empty source hash',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.readRecordKeysByTimestamp('', new Date(), new Date(),
								function (pError, pKeys)
								{
									Expect(pError).to.be.an.instanceOf(Error);
									Expect(pError.message).to.contain('source hash');
									fNext();
								});
						});
					}
				);
			}
		);
	}
);
