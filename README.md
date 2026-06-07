# Promised node:sqlite

## Introduction

You can use async/await for node:sqlite.

Inspired by, derived from, promised.sqlite which promised: You can use async/await for sqlite3.

### History

This package is a fork of [promised.sqlite](https://www.npmjs.com/package/promised.sqlite).  Rationale:

* The [sqlite3](https://www.npmjs.com/package/sqlite3) package has been marked DEPRECATED and UNMAINTAINED
* The Node.js platform now has built-in [node:sqlite](https://nodejs.org/api/sqlite.html) which is just as synchronous as the old sqlite3 package
* Ergo, Node.js applications that use SQLITE3 are urged to switch to the build-in package 
* Some people will want to use asynchronous functions on top of node:sqlite

Simple..? fork promised.sqlite to use `node:sqlite`.  Well, it wasn't quite that simple.

It resulted in a nearly complete rewrite which preserved the nature of promised.sqlite while embracing the new API in node:sqlite.

Zero runtime dependencies, and you can move towards node:sqlite.

## Install

```shell
> npm install promised.node.sqlite --save
```

## Usage

The intent is to preserve the API supplied by promised.sqlite, while moving forward to similarity with the DatabaseSync class in `node:sqlite`.  Hence, code written for promised.sqlite will be more able to operate without change while offering a path to the current API.

It requires Node.js 24.x and greater.

### In memory based database

```js
import {
  open,
  AsyncDatabase
} from 'promised.node.sqlite';

// open the database - with promised.sqlite API
const db = await open(':memory:');
// open the database - with the new AsyncDatabase API
const db = await AsyncDatabase.open(':memory');
console.log('Connected to the in-memory SQlite database.')

// close the database connection
await db.close()
console.log('Close the database connection.')
```

### Disk file based database

```js
import {
  open,
  OPEN_READWRITE,
  AsyncDatabase
} from 'promised.node.sqlite'

// open the database - with promised.sqlite API
const db = await open('./assets/chinook.db', OPEN_READWRITE);
// open the database - with the new AsyncDatabase API
const db = await AsyncDatabase.open('./assets/chinook.db');
console.log('Connected to the database.')

const row = await db.get(`SELECT PlaylistId as id,
                          Name as name
                          FROM playlists`)
console.log(row.id + '\t' + row.name)

// close the database connection
await db.close()
```

### Querying all rows with all() method

```js
import {
  open,
  AsyncDatabase
} from 'promised.node.sqlite'

const sql = `SELECT DISTINCT Name name FROM playlists
              ORDER BY name`;

// open the database - with promised.sqlite API
const db = await open('./assets/chinook.db');
// open the database - with the new AsyncDatabase API
const db = await AsyncDatabase.open('./assets/chinook.db');

// querying all rows with all() method
const rows = await db.all(sql, [])
rows.forEach(row => {
  console.log(row.name)
})

// close the database connection
await db.close()
```

### Query the first row in the result set

```js
import {
  open,
  AsyncDatabase
} from 'promised.node.sqlite'

// open the database - with promised.sqlite API
const db = await open('./assets/chinook.db');
// open the database - with the new AsyncDatabase API
const db = await AsyncDatabase.open('./assets/chinook.db');

const sql = `SELECT PlaylistID id,
                  Name name
              FROM playlists
              WHERE PlaylistId = ?`
const playlistId = 1

// first row only
const row = await db.get(sql, [playlistId])
row
? console.log(row.id, row.name)
: console.log(`No playlist found with the id ${playlistId}`)

// close the database connection
await db.close()
```

### Query rows with each() method

```js
import {
  open,
  AsyncDatabase
} from 'promised.node.sqlite'

// open the database - with promised.sqlite API
const db = await open('./assets/chinook.db');
// open the database - with the new AsyncDatabase API
const db = await AsyncDatabase.open('./assets/chinook.db');

const sql = `SELECT FirstName firstName,
                  LastName lastName,
                  Email email
              FROM customers
              WHERE Country = ?
              ORDER BY FirstName`
const rows: string[] = []

for await (let row of db.each(sql, ['USA'])) {
  const r = `${row.firstName} ${row.lastName} - ${row.email}`
  console.log(r)
}

await db.close()
```

### Insert on row into a table

```js
import {
  open,
  AsyncDatabase
} from 'promised.node.sqlite'

// open the database - with promised.sqlite API
const db = await open(':memory:');
// open the database - with the new AsyncDatabase API
const db = await AsyncDatabase.open(':memory');

// insert one row into the langs table
await db.run('CREATE TABLE langs(name text)')
const res = await db.run(`INSERT INTO langs(name) VALUES(?)`, ['C'])

// get the last insert id
console.log(`A row has been inserted with rowid ${res.lastID}`)

// close the database connection
await db.close()
```

### Insert multiple rows into a table at a time

```js
import {
  open,
  AsyncDatabase
} from 'promised.node.sqlite'

// open the database - with promised.sqlite API
const db = await open(':memory:');
// open the database - with the new AsyncDatabase API
const db = await AsyncDatabase.open(':memory');

const languages = ['C++', 'Python', 'Java', 'C#', 'Go']

// construct the insert statement with multiple placehoders
// based on the number of rows
const placeholders = languages.map(lan => '(?)').join(',')
const sql = 'INSERT INTO langs(name) VALUES ' + placeholders

// output the INSERT statement
console.log(sql)
await db.run('CREATE TABLE langs(name text)')
const res = await db.run(sql, languages)
console.log(`Rows inserted ${res.changes}`)

// close the database connection
db.close()
```

### Updating Data in SQLite Database from a Node.js Application

```js
import {
  open,
  AsyncDatabase
} from 'promised.node.sqlite'

// open the database - with promised.sqlite API
const db = await open(':memory:');
// open the database - with the new AsyncDatabase API
const db = await AsyncDatabase.open(':memory');

const languages = ['C++', 'Python', 'Java', 'C#', 'Go', 'C']

// construct the insert statement with multiple placehoders
// based on the number of rows
const placeholders = languages.map(lan => '(?)').join(',')
const sqlInsert = 'INSERT INTO langs(name) VALUES ' + placeholders

// update statement
const data = ['Ansi C', 'C']
const sqlUpdate = `UPDATE langs
              SET name = ?
              WHERE name = ?`

// create table
await db.run('CREATE TABLE langs(name text)')

// insert rows
const insertRes = await db.run(sqlInsert, languages)
console.log(`Rows inserted: ${insertRes.changes}`)

// update
const updateRes = await db.run(sqlUpdate, data)
console.log(`Row(s) updated: ${updateRes.changes}`)

// close the database connection
await db.close()
```

### Deleting Data in SQLite Database from a Node.js Application

```js
import {
  open,
  AsyncDatabase
} from 'promised.node.sqlite'

// open the database - with promised.sqlite API
const db = await open(':memory:');
// open the database - with the new AsyncDatabase API
const db = await AsyncDatabase.open(':memory');

const languages = ['C++', 'Python', 'Java', 'C#', 'Go']

// construct the insert statement with multiple placehoders
// based on the number of rows
const placeholders = languages.map(lan => '(?)').join(',')
const sql = 'INSERT INTO langs(name) VALUES ' + placeholders

// create table
await db.run('CREATE TABLE langs(name text)')
const insertRes = await db.run(sql, languages)
console.log(`Rows inserted: ${insertRes.changes}`)

const id = 1
// delete a row based on id
const deleteRes = await db.run(`DELETE FROM langs WHERE rowid=?`, id)
console.log(`Row(s) deleted: ${deleteRes.changes}`)

// close the database connection
await db.close()
```


## API

This package exports a superset of the promised.sqlite API.

That package offered this way of opening an SQLITE3 database:

```js
export const OPEN_READONLY = 1;
export const OPEN_READWRITE = 2;
export const OPEN_CREATE = 3;
export const OPEN_SHAREDCACHE = 4;
export const OPEN_PRIVATECACHE = 5;
export const OPEN_URI = 6;

export function open(filename: string): Promise<AsyncDatabase>
export function open(filename: string, mode: number): Promise<AsyncDatabase>
export function open(filename: string, mode?: number): Promise<AsyncDatabase>
```

The top-level `open` function in promised.sqlite package uses these constants.  Of these, only the `OPEN_READONLY` mode is recognized.  These API elements are present for compatibility with promised.sqlite.

The recommended way of opening an SQLITE3 database is now to call `AsyncDatabase.open` with an _options_ object similar to what's used in the `node:sqlite` DatabaseSync class.  This route, using the DatabaseOptions object, is more powerful than the promised.sqlite API.

```js
export interface DatabaseOptions {
    readOnly?: boolean;
    enableForeignKeyConstraints?: boolean;
    allowExtension?: boolean;
    timeout?: number;
    readBigInts?: boolean;
    returnArrays?: boolean;
    allowBareNamedParameters?: boolean;
    allowUnknownNamedParameters?: boolean;
}
```

These options correspond to the `node:sqlite` options for `new DatabaseSync(path[, options])` ([API DOCS](https://nodejs.org/api/sqlite.html#new-databasesyncpath-options)).

```js
/**
 * A thin wrapper around DatabaseSync that exposes an async API.
 * Compatible with promised-sqlite's AsyncDatabase interface.
 */
export class AsyncDatabase {
  // ...
}
```

The comment says it all, `AsyncDatabase` tries to be equal to the `node:sqlite` class `DatabaseSync` but with an async API.

```js
export class AsyncDatabase {
  // ...
    static async open(
      filename: string,
      options?: DatabaseOptions
  ): Promise<AsyncDatabase> 
  // ...
  async close(): Promise<void>
  // ...
}
```

Calling `AsyncDatabase.open(filename[, options])` instantiates an AsyncDatabase object, while opening the database connection, and is equivalent to the top-level `open` function.  But, by using the `DatabaseOptions` class the caller has more available options.

```js
export class AsyncDatabase {
  // ...
  get inner(): DatabaseSync
  // ...
}
```

The `inner` method returns the underlying DatabaseSync object in case it is required.

The following function signatures correspond to DatabaseSync methods:

```js
export class AsyncDatabase {
  // ...
  async run(sql: string, ...params: unknown[]): Promise<RunResult>
  async get<T = any>(sql: string, ...params: unknown[]): Promise<T | undefined>
  async all<T = any>(sql: string, ...params: unknown[]): Promise<T[]>
  async each<T = any>(
        sql: string,
        ...params: any[],
        callback: (row: T) => void
  ): Promise<number>
  async exec(sql: string): Promise<void>
  async prepare(sql: string, ...params: unknown[]): Promise<AsyncStatement>
  async loadExtension(path: string, entryPoint?: string): Promise<void>
  // ...
}
```

The _params_ argument in these functions support these three modes:

```js
// Directly in the function arguments.
db.run("UPDATE tbl SET name = ? WHERE id = ?", "bar", 2);
// As an array.
db.run("UPDATE tbl SET name = ? WHERE id = ?", [ "bar", 2 ]);
// As an object with named parameters.
db.run("UPDATE tbl SET name = $name WHERE id = $id", {
  $id: 2,
  $name: "bar"
});
```

For the `each` method a little subterfuge is used, because TypeScript does not allow further parameters following a `...param` parameter.

* The last item in `...params` is inspected
* If it is not a `function` then an error is thrown.  The function is assumed to be the callback function.
* The rest of `...params` are taken as the actual parameters.

Under the cover, each AsyncDatabase function generates an AsyncStatement object for execution.  These objects are automatically cached and reused.

As with AsyncDatabase being a thin wrapper over DatabaseSync, there is an AsyncStatement class which is a thin wrapper over StatementSync.

```js
/**
 * A thin wrapper around StatementSync that exposes an async API.
 * Compatible with promised-sqlite's AsyncStatement interface.
 */
export class AsyncStatement {
  // ...
  get inner(): StatementSync
  async bind(...params: unknown[]): Promise<void>
  async reset(): Promise<void>
  async finalize(): Promise<void>
  async run(...params: unknown[]): Promise<RunResult>
  async get<T = any>(...params: unknown[]): Promise<T | undefined>
  async all<T = any>(...params: unknown[]): Promise<T[]>
  async each<T = any>(
        params: any,
        callback: (row: T) => void
  ): Promise<number>
}
```

Except for `each` these directly call the corresponding StatementSync method.

StatementSync does not have an `each` method, but an `iterate` method.  The `AsyncStatement#each` method does a similar subterfuge as described earlier to separate out the callback function, and to throw an error if no callback is supplied.  It then calls `StatementSync#iterate` and runs a `for` loop using the supplied iterator.

## Reference

- [sqlite3 tutorial](https://www.sqlitetutorial.net/sqlite-nodejs/)

## License

The original implementation for promised.sqlite was by bynaki.  In 2026, David Herron rewrote it for node:sqlite, renaming the package to promised.node.sqlite.

Copyright (c) bynaki. All rights reserved.
Copyright (c) 2026 David Herron. All rights reserved.

Licensed under the MIT License.
