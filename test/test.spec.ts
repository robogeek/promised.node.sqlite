import test from 'ava'
import {
  open,
  OPEN_READWRITE,
  AsyncDatabase
} from '../src/index.js'


/**
 * in memory based database
 */
test.serial('in memory based database', async t => {
  // open the database
  const db = await open(':memory:')
  // console.log('Connected to the in-memory SQlite database.');
  // close the database connection
  await db.close()
  // console.log('Close the database connection.');
  t.pass()
});

/**
 * in memory based database
 */
test.serial('in memory based database - AsyncDatabase.open', async t => {
  // open the database
  const db = await AsyncDatabase.open(':memory:');
  // console.log('Connected to the in-memory SQlite database.');
  // close the database connection
  await db.close()
  // console.log('Close the database connection.');
  t.pass()
});

/**
 * disk file based database
 */
test.serial('disk file as database', async t => {
  // open the database
  const db = await open('./assets/chinook.db', OPEN_READWRITE)
  // console.log('Connected to the database.');
  const row = await db.get(`SELECT PlaylistId as id,
                            Name as name
                            FROM playlists`)
  // console.log(row.id + '\t' + row.name);
  t.is(row.id, 1)
  t.is(row.name, 'Music')
  await db.close()
  // console.log('Close the database connection');
});

/**
 * disk file based database
 */
test.serial('disk file as database - AsyncDatabase.open', async t => {
  // open the database
  const db = await AsyncDatabase.open('./assets/chinook.db', {
  });
  // console.log('Connected to the database.');
  const row = await db.get(`SELECT PlaylistId as id,
                            Name as name
                            FROM playlists`)
  // console.log(row.id + '\t' + row.name);
  t.is(row.id, 1)
  t.is(row.name, 'Music')
  await db.close()
  // console.log('Close the database connection');
})

/**
 * Querying all rows with all() method
 */
test.serial('Querying all rows with all() method -- AsyncDatabase.open', async t => {
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
    '90’s Music',
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
  t.deepEqual(retrieved, comparisons);
});

/**
 * Querying all rows with all() method
 */
test.serial('Querying all rows with all() method -- open', async t => {
  const sql = `SELECT DISTINCT Name name FROM playlists
               ORDER BY name`;
  const db = await open('./assets/chinook.db');
  const rows = await db.all(sql);
  rows.forEach(row => {
    // console.log(row.name);
  });
  const comparisons = [
    '90’s Music',
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
  t.deepEqual(rows.map(row => row.name), comparisons);
  await db.close();
});

/**
 * Query the first row in the result set
 */
test.serial('Query the first row in the result set', async t => {
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
  t.is(row.id, 1)
  t.is(row.name, 'Music')
  // close the database connection
  await db.close()
});

/**
 * Query the first row in the result set
 */
test.serial('Query the first row in the result set -- AsyncDatabase.open', async t => {
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
  t.is(row.id, 1)
  t.is(row.name, 'Music')
  // close the database connection
})

/**
 * for await ... of
 */
test.serial('for await ... of', async t => {
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
  t.pass()
})

/**
 * Query rows with each() method
 */
test.serial('Query rows with each() method', async t => {
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
  t.deepEqual(rows, comparisons)
  await db.close()
})

/**
 * Query rows with each() method
 */
test.serial('Query rows with each() method -- AsyncDatabase.open', async t => {
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
  t.deepEqual(rows, comparisons)
  await db.close()
});

/**
 * Verify that errors in each() method are reported to the caller
 */
test.serial('Catch error in each() method callback', async t => {
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
    t.is(e.message, 'PRETEND SOMETHING FAILED');
    sawError = true;
  }
  t.is(sawError, true);
  await db.close()
});

// Tests for db.run with a single value in the params

