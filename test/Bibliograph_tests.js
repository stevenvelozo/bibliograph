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
								libFS.rmSync(`${__dirname}/../debug/data/TestStorage`, {recursive: true});
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
										libFS.rmSync(`${__dirname}/../debug/data/TestStorage`, {recursive: true});
										fCallback();
									}
								);
							});

						_Anticipate.wait(fNext);
					}
				);
				test
				(
					'commit and read records',
					(fNext)=>
					{
						let _Pict = new libPict();
						let tmpStorageFolder = `${__dirname}/../debug/data/TestStorage`;
						_Pict.addServiceTypeIfNotExists('Bibliograph', libBibliograph);

						_Pict.instantiateServiceProvider('Bibliograph', {"Bibliograph-Storage-FS-Path":tmpStorageFolder});

						let _Anticipate = _Pict.newAnticipate();

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
								_Pict.Bibliograph.readMetadata('UnitTestManual', 'A',
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
								//libFS.rmSync(tmpStorageFolder, {recursive: true});
								fCallback();
							});

						_Anticipate.wait(fNext);
					}
				);
			}
		);
	}
);