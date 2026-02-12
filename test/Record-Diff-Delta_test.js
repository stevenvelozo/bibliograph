/**
* Unit tests for Bibliograph - Record Diff and Delta Operations
*
* Covers: diffRecords comparison, generateDelta, generateDiffDelta,
* delta history accumulation via writes, and edge cases.
*
* @author      Steven Velozo <steven@velozo.com>
*/

const libPict = require('pict');
const libBibliograph = require('../source/Bibliograph.js');

const libFS = require('fs');

const Chai = require("chai");
const Expect = Chai.expect;

const _STORAGE_FOLDER = `${__dirname}/../debug/data/TestStorage-DiffDelta`;
const _SOURCE = 'DiffDeltaTests';

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
			'Record Diff - diffRecords',
			() =>
			{
				test
				(
					'identical records produce match result',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
							{ Name: 'Alice', Age: 41 },
							{ Name: 'Alice', Age: 41 }
						);

						Expect(tmpDiff.M).to.equal(1, 'M should be 1 for matching records.');
						Expect(tmpDiff.V).to.be.an('array');
						Expect(tmpDiff.V.length).to.equal(0, 'V should be empty for matching records.');
						fNext();
					}
				);

				test
				(
					'single field change is detected',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
							{ Name: 'Alice', Age: 41 },
							{ Name: 'Alice', Age: 42 }
						);

						Expect(tmpDiff.M).to.equal(0, 'M should be 0 for modified records.');
						Expect(tmpDiff.V.length).to.equal(1);
						Expect(tmpDiff.V[0]).to.equal('Age');
						fNext();
					}
				);

				test
				(
					'multiple field changes are detected',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
							{ Name: 'Alice', Age: 41 },
							{ Name: 'Alice', Age: 42, Height: 5.4 }
						);

						Expect(tmpDiff.M).to.equal(0);
						Expect(tmpDiff.V.length).to.equal(2);
						Expect(tmpDiff.V).to.include('Age');
						Expect(tmpDiff.V).to.include('Height');
						fNext();
					}
				);

				test
				(
					'new fields added are detected as changes',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
							{ Name: 'Alice', Age: 41 },
							{ Name: 'Alice', Age: 41, Height: 5.4 }
						);

						Expect(tmpDiff.M).to.equal(0, 'Adding a new field counts as a modification.');
						Expect(tmpDiff.V.length).to.equal(1);
						Expect(tmpDiff.V[0]).to.equal('Height');
						fNext();
					}
				);

				test
				(
					'field set to undefined is detected as change',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
							{ Name: 'Alice', Age: 41 },
							{ Name: 'Alice', Age: undefined, Height: 5.4, Weight: 150 }
						);

						Expect(tmpDiff.M).to.equal(0);
						Expect(tmpDiff.V.length).to.equal(3);
						Expect(tmpDiff.V).to.include('Age');
						Expect(tmpDiff.V).to.include('Height');
						Expect(tmpDiff.V).to.include('Weight');
						fNext();
					}
				);

				test
				(
					'subset with matching values is detected as match',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						// New record has fewer fields but matching values
						let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(
							{ Name: 'Alice', Age: 41 },
							{ Name: 'Alice' }
						);

						Expect(tmpDiff.M).to.equal(1, 'Subset with same values should be a match.');
						Expect(tmpDiff.V.length).to.equal(0);
						fNext();
					}
				);
			}
		);

		suite
		(
			'Record Diff - generateDelta',
			() =>
			{
				test
				(
					'returns false for identical records',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
							{ Name: 'Alice', Age: 41 },
							{ Name: 'Alice', Age: 41 }
						);

						Expect(tmpDelta).to.equal(false, 'No changes should return false.');
						fNext();
					}
				);

				test
				(
					'returns only changed fields',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
							{ Name: 'Alice', Age: 41 },
							{ Name: 'Alice', Age: 42 }
						);

						Expect(tmpDelta).to.be.an('object');
						Expect(tmpDelta).to.deep.equal({ Age: 42 });
						fNext();
					}
				);

				test
				(
					'returns multiple changed fields',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
							{ Name: 'Alice', Age: 41 },
							{ Name: 'Alice', Age: 42, Height: 5.4 }
						);

						Expect(tmpDelta).to.deep.equal({ Age: 42, Height: 5.4 });
						fNext();
					}
				);

				test
				(
					'returns false for subset with no effective changes',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
							{ Name: 'Alice', Age: 41 },
							{ Name: 'Alice' }
						);

						Expect(tmpDelta).to.equal(false, 'Subset with same values should return false.');
						fNext();
					}
				);

				test
				(
					'handles null old record gracefully',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(
							null,
							{ Name: 'Alice', Age: 42 }
						);

						Expect(tmpDelta).to.be.an('object', 'Should treat null old record as empty object.');
						Expect(tmpDelta).to.deep.equal({ Name: 'Alice', Age: 42 });
						fNext();
					}
				);
			}
		);

		suite
		(
			'Record Diff - generateDiffDelta',
			() =>
			{
				test
				(
					'extracts delta from a manual diff',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpOld = { Name: 'Alice', Age: 41 };
						let tmpNew = { Name: 'Alice', Age: 42 };
						let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOld, tmpNew);
						let tmpDelta = _Pict.BibliographRecordDiff.generateDiffDelta(tmpOld, tmpNew, tmpDiff);

						Expect(tmpDelta).to.deep.equal({ Age: 42 });
						fNext();
					}
				);

				test
				(
					'returns false for empty diff',
					(fNext) =>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});

						let tmpOld = { Name: 'Alice', Age: 41 };
						let tmpNew = { Name: 'Alice', Age: 41 };
						let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOld, tmpNew);
						let tmpDelta = _Pict.BibliographRecordDiff.generateDiffDelta(tmpOld, tmpNew, tmpDiff);

						Expect(tmpDelta).to.equal(false);
						fNext();
					}
				);
			}
		);

		suite
		(
			'Record Deltas via Storage',
			() =>
			{
				test
				(
					'delta history accumulates across multiple writes',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							// Mirrors the Subsequent Writes debug exercise
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'delta-accum-001',
										{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Pink' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'delta-accum-001',
										{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Green' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'delta-accum-001',
										{ Name: 'Clarissa', Species: 'SeaTurtle', Color: 'Beautiful' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordDelta(_SOURCE, 'delta-accum-001',
										function (pError, pDeltaContainer)
										{
											Expect(pDeltaContainer).to.be.an('object');
											Expect(pDeltaContainer.RecordGUID).to.equal('delta-accum-001');
											Expect(pDeltaContainer.Deltas).to.be.an('array');
											// 2 deltas: Pink->Green, Green->Beautiful
											Expect(pDeltaContainer.Deltas.length).to.be.at.least(2, 'Should have at least 2 change deltas.');

											// Each delta should have Delta and Ingest properties
											for (let i = 0; i < pDeltaContainer.Deltas.length; i++)
											{
												Expect(pDeltaContainer.Deltas[i]).to.have.property('Delta');
												Expect(pDeltaContainer.Deltas[i]).to.have.property('Ingest');
												Expect(pDeltaContainer.Deltas[i].Ingest).to.be.a('number');
											}

											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'identical second write does not add another delta',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpDeltaCountAfterFirstWrite = 0;

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'no-delta-001',
										{ Name: 'Static', Value: 42 },
										fCallback);
								});

							// Capture delta count after the first write
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordDelta(_SOURCE, 'no-delta-001',
										function (pError, pDeltaContainer)
										{
											tmpDeltaCountAfterFirstWrite = pDeltaContainer.Deltas.length;
											fCallback(pError);
										});
								});

							// Write same thing again -- no additional delta should be generated
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'no-delta-001',
										{ Name: 'Static', Value: 42 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordDelta(_SOURCE, 'no-delta-001',
										function (pError, pDeltaContainer)
										{
											Expect(pDeltaContainer).to.be.an('object');
											Expect(pDeltaContainer.RecordGUID).to.equal('no-delta-001');
											Expect(pDeltaContainer.Deltas).to.be.an('array');
											Expect(pDeltaContainer.Deltas.length).to.equal(tmpDeltaCountAfterFirstWrite, 'Identical writes should not add new deltas.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'delta container for never-written record returns empty container',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.readRecordDelta(_SOURCE, 'never-written',
								function (pError, pDeltaContainer)
								{
									Expect(pDeltaContainer).to.be.an('object');
									Expect(pDeltaContainer.RecordGUID).to.equal('never-written');
									Expect(pDeltaContainer.Deltas).to.be.an('array');
									Expect(pDeltaContainer.Deltas.length).to.equal(0);
									fNext(pError);
								});
						});
					}
				);

				test
				(
					'delta tracks partial update field changes',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'partial-delta-001',
										{ Name: 'Alice', Age: 41, City: 'Portland' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'partial-delta-001',
										{ Age: 42 },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.readRecordDelta(_SOURCE, 'partial-delta-001',
										function (pError, pDeltaContainer)
										{
											Expect(pDeltaContainer.Deltas.length).to.be.at.least(1, 'Should have at least 1 delta for the age change.');
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
