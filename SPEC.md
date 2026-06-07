
This file is meant to describe for an LLM, or for a human reader, how the methods in the AsyncDatabase and AsyncStatement classes map to the node:sqlite DatabaseSync and StatementSync classes.  And, at the same time how do they preserve some compatibility with the sqlite3 and promised.sqlite packages.

# Open database connection

The class AsyncDatabase is a wrapper around node:sqlite DatabaseSync

It probably does not make sense for applications to directly construct AsyncDatabase.  Instead they should do:

```js
const db = await AsyncDatabase.open(path, options);
```

For compatibility with the promised.sqlite API another path is:

```js
// mode is one of the constants like OPEN_READONLY
const db = open(path, mode);
```

The getter `db.inner` provides access to the DatabaseSync object, if required.

# Parameters

The methods `db.run`, `db.get`, `db.all`, and `db.each` all take a parameters list which are to be _bound_ into the statement before execution.  The parameters list can be expressed in one of these ways:

```js
// for db.run

// Directly in the function arguments.
db.run("UPDATE tbl SET name = ? WHERE id = ?", "bar", 2);
// As an array.
db.run("UPDATE tbl SET name = ? WHERE id = ?", [ "bar", 2 ]);
// As an object with named parameters.
db.run("UPDATE tbl SET name = $name WHERE id = $id", {
   $id: 2,
   $name: "bar"
});

// for db.get

// Directly in the function arguments.
db.get("SELECT name FROM tbl WHERE id = ?", 2);
// As an array.
db.get("SELECT name FROM tbl WHERE id = ?", [ 2 ]);
// As an object with named parameters.
db.get("SELECT name FROM tbl WHERE id = $id", {
   $id: 2
});

// for db.all

// Directly in the function arguments.
db.all("SELECT name FROM tbl WHERE id = ?", 2);
// As an array.
db.all("SELECT name FROM tbl WHERE id = ?", [ 2 ]);
// As an object with named parameters.
db.all("SELECT name FROM tbl WHERE id = $id", {
   $id: 2
});

// for db.each

// Directly in the function arguments.
db.each("SELECT name FROM tbl WHERE id = ?", 2,
   function cb(row: any) {
       // Act on row
   }
);
// As an array.
db.each("SELECT name FROM tbl WHERE id = ?", [ 2 ],
   function cb(row: any) {
       // Act on row
   }
);
// As an object with named parameters.
db.each("SELECT name FROM tbl WHERE id = $id", {
   $id: 2
},
   function cb(row: any) {
       // Act on row
   }
);
```

## The node:sqlite class DatabaseSync does not have run/get/all/each methods

Note that DatabaseSync does not have these methods.  Instead, it appears to be intended that one uses its `prepare` method to generate a StatementSync, then to call those methods on that object.

Therefore `AsyncDatabase#run`. `AsyncDatabase#get`, `AsyncDatabase#all`, and `AsyncDatabase#each` should internally do:

1. Call `this.#db.prepare(sql)` to generate a StatementSync
   * While the sqlite3 package supported passing the params at this point, node:sqlite does not allow that
2. Generate AsyncStatment: `const asyncStmt = new AsyncStatement(stmt);`
3. Then call `asyncStmt.METHOD(params)`

Currently `AsyncDatabase#prepare` does this correctly.

## Centralized params processing -- #normalizeParams

In `AsyncDatabase` the `#normalizeParams` method appears meant to ensure the three structures for the params are correct.

This function must screen the params for correctness against the three scenarios shown above.

## Caching the StatementSync and AsyncStatement objects -- #getStatement

It is useful to cache the prepared statement object (StatementSync and AsyncStatement)

The #getStatement function does this.  And the current `AsyncDatabase#run`. `AsyncDatabase#get`, `AsyncDatabase#all`, and `AsyncDatabase#each` functions use #getStatement

But, its contract is not correct due not generating AsyncStatment: `const asyncStmt = new AsyncStatement(stmt);`

Instead:

* `AsyncDatabase#prepare` should cache the prepared statement objects  (StatementSync and AsyncStatement)
* `AsyncDatabase#prepare` should then wrap that in AsyncStatement

# AsyncStatement - thin wrapper around StatementSync

For `AsyncStatement#run`, `AsyncStatement#get`, `AsyncStatement#all` and `AsyncStatement#each`, the `params` is in one of these forms:

```js
// Directly in the function arguments.
stmt.METHOD("bar", 2);
// As an array.
stmt.METHOD([ "bar", 2 ]);
// As an object with named parameters.
stmt.METHOD({
   $id: 2,
   $name: "bar"
});
```

These are the same as for `AsyncDatabase#METHOD`

The params must be inspected and determined to be be correct.

In node:sqlite the method signatures for StatementSync are:

```js
statement.all([namedParameters][, ...anonymousParameters])
statement.get([namedParameters][, ...anonymousParameters])
statement.iterate([namedParameters][, ...anonymousParameters])
statement.run([namedParameters][, ...anonymousParameters])
```

The StatementSync methods separate two types of parameter structure rather than overlaying three types of parameter structures onto one method argument.  This means:

* If the params in `AsyncStatement#run`, `AsyncStatement#get`, `AsyncStatement#all` and `AsyncStatement#each` contain an object like `{ $id: 2,$name: "bar" }`, then pass it in the `namedParameters` position.
* Instead, if the params contain an array, or a sequence of values, pass it as a flattened list of parameters using `...paramArray`.
 
There is a direct correspondance between the `AsyncStatement#run`, `AsyncStatement#get`, `AsyncStatement#all` methods and StatementSync.

The `AsyncStatement#each` method corresponds indirectly to `StatementSync#iterate`, using the method currently in `AsyncStatement#each`:

```js
const iterator = p !== undefined 
    ? this.#statement.iterate(p)
    : this.#statement.iterate();
for await (const row of iterator) {
    callback(row as T);
    count++;
}
```
