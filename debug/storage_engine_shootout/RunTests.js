/*
 * ___________________ __________                                    ______     
 * ___  __ )__(_)__  /____  /__(_)____________ _____________ ___________  /_    
 * __  __  |_  /__  __ \_  /__  /_  __ \_  __ `/_  ___/  __ `/__  __ \_  __ \   
 * _  /_/ /_  / _  /_/ /  / _  / / /_/ /  /_/ /_  /   / /_/ /__  /_/ /  / / /   
 * /_____/ /_/  /_.___//_/  /_/  \____/_\__, / /_/    \__,_/ _  .___//_/ /_/    
 *                                     /____/                /_/                
 * ________            ________                                                 
 * ___  __ \______________  __/___________________ _________ __________________ 
 * __  /_/ /  _ \_  ___/_  /_ _  __ \_  ___/_  __ `__ \  __ `/_  __ \  ___/  _ \
 * _  ____//  __/  /   _  __/ / /_/ /  /   _  / / / / / /_/ /_  / / / /__ /  __/
 * /_/     \___//_/    /_/    \____//_/    /_/ /_/ /_/\__,_/ /_/ /_/\___/ \___/ 
 * 
 * _____________             _____             _____                            
 * __  ___/__  /_______________  /__________  ___  /_                           
 * _____ \__  __ \  __ \  __ \  __/  __ \  / / /  __/                           
 * ____/ /_  / / / /_/ / /_/ / /_ / /_/ / /_/ // /_                             
 * /____/ /_/ /_/\____/\____/\__/ \____/\__,_/ \__/                             
 * 
 * 
 * # Bibliograph Performance Shootout
 * 
 * This harness tests the speed of various storage engines by ingesting the same
 * set of small, medium and large records into each engine.  The harness is meant
 * to be run in a single shot to preserve environmental conditions.
 * 
 * Each engine is tested within its own process, so results are not affected by
 * sequence or memory concerns.
*/

const libPict = require('pict');
const libChildProcess = require('child_process');

const _Pict = new libPict(
		{
			Product: `Bibliograph-Speedtest`,
			LogStreams:
				[
					{
						loggertype:'simpleflatfile',
						outputloglinestoconsole: false,
						showtimestamps: true,
						formattedtimestamps: true,
						level:'trace',
						path: `${process.cwd()}/Bibliograph-Shootout-Run.log`
					}
					// ,{
					// 	loggertype:'console',
					// 	showtimestamps: true,
					// 	formattedtimestamps: true,
					// 	level: 'trace'
					// }
				],
			// FS Storage Settings
			"Bibliograph-Storage-FS-Path": `${process.cwd()}/data/HarnessLib`
		});

_Pict.AppData.Engines = (
	[
		{ Name: 'Filesystem', Hash: 'FS', EngineFolder: 'fs' },
		{ Name: 'LMDB', Hash: 'LMDB', EngineFolder: 'lmdb' },
//		{ Name: 'SQLite', Hash: 'SQLite', EngineFolder: 'sqlite' },
//		{ Name: 'MongoDB', Hash: 'MongoDB', EngineFolder: 'mongodb' },
//		{ Name: 'MySQL', Hash: 'MySQL', EngineFolder: 'mysql' },
//		{ Name: 'Redis', Hash: 'Redis', EngineFolder: 'redis' }
	]
)
_Pict.AppData.Tests = (
	[
		{ Name: 'Simple Ingest DoE College Comparison Data', Hash: 'Ingest-DOE-Data-Simple', Manifest: false },
		{ Name: 'GUID-Mapped Ingest DoE College Comparison Data', Hash: 'Ingest-DOE-Data', Manifest: `${__dirname}/ingest_manifests/Manyfest-RawDOE-Institutions-GUIDMapped.json` },
	]);
_Pict.AppData.TestResults = [];
const _Anticipate = _Pict.newAnticipate();

for (let i = 0; i < _Pict.AppData.Engines.length; i++)
{
	let tmpTestEngine = _Pict.AppData.Engines[i];
	_Anticipate.anticipate(
		(fNext) =>
		{
			try
			{
				libChildProcess.exec(`node ${__dirname}/engines/${tmpTestEngine.EngineFolder}/RunTest.js`,
					(pError, stdout, stderr) =>
					{
						if (pError)
						{
							_Pict.log.error(`Error running test for Engine [${tmpTestEngine.Name}]: ${pError.message}`);
							return fNext();
						}

						try
						{
							const tmpResults = JSON.parse(stdout);
							_Pict.AppData.TestResults.push(tmpResults);
						}
						catch (pError)
						{
							_Pict.log.error(`Error parsing Engine [${tmpTestEngine.Name}] test results: ${pError.message}`);
							return fNext();
						}
						_Pict.log.info(`Engine [${tmpTestEngine.Name}] stdout: ${stdout}`);
						_Pict.log.info(`Engine [${tmpTestEngine.Name}] stderr: ${stderr}`);
						return fNext();
					});
			}
			catch (pError)
			{
				_Pict.log.error(`Error running test engine ${tmpTestEngine.Name}: ${pError.message}`);
				return fNext();
			}
		});
}

_Anticipate.wait(
	(fTestsComplete) =>
	{
		_Pict.log.info(`All tests complete...`);
		_Pict.log.info(`Test results: ${JSON.stringify(_Pict.AppData.TestResults)}`);
	});