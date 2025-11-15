// const libRocksDB = require('rocksdb');
// const _RocksDBInstance = libRocksDB('./data/simple_rocksdb_harness/exercises');

// _RocksDBInstance.open(
// 	function (pError)
// 	{
// 		if (pError) throw pError;

// 		_RocksDBInstance.batch()
// 			.put('user:user123', JSON.stringify({ name: 'Alice', age: 30, city: 'New York' }))

// 			.put('age:30:user123', 'user123')  // Indexing by age
// 			.put('city:New York:user123', 'user123')  // Indexing by city

// 			.write(
// 				function (pTransactionCommitError)
// 				{
// 					if (pTransactionCommitError) throw pTransactionCommitError;
// 					console.log('Data indexed');
// 				});
// 	});