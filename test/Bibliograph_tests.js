/**
* Unit tests for Bibliograph
*
* @author      Steven Velozo <steven@velozo.com>
*/

const libPict = require('pict');
const libBibliograph = require('../source/Bibliograph.js');

const libFS = require('fs');

const Chai = require("chai");
const Expect = Chai.expect;

// If you set this to false, the tests won't clean up their data so you can inspect it.
const _CLEAN_UP_TEST_DATA = true;

suite
(
	'Bibliograph',
	() =>
	{
		setup ( () => {} );

		suite
		(
			'Execution Sanity',
			()=>
			{
				test
				(
					'load up okay',
					(fNext)=>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						let _BiblioGraph = _Pict.instantiateServiceProvider('Bibliograph', {});
						Expect(_BiblioGraph).to.be.an('object', 'The Bibliograph library should load.');
						return fNext();
					}
				);
				test
				(
					'create and check a storage folder',
					(fNext)=>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});
						_Pict.BibliographStorage.setStorageFolder(`${__dirname}/../debug/data/TestStorage`);
						_Pict.BibliographStorage.initialize(
							(pError)=>
							{
								Expect(libFS.existsSync(`${__dirname}/../debug/data/TestStorage`)).to.be.equal(true, 'The storage folder should exist.');
								if (_CLEAN_UP_TEST_DATA) { libFS.rmSync(`${__dirname}/../debug/data/TestStorage`, {recursive: true}); }
								fNext();
							}
						);
					}
				);
				test
				(
					'create and check a source folder',
					(fNext)=>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);

						_Pict.instantiateServiceProvider('Bibliograph', {});
						_Pict.BibliographStorage.setStorageFolder(`${__dirname}/../debug/data/TestStorage`);

						let _Anticipate = _Pict.newAnticipate();

						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.BibliographStorage.createSourceFolder('TestSource',
									(pError)=>
									{
										Expect(libFS.existsSync(`${__dirname}/../debug/data/TestStorage/TestSource`)).to.be.equal(true, 'The source folder should exist.');
										fCallback();
									}
								);
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.BibliographStorage.createSourceFolder('TestSource',
									(pError)=>
									{
										return fCallback(pError);
									}
								);
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.BibliographStorage.checkSourceExists('TestSource',
									(pError, pExists)=>
									{
										Expect(pExists).to.be.equal(true, 'The source folder should exist.');
										fCallback(pError);
									});
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.BibliographStorage.createSourceFolder('TestSource',
									(pError)=>
									{
										if (_CLEAN_UP_TEST_DATA) { libFS.rmSync(`${__dirname}/../debug/data/TestStorage`, {recursive: true}); }
										fCallback();
									}
								);
							});

						_Anticipate.wait(fNext);
					}
				);
				test
				(
					'commit and read records with artificial 50ms delay to test time spans',
					(fNext)=>
					{
						let _Pict = new libPict();
						let tmpStorageFolder = `${__dirname}/../debug/data/TestStorage`;
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);

						let tmpTestBeginDate = new Date();
						let tmpFilterFromDate = false;

						_Pict.instantiateServiceProvider('Bibliograph', {"Bibliograph-Storage-FS-Path":tmpStorageFolder});

						let _Anticipate = _Pict.newAnticipate();

						_Anticipate.anticipate(
							function (fCallback)
							{
								// Clean up the test store either way
								try
								{
									libFS.rmSync(tmpStorageFolder, {recursive: true});
								}
								catch(pError)
								{
									
								}
								fCallback();
							});

						// Initialize Bibliograph
						_Anticipate.anticipate(_Pict.Bibliograph.initialize.bind(_Pict.BibliographStorage));

						// Create a source set
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.createSource('UnitTestManual', fCallback);
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.exists('UnitTestManual', 'B', 
									(pError, pExists)=>
									{
										Expect(pExists).to.be.equal(false, 'The record B should not exist.');
										return fCallback(pError);
									}
								);
							});
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.write('UnitTestManual', 'A', {Name: 'Alice', Age: 41}, fCallback);
							});
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.write('UnitTestManual', 'A', {Name: 'Alice', Age: 41}, fCallback);
							});
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.write('UnitTestManual', 'B', {Name: 'Barry', Age: 39}, fCallback);
							});
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.exists('UnitTestManual', 'B', 
									(pError, pExists)=>
									{
										Expect(pExists).to.be.equal(true, 'The record B should now exist.');
										return fCallback(pError);
									}
								);
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								tmpFilterFromDate = new Date();
								setTimeout(fCallback, 50);
							});
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.write('UnitTestManual', 'C', {Name: 'Cassandra', Age: 34}, fCallback);
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.read('UnitTestManual', 'B',
									function(pError, pRecord)
									{
										Expect(pRecord.Name).to.be.equal('Barry', 'The record should be Barry.');
										return fCallback(pError);
									});
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.readRecordKeysByTimestamp('UnitTestManual', tmpFilterFromDate, new Date(),
								function (pError, pRecordKeys)
								{
									Expect(pRecordKeys).to.be.an('array', 'The record keys should be an array.');
									Expect(pRecordKeys.length).to.be.equal(2, 'There should be two records.');
									Expect(pRecordKeys[0]).to.be.equal('B', 'The first record key should be B.');
									Expect(pRecordKeys[1]).to.be.equal('C', 'The second record key should be C.');
									return fCallback(pError);
								});
							});
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.readRecordKeysByTimestamp('UnitTestManual', tmpTestBeginDate, new Date(),
								function (pError, pRecordKeys)
								{
									Expect(pRecordKeys).to.be.an('array', 'The record keys should be an array.');
									Expect(pRecordKeys.length).to.be.equal(3, 'There should be two records.');
									Expect(pRecordKeys[0]).to.be.equal('A', 'The first record key should be A.');
									Expect(pRecordKeys[1]).to.be.equal('B', 'The second record key should be B.');
									Expect(pRecordKeys[2]).to.be.equal('C', 'The third record key should be C.');
									return fCallback(pError);
								});
							});


						// Exercise change tracking
						// This changes nothing, so shouldn't result in a persist
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.readRecordMetadata('UnitTestManual', 'A',
									function(pError, pRecordMetadata)
									{
										Expect(pRecordMetadata.MD5).to.equal('461d65fea865254459a3c57f2f554ccf', 'The record md5 should be correct.');
										Expect(pRecordMetadata.Length).to.equal(25, 'The record length should be correct.');
										Expect(pRecordMetadata.QHash).to.equal('HSH-1024085287', 'The record quick hash should be correct.');
										return fCallback(pError);
									});
							});
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.write('UnitTestManual', 'A', {Age: 41}, fCallback);
							});
						// This changes the age, so it should change
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.write('UnitTestManual', 'A', {Age: 870}, fCallback);
							});
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.readRecordMetadata('UnitTestManual', 'A',
									function(pError, pRecordMetadata)
									{
										Expect(pRecordMetadata.MD5).to.equal('e67ddd09559f12dc1740bfb11212b3bf', 'The record md5 should be correct.');
										Expect(pRecordMetadata.Length).to.equal(26, 'The record length should be correct.');
										Expect(pRecordMetadata.QHash).to.equal('HSH-1681750157', 'The record quick hash should be correct.');
										return fCallback(pError);
									});
							});
						// Check that records update properly
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.read('UnitTestManual', 'A',
									function(pError, pRecord)
									{
										Expect(pRecord.Age).to.be.equal(870, 'Age should now be 870.');
										return fCallback(pError);
									});
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.delete('UnitTestManual', 'B',
									function(pError)
									{
										return fCallback(pError);
									});
							});
						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.exists('UnitTestManual', 'B', 
									(pError, pExists)=>
									{
										Expect(pExists).to.be.equal(false, 'The record B should no longer exist again.');
										return fCallback(pError);
									}
								);
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.read('UnitTestManual', 'B',
									function(pError, pRecord)
									{
										Expect(pRecord).to.be.undefined;
										return fCallback(pError);
									});
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								_Pict.Bibliograph.readRecordKeys('UnitTestManual',
									function(pError, pRecordKeys)
									{
										Expect(pRecordKeys).to.be.an('array', 'The record keys should be an array.');
										Expect(pRecordKeys.length).to.be.equal(2, 'There should be two records.');
										Expect(pRecordKeys[0]).to.be.equal('A', 'The first record key should be A.');
										Expect(pRecordKeys[1]).to.be.equal('C', 'The third record key should be C.');
										return fCallback(pError);
									});
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								// Try to read something that doesn't exist.
								_Pict.Bibliograph.read('UnitTestManual', 'D',
									function(pError, pRecord)
									{
										Expect(pRecord).to.be.undefined;
										return fCallback(pError);
									});
							});

						_Anticipate.anticipate(
							function (fCallback)
							{
								// Moved cleanup to top!
								//if (_CLEAN_UP_TEST_DATA) { libFS.rmSync(tmpStorageFolder, {recursive: true}); }
								fCallback();
							});

						_Anticipate.wait(fNext);
					}
				);
				test
				(
					'diff records',
					(fNext)=>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});
						Expect(_Pict.BibliographRecordDiff).to.be.an('object', 'The Bibliograph diffing service should load.');

						let tmpOldRecord = {Name: 'Alice', Age: 41};

						let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOldRecord, {Name: 'Alice', Age: 42});
						Expect(tmpDiff.M).to.be.equal(0, 'The diff should be marked as modified.');
						Expect(tmpDiff.V).to.be.an('array', 'The diff should have a value array.');
						Expect(tmpDiff.V.length).to.be.equal(1, 'The diff should have one value.');
						Expect(tmpDiff.V[0]).to.be.equal('Age', 'The diff should have the Age value.');

						tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOldRecord, {Name: 'Alice', Age: 41});
						Expect(tmpDiff.M).to.be.equal(1, 'The diff should be marked as not modified.');
						Expect(tmpDiff.V).to.be.an('array', 'The diff should have a value array.');
						Expect(tmpDiff.V.length).to.be.equal(0, 'The diff should have no values.');

						tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOldRecord, {Name: 'Alice', Age: 42, Height: 5.4});
						Expect(tmpDiff.M).to.be.equal(0, 'The diff should be marked as modified.');
						Expect(tmpDiff.V).to.be.an('array', 'The diff should have a value array.');
						Expect(tmpDiff.V.length).to.be.equal(2, 'The diff should have two values.');
						Expect(tmpDiff.V[0]).to.be.equal('Age', 'The diff should have the Age value.');
						Expect(tmpDiff.V[1]).to.be.equal('Height', 'The diff should have the Height value.');

						tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOldRecord, {Name: 'Alice', Age: 41, Height: 5.4});
						Expect(tmpDiff.M).to.be.equal(0, 'The diff should be marked as modified.');
						Expect(tmpDiff.V).to.be.an('array', 'The diff should have a value array.');
						Expect(tmpDiff.V.length).to.be.equal(1, 'The diff should have one value.');
						Expect(tmpDiff.V[0]).to.be.equal('Height', 'The diff should have the Height value.');

						tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOldRecord, {Name: 'Alice', Age: 41, Height: 5.4, Weight: 150});
						Expect(tmpDiff.M).to.be.equal(0, 'The diff should be marked as modified.');
						Expect(tmpDiff.V).to.be.an('array', 'The diff should have a value array.');
						Expect(tmpDiff.V.length).to.be.equal(2, 'The diff should have two values.');
						Expect(tmpDiff.V[0]).to.be.equal('Height', 'The diff should have the Height value.');
						Expect(tmpDiff.V[1]).to.be.equal('Weight', 'The diff should have the Weight value.');

						tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOldRecord, {Name: 'Alice', Age: undefined, Height: 5.4, Weight: 150});
						Expect(tmpDiff.M).to.be.equal(0, 'The diff should be marked as modified.');
						Expect(tmpDiff.V).to.be.an('array', 'The diff should have a value array.');
						Expect(tmpDiff.V.length).to.be.equal(3, 'The diff should have three values.');
						Expect(tmpDiff.V[0]).to.be.equal('Age', 'The diff should have the Age value.');
						Expect(tmpDiff.V[1]).to.be.equal('Height', 'The diff should have the Height value.');
						Expect(tmpDiff.V[2]).to.be.equal('Weight', 'The diff should have the Weight value.');

						return fNext();
					}
				);
				test
				(
					'generate delta records',
					(fNext)=>
					{
						let _Pict = new libPict();
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);
						_Pict.instantiateServiceProvider('Bibliograph', {});
						Expect(_Pict.BibliographRecordDiff).to.be.an('object', 'The Bibliograph diffing service should load.');

						let tmpOldRecord = {Name: 'Alice', Age: 41};

						// Test one with a manual diff
						let tmpDiff = _Pict.BibliographRecordDiff.diffRecords(tmpOldRecord, {Name: 'Alice', Age: 42});
						let tmpDiffDelta = _Pict.BibliographRecordDiff.generateDiffDelta(tmpOldRecord, {Name: 'Alice', Age: 42}, tmpDiff);
						Expect(tmpDiffDelta).to.be.an('object', 'The diff delta should be an object.');
						Expect(tmpDiffDelta).to.be.deep.equal({Age: 42}, 'The diff delta should only have the changed values.');

						let tmpDelta = _Pict.BibliographRecordDiff.generateDelta(tmpOldRecord, {Name: 'Alice', Age: 41});
						Expect(tmpDelta).to.be.equal(false, 'The delta should be false.');

						tmpDelta = _Pict.BibliographRecordDiff.generateDelta(tmpOldRecord, {Name: 'Alice', Age: 42});
						Expect(tmpDelta).to.be.an('object', 'The delta should be an object.');
						Expect(tmpDelta).to.be.deep.equal({Age: 42}, 'The delta should only have the changed values.');
						tmpDelta = _Pict.BibliographRecordDiff.generateDelta(tmpOldRecord, {Age: 42});

						tmpDelta = _Pict.BibliographRecordDiff.generateDelta(tmpOldRecord, {Name: 'Alice'});
						Expect(tmpDelta).to.be.equal(false, 'The delta should be false.');

						tmpDelta = _Pict.BibliographRecordDiff.generateDelta(tmpOldRecord, {Name: 'Alice', Age: 42, Height: 5.4});
						Expect(tmpDelta).to.be.an('object', 'The delta should be an object.');
						Expect(tmpDelta).to.be.deep.equal({Age: 42, Height: 5.4}, 'The delta should only have the changed values.');

						return fNext();
					}
				);
			}
		);
	}
);