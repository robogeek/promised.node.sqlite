import { test, before, after } from 'node:test'
import assert from 'node:assert'
import { copyFileSync, unlinkSync, existsSync, chmodSync } from 'node:fs'
import {
  open,
  OPEN_READWRITE,
  OPEN_READONLY,
  AsyncDatabase
} from '../src/index.js'

// Database fixture paths
const ORIG_DB = './assets/chinook-orig.db'
const TEST_DB = './assets/chinook.db'

// Setup: Copy pristine database before tests run
before(() => {
  copyFileSync(ORIG_DB, TEST_DB)
  // Ensure the copy is writable (copyFileSync preserves readonly permissions)
  chmodSync(TEST_DB, 0o644)
})

// Cleanup: Remove test database after tests complete
after(() => {
  if (existsSync(TEST_DB)) {
    unlinkSync(TEST_DB)
  }
})

/**
 * in memory based database
 */
test('in memory based database', async () => {
  // open the database
  const db = await open(':memory:')
  // console.log('Connected to the in-memory SQlite database.');
  // close the database connection
  await db.close()
  // console.log('Close the database connection.');
});

/**
 * in memory based database
 */
test('in memory based database - AsyncDatabase.open', async () => {
  // open the database
  const db = await AsyncDatabase.open(':memory:');
  // console.log('Connected to the in-memory SQlite database.');
  // close the database connection
  await db.close()
  // console.log('Close the database connection.');
});

/**
 * disk file based database
 */
test('disk file as database', async () => {
  // open the database
  const db = await open('./assets/chinook.db', OPEN_READWRITE)
  // console.log('Connected to the database.');
  const row = await db.get(`SELECT PlaylistId as id,
                            Name as name
                            FROM playlists`)
  // console.log(row.id + '\t' + row.name);
  assert.strictEqual(row.id, 1)
  assert.strictEqual(row.name, 'Music')
  await db.close()
  // console.log('Close the database connection');
});

/**
 * disk file based database
 */
test('disk file as database - AsyncDatabase.open', async () => {
  // open the database
  const db = await AsyncDatabase.open('./assets/chinook.db', {
  });
  // console.log('Connected to the database.');
  const row = await db.get(`SELECT PlaylistId as id,
                            Name as name
                            FROM playlists`)
  // console.log(row.id + '\t' + row.name);
  assert.strictEqual(row.id, 1)
  assert.strictEqual(row.name, 'Music')
  await db.close()
  // console.log('Close the database connection');
})

/**
 * Querying all rows with all() method
 */
test('Querying all rows with all() method -- AsyncDatabase.open', async () => {
  const sql = `SELECT DISTINCT Name name FROM playlists
               ORDER BY name`;
  const db = await AsyncDatabase.open('./assets/chinook.db', {
  });
  const rows = await db.all(sql);
  await db.close();
  const retrieved: string[] = [];
  rows.forEach(row => {
    // console.log(row.name);
    retrieved.push(row.name);
  })
  const comparisons = [
    '90\u2019s Music',
    'Audiobooks',
    'Brazilian Music',
    'Classical',
    'Classical 101 - Deep Cuts',
    'Classical 101 - Next Steps',
    'Classical 101 - The Basics',
    'Grunge',
    'Heavy Metal Classic',
    'Movies',
    'Music',
    'Music Videos',
    // 'On-for-Go 1',
    'On-The-Go 1',
    'TV Shows',
  ];
  assert.deepStrictEqual(retrieved, comparisons);
});

/**
 * Querying all rows with all() method
 */
test('Querying all rows with all() method -- open', async () => {
  const sql = `SELECT DISTINCT Name name FROM playlists
               ORDER BY name`;
  const db = await open('./assets/chinook.db');
  const rows = await db.all(sql);
  rows.forEach(row => {
    // console.log(row.name);
  });
  const comparisons = [
    '90\u2019s Music',
    'Audiobooks',
    'Brazilian Music',
    'Classical',
    'Classical 101 - Deep Cuts',
    'Classical 101 - Next Steps',
    'Classical 101 - The Basics',
    'Grunge',
    'Heavy Metal Classic',
    'Movies',
    'Music',
    'Music Videos',
    'On-The-Go 1',
    'TV Shows',
  ];
  assert.deepStrictEqual(rows.map(row => row.name), comparisons);
  await db.close();
});

/**
 * Query the first row in the result set
 */
test('Query the first row in the result set', async () => {
  // open the database
  const db = await open('./assets/chinook.db')
  const sql = `SELECT PlaylistID id,
                    Name name
               FROM playlists
               WHERE PlaylistId = ?`
  const playlistId = 1
  // first row only
  const row = await db.get(sql, playlistId)
  // row
  // ? console.log(row.id, row.name)
  // : console.log(`No playlist found with the id ${playlistId}`)
  assert.strictEqual(row.id, 1)
  assert.strictEqual(row.name, 'Music')
  // close the database connection
  await db.close()
});

