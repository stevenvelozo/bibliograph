// From the README.md file in the lmdb package
//
// import { open } from 'lmdb'; // or require
// let myDB = open({
// 	path: 'my-db',
// 	// any options go here, we can turn on compression like this:
// 	compression: true,
// });
// await myDB.put('greeting', { someText: 'Hello, World!' });
// myDB.get('greeting').someText // 'Hello, World!'
// // or
// myDB.transaction(() => {
// 	myDB.put('greeting', { someText: 'Hello, World!' });
// 	myDB.get('greeting').someText // 'Hello, World!'
// });


const libLMDB = require('lmdb');
let _DB = libLMDB.open(
	{
		path: `${__dirname}/../../data/lmdb-testcode-db`,
		compression: true,
	});

await _DB.put('greeting', { someText: 'Hello, World!' });

_DB.get('greeting').someText;

_DB.transaction(
	() =>
	{
		_DB.put('callback_transaction_greeting', { someText: 'Hello, World, from a transaction!' });
		_DB.get('callback_transaction_greeting').someText;
	});