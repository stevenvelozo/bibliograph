/**
* Unit tests for Bibliograph - Record Existence Operations
*
* Covers: basic existence check, before/after write, before/after delete,
* non-existent records, and input validation.
*
* @author      Steven Velozo <steven@velozo.com>
*/

const libPict = require('pict');
const libBibliograph = require('../source/Bibliograph.js');

const libFS = require('fs');

const Chai = require("chai");
const Expect = Chai.expect;

const _STORAGE_FOLDER = `${__dirname}/../debug/data/TestStorage-Exists`;
const _SOURCE = 'ExistsTests';

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
			'Record Existence',
			() =>
			{
				test
				(
					'non-existent record returns false',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.exists(_SOURCE, 'ghost-001',
								function (pError, pExists)
								{
									Expect(pExists).to.equal(false, 'Record that was never written should not exist.');
									fNext(pError);
								});
						});
					}
				);

				test
				(
					'exists returns true after write',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							// Confirm not exists before write
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.exists(_SOURCE, 'appear-001',
										function (pError, pExists)
										{
											Expect(pExists).to.equal(false, 'Record should not exist before write.');
											fCallback(pError);
										});
								});

							// Write the record
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'appear-001',
										{ Name: 'Now I Exist' },
										fCallback);
								});

							// Confirm exists after write
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.exists(_SOURCE, 'appear-001',
										function (pError, pExists)
										{
											Expect(pExists).to.equal(true, 'Record should exist after write.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'exists returns false after delete',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'vanish-001',
										{ Name: 'Soon Gone' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.exists(_SOURCE, 'vanish-001',
										function (pError, pExists)
										{
											Expect(pExists).to.equal(true);
											fCallback(pError);
										});
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.delete(_SOURCE, 'vanish-001', fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.exists(_SOURCE, 'vanish-001',
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
					'exists returns true after re-creation following delete',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'phoenix-001',
										{ Name: 'Original' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.delete(_SOURCE, 'phoenix-001', fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.exists(_SOURCE, 'phoenix-001',
										function (pError, pExists)
										{
											Expect(pExists).to.equal(false);
											fCallback(pError);
										});
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'phoenix-001',
										{ Name: 'Reborn' },
										fCallback);
								});

							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.exists(_SOURCE, 'phoenix-001',
										function (pError, pExists)
										{
											Expect(pExists).to.equal(true, 'Record should exist again after re-creation.');
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'check multiple records for existence',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							let tmpAnticipate = _Pict.newAnticipate();

							// Create only A and C
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'check-A', { Name: 'A' }, fCallback);
								});
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.write(_SOURCE, 'check-C', { Name: 'C' }, fCallback);
								});

							// A exists
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.exists(_SOURCE, 'check-A',
										function (pError, pExists)
										{
											Expect(pExists).to.equal(true);
											fCallback(pError);
										});
								});

							// B does not exist
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.exists(_SOURCE, 'check-B',
										function (pError, pExists)
										{
											Expect(pExists).to.equal(false);
											fCallback(pError);
										});
								});

							// C exists
							tmpAnticipate.anticipate(
								function (fCallback)
								{
									_Pict.Bibliograph.exists(_SOURCE, 'check-C',
										function (pError, pExists)
										{
											Expect(pExists).to.equal(true);
											fCallback(pError);
										});
								});

							tmpAnticipate.wait(fNext);
						});
					}
				);

				test
				(
					'exists rejects empty source hash',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.exists('', 'rec-001',
								function (pError, pExists)
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
					'exists rejects empty record GUID',
					(fNext) =>
					{
						createBibliograph(function (pError, _Pict)
						{
							if (pError) return fNext(pError);

							_Pict.Bibliograph.exists(_SOURCE, '',
								function (pError, pExists)
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