/**
 * Query the first row in the result set
 */
test('Query the first row in the result set -- AsyncDatabase.open', async () => {
  // open the database
  const db = await AsyncDatabase.open('./assets/chinook.db', {
  });
  const sql = `SELECT PlaylistID id,
                    Name name
               FROM playlists
               WHERE PlaylistId = ?`
  const playlistId = 1
  // first row only
  const row = await db.get(sql, playlistId);
  await db.close();
  // row
  // ? console.log(row.id, row.name)
  // : console.log(`No playlist found with the id ${playlistId}`)
  assert.strictEqual(row.id, 1)
  assert.strictEqual(row.name, 'Music')
  // close the database connection
})

/**
 * for await ... of
 */
test('for await ... of', async () => {
  const asyncIterable = () => 
  {
    return {
      [Symbol.asyncIterator]() {
        return {
          i: 0,
          next() {
            if(this.i < 3) {
              return Promise.resolve({value: this.i++, done: false})
            }
            return Promise.resolve({value: null, done: true})
          }
        }
      }
    }
  }
  for await (let num of asyncIterable()) {
    // console.log(num);
  }
})

/**
 * Query rows with each() method
 */
test('Query rows with each() method', async () => {
  // open the database
  const db = await open('./assets/chinook.db')
  const sql = `SELECT FirstName firstName,
                    LastName lastName,
                    Email email
               FROM customers
               WHERE Country = ?
               ORDER BY FirstName`
  const rows: string[] = []
  const count = await db.each(sql, 'USA', (row: any) => {
    const r = `${row.firstName} ${row.lastName} - ${row.email}`;
    // console.log(r);
    rows.push(r);
  });
  const comparisons = [
    'Dan Miller - dmiller@comcast.com',
    'Frank Harris - fharris@google.com',
    'Frank Ralston - fralston@gmail.com',
    'Heather Leacock - hleacock@gmail.com',
    'Jack Smith - jacksmith@microsoft.com',
    'John Gordon - johngordon22@yahoo.com',
    'Julia Barnett - jubarnett@gmail.com',
    'Kathy Chase - kachase@hotmail.com',
    'Michelle Brooks - michelleb@aol.com',
    'Patrick Gray - patrick.gray@aol.com',
    'Richard Cunningham - ricunningham@hotmail.com',
    'Tim Goyer - tgoyer@apple.com',
    'Victor Stevens - vstevens@yahoo.com',
  ]
  assert.deepStrictEqual(rows, comparisons)
  await db.close()
})

/**
 * Query rows with each() method
 */
test('Query rows with each() method -- AsyncDatabase.open', async () => {
  // open the database
  const db = await AsyncDatabase.open('./assets/chinook.db', {
  });
  const sql = `SELECT FirstName firstName,
                    LastName lastName,
                    Email email
               FROM customers
               WHERE Country = ?
               ORDER BY FirstName`
  const rows: string[] = []
  const count = await db.each(sql, 'USA', (row: any) => {
    const r = `${row.firstName} ${row.lastName} - ${row.email}`;
    // console.log(r);
    rows.push(r);
  });
  const comparisons = [
    'Dan Miller - dmiller@comcast.com',
    'Frank Harris - fharris@google.com',
    'Frank Ralston - fralston@gmail.com',
    'Heather Leacock - hleacock@gmail.com',
    'Jack Smith - jacksmith@microsoft.com',
    'John Gordon - johngordon22@yahoo.com',
    'Julia Barnett - jubarnett@gmail.com',
    'Kathy Chase - kachase@hotmail.com',
    'Michelle Brooks - michelleb@aol.com',
    'Patrick Gray - patrick.gray@aol.com',
    'Richard Cunningham - ricunningham@hotmail.com',
    'Tim Goyer - tgoyer@apple.com',
    'Victor Stevens - vstevens@yahoo.com',
  ]
  assert.deepStrictEqual(rows, comparisons)
  await db.close()
});

/**
 * Verify that errors in each() method are reported to the caller
 */
test('Catch error in each() method callback', async () => {
  // open the database
  const db = await AsyncDatabase.open('./assets/chinook.db', {
  });
  const sql = `SELECT FirstName firstName,
                    LastName lastName,
                    Email email
               FROM customers
               WHERE Country = ?
               ORDER BY FirstName`
  const rows: string[] = []
  let count = -1;
  let sawError = false;
  try {
    count = await db.each(sql, 'USA', (row: any) => {
      throw new Error('PRETEND SOMETHING FAILED');
    });
  } catch (e: any) {
    assert.strictEqual(e.message, 'PRETEND SOMETHING FAILED');
    sawError = true;
  }
  assert.strictEqual(sawError, true);
  await db.close()
});

