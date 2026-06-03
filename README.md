# Promised node:sqlite

## Introduction
You can use async/await for node:sqlite.

This package is a fork of [promised.sqlite](https://www.npmjs.com/package/promised.sqlite).  Rationale:

* The [sqlite3](https://www.npmjs.com/package/sqlite3) package has been marked DEPRECATED and UNMAINTAINED
* The Node.js platform now has built-in [node:sqlite](https://nodejs.org/api/sqlite.html) which is just as synchronous as the old sqlite3 package
* Some people will want to use asynchronous functions on top of node:sqlite

Simple.. fork `promised.sqlite` to use `node:sqlite`.

## Install
```shell
> npm install promised.node.sqlite
```

## Usage

### In memory based database
```js
import {
  open,
} from 'promised.node.sqlite'

// open the database
const db = await open(':memory:')
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
} from 'promised.node.sqlite'

// open the database
const db = await open('./assets/chinook.db', OPEN_READWRITE)
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
} from 'promised.node.sqlite'

const sql = `SELECT DISTINCT Name name FROM playlists
              ORDER BY name`

// open the database
const db = await open('./assets/chinook.db')

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
} from 'promised.node.sqlite'

// open the database
const db = await open('./assets/chinook.db')
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
} from 'promised.node.sqlite'

// open the database
const db = await open('./assets/chinook.db')
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
} from 'promised.node.sqlite'

const db = await open(':memory:')

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
} from 'promised.node.sqlite'

// open the database connection
const db = await open(':memory:')
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
} from 'promised.node.sqlite'

// open the database connection
const db = await open(':memory:')
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
} from 'promised.node.sqlite'

// open the database connection
const db = await open(':memory:')
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

## Reference

- [sqlite3 tutorial](https://www.sqlitetutorial.net/sqlite-nodejs/)

## License

Copyright (c) bynaki. All rights reserved.

Licensed under the MIT License.