test.serial('Use db.run with single integer in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with single integer array in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with single integer object in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with single float item in params', async t => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run('UPDATE tracks SET UnitPrice = ?', 1.99);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with single float array in params', async t => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run('UPDATE tracks SET UnitPrice = ?', [ 1.99 ]);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with single float object in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with single string in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with single string array in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with single string object in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

// Tests for db.run with two values in the params

test.serial('Use db.run with two integer values items in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with two integer values in array in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with two integer values in object in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with two float/integer items in params', async t => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run('UPDATE tracks SET UnitPrice = ?, AlbumId = ?', 1.99, 20);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with two float integer array  in params', async t => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run('UPDATE tracks SET UnitPrice = ?, AlbumId = ?', [ 1.99, 20 ]);
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with two float integer object  in params', async t => {

  const db = await AsyncDatabase.open('./assets/chinook.db');
  let sawError = false;
  try {
    await db.run('UPDATE tracks SET UnitPrice = $unitPrice, AlbumId = $albumId', {
      $unitPrice: 1.99,
      $albumId: 20
    });
  } catch (e: any) {
    console.error(e.message);
    sawError = true;
  }
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with two string integer items in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with two string integer items in array in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

test.serial('Use db.run with two string integer items in object in params', async t => {

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
  t.is(sawError, false);
  await db.close()

});

/**
 * Insert on row into a table
 */
test.serial('Insert one row into a table', async t => {
  const db = await open(':memory:')
  // insert one row into the langs table
  await db.run('CREATE TABLE langs(name text)')
  const res = await db.run(`INSERT INTO langs(name) VALUES(?)`, 'C')
  // get the last insert id
  // console.log(`A row has been inserted with rowid ${res.lastInsertRowid}`)
  t.is(res.lastInsertRowid, 1)
  // close the database connection
  await db.close()
})

/**
 * Insert on row into a table
 */
test.serial('Insert one row into a table -- AsyncDatabase.open', async t => {
  const db = await AsyncDatabase.open(':memory:');
  // insert one row into the langs table
  await db.run('CREATE TABLE langs(name text)')
  const res = await db.run(`INSERT INTO langs(name) VALUES(?)`, 'C')
  // get the last insert id
  // console.log(`A row has been inserted with rowid ${res.lastInsertRowid}`)
  t.is(res.lastInsertRowid, 1)
  // close the database connection
  await db.close()
})

/**
 * Insert multiple rows into a table at a time
 */
test.serial('Insert multiple rows into a table at a time', async t => {
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
  t.is(res.changes, 5)
  // close the database connection
  db.close()
})

/**
 * Insert multiple rows into a table at a time
 */
test.serial('Insert multiple rows into a table at a time -- AsyncDatabase.open', async t => {
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
  t.is(res.changes, 5)
  // close the database connection
  db.close()
})

/**
 * Updating Data in SQLite Database from a Node.js Application
 */
test.serial('Updating Data in SQLite Database from a Node.js Application', async t => {
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
  t.is(insertRes.changes, 6)
  // update
  const updateRes = await db.run(sqlUpdate, data)
  // console.log(`Row(s) updated: ${updateRes.changes}`);
  t.is(updateRes.changes, 1)
  // close the database connection
  await db.close()
})

/**
 * Updating Data in SQLite Database from a Node.js Application
 */
test.serial('Updating Data in SQLite Database from a Node.js Application -- AsyncDatabase.open', async t => {
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
  t.is(insertRes.changes, 6)
  // update
  const updateRes = await db.run(sqlUpdate, data)
  // console.log(`Row(s) updated: ${updateRes.changes}`);
  t.is(updateRes.changes, 1)
  // close the database connection
  await db.close()
})

/**
 * Deleting Data in SQLite Database from a Node.js Application
 */
test.serial('Deleting Data in SQLite Database from a Node.js Application', async t => {
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
  t.is(insertRes.changes, 5)
  const id = 1
  // delete a row based on id
  const deleteRes = await db.run(`DELETE FROM langs WHERE rowid=?`, id)
  // console.log(`Row(s) deleted: ${deleteRes.changes}`);
  t.is(deleteRes.changes, 1)
  // close the database connection
  await db.close()
});

/**
 * Deleting Data in SQLite Database from a Node.js Application
 */
test.serial('Deleting Data in SQLite Database from a Node.js Application -- AsyncDatabase.open', async t => {
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
  t.is(insertRes.changes, 5)
  const id = 1
  // delete a row based on id
  const deleteRes = await db.run(`DELETE FROM langs WHERE rowid=?`, id)
  // console.log(`Row(s) deleted: ${deleteRes.changes}`);
  t.is(deleteRes.changes, 1)
  // close the database connection
  await db.close()
})


/**
 * disk file based database
 */
test.serial('disk file based database', async t => {
  // open the database
  const db = await open('./assets/chinook.db', OPEN_READWRITE)
  // console.log('Connected to the database.');
  const row = await db.get(`SELECT PlaylistId as id,
                            Name as name
                            FROM playlists`)
  // console.log(row.id + '\t' + row.name);
  t.is(row.id, 1)
  t.is(row.name, 'Music')
  await db.close()
  // console.log('Close the database connection');
})