// Tests for db.run with a single value in the params

test('Use db.run with single integer in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE invoice_items SET Quantity = ?
      WHERE InvoiceId = 1
      `, 20);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with single integer array in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE invoice_items SET Quantity = ?
      WHERE InvoiceId = 1
      `, [ 20 ]);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with single integer object in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE invoice_items SET Quantity = $quantity
      WHERE InvoiceId = 1
      `, {
        $quantity: 20
      });
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with single float item in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run('UPDATE tracks SET UnitPrice = ?', 1.99);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with single float array in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run('UPDATE tracks SET UnitPrice = ?', [ 1.99 ]);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with single float object in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run('UPDATE tracks SET UnitPrice = $unitPrice', {
      $unitPrice: 1.99
    });
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with single string in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE media_types SET Name = ?
      WHERE MediaTypeId = 1
    `, 'New Name');
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with single string array in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE media_types SET Name = ?
      WHERE MediaTypeId = 1
    `, [ 'New Name' ]);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with single string object in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE media_types SET Name = $name
      WHERE MediaTypeId = 1
    `, {
      $name: 'New Name'
    });
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

// Tests for db.run with two values in the params

test('Use db.run with two integer values items in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE invoice_items SET Quantity = ?
      WHERE InvoiceId = ?
      `, 20, 1);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with two integer values in array in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE invoice_items SET Quantity = ?
      WHERE InvoiceId = ?
      `, [ 20, 1 ]);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with two integer values in object in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE invoice_items SET Quantity = $quantity
      WHERE InvoiceId = $invoiceId
      `, {
        $quantity: 20,
        $invoiceId: 1
      });
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with two float/integer items in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run('UPDATE tracks SET UnitPrice = ?, AlbumId = ? WHERE TrackId = 23', 1.99, 20);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with two float integer array  in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run('UPDATE tracks SET UnitPrice = ?, AlbumId = ? WHERE TrackId = 24', [ 1.99, 20 ]);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with two float integer object  in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run('UPDATE tracks SET UnitPrice = $unitPrice, AlbumId = $albumId WHERE TrackId = 25', {
      $unitPrice: 1.99,
      $albumId: 20
    });
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with two string integer items in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE media_types SET Name = ?
      WHERE MediaTypeId = ?
    `, 'New Name', 20);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with two string integer items in array in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE media_types SET Name = ?
      WHERE MediaTypeId = ?
    `, [ 'New Name', 20 ]);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

test('Use db.run with two string integer items in object in params', async () => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run(`
      UPDATE media_types SET Name = $name
      WHERE MediaTypeId = $mediaTypeId
    `, {
      $name: 'New Name',
      $mediaTypeId: 20
    });
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  assert.strictEqual(sawError, false);
  await db.close()

});

/**
 * Insert on row into a table
 */
test('Insert one row into a table', async () => {
  const db = await open(':memory:')
  // insert one row into the langs table
  await db.run('CREATE TABLE langs(name text)')
  const res = await db.run(`INSERT INTO langs(name) VALUES(?)`, 'C')
  // get the last insert id
  // console.log(`A row has been inserted with rowid ${res.lastInsertRowid}`)
  assert.strictEqual(res.lastInsertRowid, 1)
  // close the database connection
  await db.close()
})

/**
 * Insert on row into a table
 */
test('Insert one row into a table -- AsyncDatabase.open', async () => {
  const db = await AsyncDatabase.open(':memory:');
  // insert one row into the langs table
  await db.run('CREATE TABLE langs(name text)')
  const res = await db.run(`INSERT INTO langs(name) VALUES(?)`, 'C')
  // get the last insert id
  // console.log(`A row has been inserted with rowid ${res.lastInsertRowid}`)
  assert.strictEqual(res.lastInsertRowid, 1)
  // close the database connection
  await db.close()
})

/**
 * Insert multiple rows into a table at a time
 */
test('Insert multiple rows into a table at a time', async () => {
  // open the database connection
  const db = await AsyncDatabase.open(':memory:');
  const languages = ['C++', 'Python', 'Java', 'C#', 'Go']
  // construct the insert statement with multiple placehoders
  // based on the number of rows
  const placeholders = languages.map(lan => '(?)').join(',')
  const sql = 'INSERT INTO langs(name) VALUES ' + placeholders;
  // output the INSERT statement
  // console.log(sql);
  await db.run('CREATE TABLE langs(name text)')
  const res = await db.run(sql, languages)
  // console.log(`Rows inserted ${res.changes}`);
  assert.strictEqual(res.changes, 5)
  // close the database connection
  db.close()
})

/**
 * Insert multiple rows into a table at a time
 */
test('Insert multiple rows into a table at a time -- AsyncDatabase.open', async () => {
  // open the database connection
  const db = await AsyncDatabase.open(':memory:');
  const languages = ['C++', 'Python', 'Java', 'C#', 'Go']
  // construct the insert statement with multiple placehoders
  // based on the number of rows
  const placeholders = languages.map(lan => '(?)').join(',')
  const sql = 'INSERT INTO langs(name) VALUES ' + placeholders
  // output the INSERT statement
  // console.log(sql);
  await db.run('CREATE TABLE langs(name text)')
  const res = await db.run(sql, ...languages)
  // console.log(`Rows inserted ${res.changes}`);
  assert.strictEqual(res.changes, 5)
  // close the database connection
  db.close()
})

/**
 * Updating Data in SQLite Database from a Node.js Application
 */
test('Updating Data in SQLite Database from a Node.js Application', async () => {
  // open the database connection
  const db = await open(':memory:');
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
  // console.log(`Rows inserted: ${insertRes.changes}`);
  assert.strictEqual(insertRes.changes, 6)
  // update
  const updateRes = await db.run(sqlUpdate, data)
  // console.log(`Row(s) updated: ${updateRes.changes}`);
  assert.strictEqual(updateRes.changes, 1)
  // close the database connection
  await db.close()
})

/**
 * Updating Data in SQLite Database from a Node.js Application
 */
test('Updating Data in SQLite Database from a Node.js Application -- AsyncDatabase.open', async () => {
  // open the database connection
  const db = await AsyncDatabase.open(':memory:');
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
  // console.log(`Rows inserted: ${insertRes.changes}`);
  assert.strictEqual(insertRes.changes, 6)
  // update
  const updateRes = await db.run(sqlUpdate, data)
  // console.log(`Row(s) updated: ${updateRes.changes}`);
  assert.strictEqual(updateRes.changes, 1)
  // close the database connection
  await db.close()
})

/**
 * Deleting Data in SQLite Database from a Node.js Application
 */
test('Deleting Data in SQLite Database from a Node.js Application', async () => {
  // open the database connection
  const db = await AsyncDatabase.open(':memory:');
  const languages = ['C++', 'Python', 'Java', 'C#', 'Go']
  // construct the insert statement with multiple placehoders
  // based on the number of rows
  const placeholders = languages.map(lan => '(?)').join(',')
  const sql = 'INSERT INTO langs(name) VALUES ' + placeholders
  // create table
  await db.run('CREATE TABLE langs(name text)')
  const insertRes = await db.run(sql, languages)
  // console.log(`Rows inserted: ${insertRes.changes}`);
  assert.strictEqual(insertRes.changes, 5)
  const id = 1
  // delete a row based on id
  const deleteRes = await db.run(`DELETE FROM langs WHERE rowid=?`, id)
  // console.log(`Row(s) deleted: ${deleteRes.changes}`);
  assert.strictEqual(deleteRes.changes, 1)
  // close the database connection
  await db.close()
});

/**
 * Deleting Data in SQLite Database from a Node.js Application
 */
test('Deleting Data in SQLite Database from a Node.js Application -- AsyncDatabase.open', async () => {
  // open the database connection
  const db = await AsyncDatabase.open(':memory:');
  const languages = ['C++', 'Python', 'Java', 'C#', 'Go']
  // construct the insert statement with multiple placehoders
  // based on the number of rows
  const placeholders = languages.map(lan => '(?)').join(',')
  const sql = 'INSERT INTO langs(name) VALUES ' + placeholders
  // create table
  await db.run('CREATE TABLE langs(name text)')
  const insertRes = await db.run(sql, languages)
  // console.log(`Rows inserted: ${insertRes.changes}`);
  assert.strictEqual(insertRes.changes, 5)
  const id = 1
  // delete a row based on id
  const deleteRes = await db.run(`DELETE FROM langs WHERE rowid=?`, id)
  // console.log(`Row(s) deleted: ${deleteRes.changes}`);
  assert.strictEqual(deleteRes.changes, 1)
  // close the database connection
  await db.close()
})


/**
 * disk file based database
 */
test('disk file based database', async () => {
  // open the database
  const db = await open('./assets/chinook.db', OPEN_READWRITE)
  // console.log('Connected to the database.');
  const row = await db.get(`SELECT PlaylistId as id,
                            Name as name
                            FROM playlists`)
  // console.log(row.id + '\t' + row.name);
  assert.strictEqual(row.id, 1)
  assert.strictEqual(row.name, 'Music')
  await db.close()
  // console.log('Close the database connection');
})

// Tests for db.get with different parameter styles

test('Use db.get with single integer value in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const row = await db.get(`
    SELECT PlaylistId as id, Name as name
    FROM playlists
    WHERE PlaylistId = ?
  `, 1);
  assert.strictEqual(row.id, 1);
  assert.strictEqual(row.name, 'Music');
  await db.close();
});

test('Use db.get with single integer in array in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const row = await db.get(`
    SELECT PlaylistId as id, Name as name
    FROM playlists
    WHERE PlaylistId = ?
  `, [1]);
  assert.strictEqual(row.id, 1);
  assert.strictEqual(row.name, 'Music');
  await db.close();
});

test('Use db.get with single integer in object in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const row = await db.get(`
    SELECT PlaylistId as id, Name as name
    FROM playlists
    WHERE PlaylistId = $id
  `, { $id: 1 });
  assert.strictEqual(row.id, 1);
  assert.strictEqual(row.name, 'Music');
  await db.close();
});

test('Use db.get with single string value in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const row = await db.get(`
    SELECT PlaylistId as id, Name as name
    FROM playlists
    WHERE Name = ?
  `, 'Music');
  assert.strictEqual(row.id, 1);
  assert.strictEqual(row.name, 'Music');
  await db.close();
});

test('Use db.get with single string in array in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const row = await db.get(`
    SELECT PlaylistId as id, Name as name
    FROM playlists
    WHERE Name = ?
  `, ['Music']);
  assert.strictEqual(row.id, 1);
  assert.strictEqual(row.name, 'Music');
  await db.close();
});

test('Use db.get with single string in object in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const row = await db.get(`
    SELECT PlaylistId as id, Name as name
    FROM playlists
    WHERE Name = $name
  `, { $name: 'Music' });
  assert.strictEqual(row.id, 1);
  assert.strictEqual(row.name, 'Music');
  await db.close();
});

test('Use db.get with two values as separate params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const row = await db.get(`
    SELECT CustomerId as id, FirstName, LastName
    FROM customers
    WHERE Country = ? AND City = ?
  `, 'USA', 'Boston');
  assert.strictEqual(row.FirstName, 'John');
  assert.strictEqual(row.LastName, 'Gordon');
  await db.close();
});

test('Use db.get with two values in array in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const row = await db.get(`
    SELECT CustomerId as id, FirstName, LastName
    FROM customers
    WHERE Country = ? AND City = ?
  `, ['USA', 'Boston']);
  assert.strictEqual(row.FirstName, 'John');
  assert.strictEqual(row.LastName, 'Gordon');
  await db.close();
});

test('Use db.get with two values in object in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const row = await db.get(`
    SELECT CustomerId as id, FirstName, LastName
    FROM customers
    WHERE Country = $country AND City = $city
  `, { $country: 'USA', $city: 'Boston' });
  assert.strictEqual(row.FirstName, 'John');
  assert.strictEqual(row.LastName, 'Gordon');
  await db.close();
});

// Tests for db.all with different parameter styles

test('Use db.all with single integer value in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const rows = await db.all(`
    SELECT TrackId, Name
    FROM tracks
    WHERE AlbumId = ?
    ORDER BY TrackId
    LIMIT 3
  `, 3);
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0].Name, 'Fast As a Shark');
  await db.close();
});

test('Use db.all with single integer in array in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const rows = await db.all(`
    SELECT TrackId, Name
    FROM tracks
    WHERE AlbumId = ?
    ORDER BY TrackId
    LIMIT 3
  `, [3]);
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0].Name, 'Fast As a Shark');
  await db.close();
});

test('Use db.all with single integer in object in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const rows = await db.all(`
    SELECT TrackId, Name
    FROM tracks
    WHERE AlbumId = $albumId
    ORDER BY TrackId
    LIMIT 3
  `, { $albumId: 3 });
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0].Name, 'Fast As a Shark');
  await db.close();
});

test('Use db.all with single string value in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const rows = await db.all(`
    SELECT CustomerId, FirstName, LastName
    FROM customers
    WHERE Country = ?
    ORDER BY CustomerId
    LIMIT 3
  `, 'USA');
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0].FirstName, 'Frank');
  await db.close();
});

test('Use db.all with single string in array in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const rows = await db.all(`
    SELECT CustomerId, FirstName, LastName
    FROM customers
    WHERE Country = ?
    ORDER BY CustomerId
    LIMIT 3
  `, ['USA']);
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0].FirstName, 'Frank');
  await db.close();
});

test('Use db.all with single string in object in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const rows = await db.all(`
    SELECT CustomerId, FirstName, LastName
    FROM customers
    WHERE Country = $country
    ORDER BY CustomerId
    LIMIT 3
  `, { $country: 'USA' });
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0].FirstName, 'Frank');
  await db.close();
});

test('Use db.all with two values as separate params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const rows = await db.all(`
    SELECT CustomerId, FirstName, LastName
    FROM customers
    WHERE Country = ? AND State = ?
    ORDER BY CustomerId
  `, 'USA', 'CA');
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0].FirstName, 'Frank');
  await db.close();
});

test('Use db.all with two values in array in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const rows = await db.all(`
    SELECT CustomerId, FirstName, LastName
    FROM customers
    WHERE Country = ? AND State = ?
    ORDER BY CustomerId
  `, ['USA', 'CA']);
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0].FirstName, 'Frank');
  await db.close();
});

test('Use db.all with two values in object in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const rows = await db.all(`
    SELECT CustomerId, FirstName, LastName
    FROM customers
    WHERE Country = $country AND State = $state
    ORDER BY CustomerId
  `, { $country: 'USA', $state: 'CA' });
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0].FirstName, 'Frank');
  await db.close();
});

// Tests for db.each with different parameter styles

test('Use db.each with single integer value in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const names: string[] = [];
  const count = await db.each(`
    SELECT TrackId, Name
    FROM tracks
    WHERE AlbumId = ?
    ORDER BY TrackId
    LIMIT 3
  `, 3, (row: any) => {
    names.push(row.Name);
  });
  assert.strictEqual(count, 3);
  assert.strictEqual(names[0], 'Fast As a Shark');
  await db.close();
});

test('Use db.each with single integer in array in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const names: string[] = [];
  const count = await db.each(`
    SELECT TrackId, Name
    FROM tracks
    WHERE AlbumId = ?
    ORDER BY TrackId
    LIMIT 3
  `, [3], (row: any) => {
    names.push(row.Name);
  });
  assert.strictEqual(count, 3);
  assert.strictEqual(names[0], 'Fast As a Shark');
  await db.close();
});

test('Use db.each with single integer in object in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const names: string[] = [];
  const count = await db.each(`
    SELECT TrackId, Name
    FROM tracks
    WHERE AlbumId = $albumId
    ORDER BY TrackId
    LIMIT 3
  `, { $albumId: 3 }, (row: any) => {
    names.push(row.Name);
  });
  assert.strictEqual(count, 3);
  assert.strictEqual(names[0], 'Fast As a Shark');
  await db.close();
});

test('Use db.each with single string value in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const names: string[] = [];
  const count = await db.each(`
    SELECT CustomerId, FirstName
    FROM customers
    WHERE Country = ?
    ORDER BY CustomerId
    LIMIT 3
  `, 'USA', (row: any) => {
    names.push(row.FirstName);
  });
  assert.strictEqual(count, 3);
  assert.strictEqual(names[0], 'Frank');
  await db.close();
});

test('Use db.each with single string in array in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const names: string[] = [];
  const count = await db.each(`
    SELECT CustomerId, FirstName
    FROM customers
    WHERE Country = ?
    ORDER BY CustomerId
    LIMIT 3
  `, ['USA'], (row: any) => {
    names.push(row.FirstName);
  });
  assert.strictEqual(count, 3);
  assert.strictEqual(names[0], 'Frank');
  await db.close();
});

test('Use db.each with single string in object in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const names: string[] = [];
  const count = await db.each(`
    SELECT CustomerId, FirstName
    FROM customers
    WHERE Country = $country
    ORDER BY CustomerId
    LIMIT 3
  `, { $country: 'USA' }, (row: any) => {
    names.push(row.FirstName);
  });
  assert.strictEqual(count, 3);
  assert.strictEqual(names[0], 'Frank');
  await db.close();
});

test('Use db.each with two values as separate params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const names: string[] = [];
  const count = await db.each(`
    SELECT CustomerId, FirstName
    FROM customers
    WHERE Country = ? AND State = ?
    ORDER BY CustomerId
  `, 'USA', 'CA', (row: any) => {
    names.push(row.FirstName);
  });
  assert.strictEqual(count, 3);
  assert.strictEqual(names[0], 'Frank');
  await db.close();
});

test('Use db.each with two values in array in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const names: string[] = [];
  const count = await db.each(`
    SELECT CustomerId, FirstName
    FROM customers
    WHERE Country = ? AND State = ?
    ORDER BY CustomerId
  `, ['USA', 'CA'], (row: any) => {
    names.push(row.FirstName);
  });
  assert.strictEqual(count, 3);
  assert.strictEqual(names[0], 'Frank');
  await db.close();
});

test('Use db.each with two values in object in params', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  const names: string[] = [];
  const count = await db.each(`
    SELECT CustomerId, FirstName
    FROM customers
    WHERE Country = $country AND State = $state
    ORDER BY CustomerId
  `, { $country: 'USA', $state: 'CA' }, (row: any) => {
    names.push(row.FirstName);
  });
  assert.strictEqual(count, 3);
  assert.strictEqual(names[0], 'Frank');
  await db.close();
});

// Tests for SQL statement validation

test('db.run should throw error when SQL is empty string', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.run(''),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

test('db.run should throw error when SQL is null', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.run(null as any),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

test('db.run should throw error when SQL is undefined', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.run(undefined as any),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

test('db.get should throw error when SQL is empty string', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.get(''),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

test('db.get should throw error when SQL is null', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.get(null as any),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

test('db.get should throw error when SQL is undefined', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.get(undefined as any),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

test('db.all should throw error when SQL is empty string', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.all(''),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

test('db.all should throw error when SQL is null', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.all(null as any),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

test('db.all should throw error when SQL is undefined', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.all(undefined as any),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

test('db.each should throw error when SQL is empty string', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.each('', (row: any) => {}),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

test('db.each should throw error when SQL is null', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.each(null as any, (row: any) => {}),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

test('db.each should throw error when SQL is undefined', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.each(undefined as any, (row: any) => {}),
    {
      name: 'Error',
      message: 'SQL statement is required'
    }
  );
  await db.close();
});

// Tests for SQL syntax errors

test('db.run should throw error for SQL syntax error', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.run('SELCT * FROM customers'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR'
    }
  );
  await db.close();
});

test('db.run should throw error for malformed SQL', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.run('SELECT * FORM customers'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /syntax error/
    }
  );
  await db.close();
});

test('db.get should throw error for SQL syntax error', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.get('SELCT * FROM customers'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR'
    }
  );
  await db.close();
});

test('db.get should throw error for malformed SQL', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.get('SELECT * FORM customers'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /syntax error/
    }
  );
  await db.close();
});

test('db.all should throw error for SQL syntax error', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.all('SELCT * FROM customers'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR'
    }
  );
  await db.close();
});

test('db.all should throw error for malformed SQL', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.all('SELECT * FORM customers'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /syntax error/
    }
  );
  await db.close();
});

test('db.each should throw error for SQL syntax error', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.each('SELCT * FROM customers', (row: any) => {}),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR'
    }
  );
  await db.close();
});

test('db.each should throw error for malformed SQL', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.each('SELECT * FORM customers', (row: any) => {}),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /syntax error/
    }
  );
  await db.close();
});

// Tests for invalid table references

test('db.run should throw error for nonexistent table', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.run('SELECT * FROM nonexistent_table'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such table/
    }
  );
  await db.close();
});

test('db.run should throw error when inserting into nonexistent table', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.run('INSERT INTO fake_table (id, name) VALUES (1, "test")'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such table/
    }
  );
  await db.close();
});

test('db.get should throw error for nonexistent table', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.get('SELECT * FROM nonexistent_table'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such table/
    }
  );
  await db.close();
});

test('db.all should throw error for nonexistent table', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.all('SELECT * FROM nonexistent_table'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such table/
    }
  );
  await db.close();
});

test('db.each should throw error for nonexistent table', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.each('SELECT * FROM nonexistent_table', (row: any) => {}),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such table/
    }
  );
  await db.close();
});

// Tests for invalid column references

test('db.run should throw error for nonexistent column in SELECT', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.run('SELECT nonexistent_column FROM customers'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such column/
    }
  );
  await db.close();
});

test('db.run should throw error for nonexistent column in UPDATE', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.run('UPDATE customers SET nonexistent_column = "test" WHERE CustomerId = 1'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such column/
    }
  );
  await db.close();
});

test('db.run should throw error for nonexistent column in WHERE clause', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.run('UPDATE customers SET FirstName = "test" WHERE nonexistent_column = 1'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such column/
    }
  );
  await db.close();
});

test('db.get should throw error for nonexistent column', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.get('SELECT nonexistent_column FROM customers'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such column/
    }
  );
  await db.close();
});

test('db.get should throw error for nonexistent column in WHERE clause', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.get('SELECT FirstName FROM customers WHERE nonexistent_column = 1'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such column/
    }
  );
  await db.close();
});

test('db.all should throw error for nonexistent column', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.all('SELECT nonexistent_column FROM customers'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such column/
    }
  );
  await db.close();
});

test('db.all should throw error for nonexistent column in WHERE clause', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.all('SELECT FirstName FROM customers WHERE nonexistent_column = 1'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such column/
    }
  );
  await db.close();
});

test('db.each should throw error for nonexistent column', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.each('SELECT nonexistent_column FROM customers', (row: any) => {}),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such column/
    }
  );
  await db.close();
});

test('db.each should throw error for nonexistent column in WHERE clause', async () => {
  const db = await AsyncDatabase.open('./assets/chinook.db');
  await assert.rejects(
    async () => await db.each('SELECT FirstName FROM customers WHERE nonexistent_column = 1', (row: any) => {}),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /no such column/
    }
  );
  await db.close();
});

// Tests for database file opening behavior

test('open() should auto-create database file if it does not exist', async () => {
  const testFile = './test-autocreate.db';
  const { existsSync, unlinkSync } = await import('node:fs');
  
  // Ensure file doesn't exist
  if (existsSync(testFile)) {
    unlinkSync(testFile);
  }
  
  assert.strictEqual(existsSync(testFile), false, 'File should not exist before test');
  
  const db = await open(testFile);
  assert.strictEqual(existsSync(testFile), true, 'File should be created after opening');
  
  await db.close();
  
  // Cleanup
  unlinkSync(testFile);
});

test('AsyncDatabase.open() should auto-create database file if it does not exist', async () => {
  const testFile = './test-asyncdb-autocreate.db';
  const { existsSync, unlinkSync } = await import('node:fs');
  
  // Ensure file doesn't exist
  if (existsSync(testFile)) {
    unlinkSync(testFile);
  }
  
  assert.strictEqual(existsSync(testFile), false, 'File should not exist before test');
  
  const db = await AsyncDatabase.open(testFile);
  assert.strictEqual(existsSync(testFile), true, 'File should be created after opening');
  
  await db.close();
  
  // Cleanup
  unlinkSync(testFile);
});

test('open() with OPEN_READONLY should fail if file does not exist', async () => {
  const testFile = './test-readonly-nonexistent.db';
  const { existsSync, unlinkSync } = await import('node:fs');
  
  // Ensure file doesn't exist
  if (existsSync(testFile)) {
    unlinkSync(testFile);
  }
  
  assert.strictEqual(existsSync(testFile), false, 'File should not exist before test');
  
  await assert.rejects(
    async () => await open(testFile, OPEN_READONLY),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /unable to open database file/
    }
  );
  
  assert.strictEqual(existsSync(testFile), false, 'File should not be created after failed open');
});

test('AsyncDatabase.open() with readOnly option should fail if file does not exist', async () => {
  const testFile = './test-asyncdb-readonly-nonexistent.db';
  const { existsSync, unlinkSync } = await import('node:fs');
  
  // Ensure file doesn't exist
  if (existsSync(testFile)) {
    unlinkSync(testFile);
  }
  
  assert.strictEqual(existsSync(testFile), false, 'File should not exist before test');
  
  await assert.rejects(
    async () => await AsyncDatabase.open(testFile, { readOnly: true }),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /unable to open database file/
    }
  );
  
  assert.strictEqual(existsSync(testFile), false, 'File should not be created after failed open');
});

test('open() with OPEN_READONLY should succeed if file exists', async () => {
  const testFile = './test-readonly-exists.db';
  const { existsSync, unlinkSync } = await import('node:fs');
  
  // Create the file first
  const createDb = await open(testFile);
  await createDb.run('CREATE TABLE test (id INTEGER)');
  await createDb.close();
  
  assert.strictEqual(existsSync(testFile), true, 'File should exist');
  
  // Now open in readonly mode
  const db = await open(testFile, OPEN_READONLY);
  
  // Should be able to read
  const rows = await db.all('SELECT * FROM test');
  assert.strictEqual(Array.isArray(rows), true);
  
  // Should NOT be able to write (this will throw an error)
  await assert.rejects(
    async () => await db.run('INSERT INTO test (id) VALUES (1)'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /attempt to write a readonly database/
    }
  );
  
  await db.close();
  
  // Cleanup
  unlinkSync(testFile);
});

test('AsyncDatabase.open() with readOnly should succeed if file exists', async () => {
  const testFile = './test-asyncdb-readonly-exists.db';
  const { existsSync, unlinkSync } = await import('node:fs');
  
  // Create the file first
  const createDb = await AsyncDatabase.open(testFile);
  await createDb.run('CREATE TABLE test (id INTEGER)');
  await createDb.close();
  
  assert.strictEqual(existsSync(testFile), true, 'File should exist');
  
  // Now open in readonly mode
  const db = await AsyncDatabase.open(testFile, { readOnly: true });
  
  // Should be able to read
  const rows = await db.all('SELECT * FROM test');
  assert.strictEqual(Array.isArray(rows), true);
  
  // Should NOT be able to write
  await assert.rejects(
    async () => await db.run('INSERT INTO test (id) VALUES (1)'),
    {
      name: 'Error',
      code: 'ERR_SQLITE_ERROR',
      message: /attempt to write a readonly database/
    }
  );
  
  await db.close();
  
  // Cleanup
  unlinkSync(testFile);
});
