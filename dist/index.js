/**
 *
 * Copyright 2025 David Herron
 *
 * This file is part of AkashCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  the limitations under the License.
 */
/**
 * Async wrapper around node:sqlite (DatabaseSync)
 *
 * This module provides a promise-based API wrapper around Node.js's
 * built-in synchronous sqlite module. It mimics the API of promised-sqlite3
 * to allow for drop-in replacement.
 *
 * The wrapper uses setImmediate() to yield control to the event loop,
 * preventing blocking during database operations.
 */
import { DatabaseSync } from 'node:sqlite';
export const OPEN_READONLY = 1;
export const OPEN_READWRITE = 2;
export const OPEN_CREATE = 3;
export const OPEN_SHAREDCACHE = 4;
export const OPEN_PRIVATECACHE = 5;
export const OPEN_URI = 6;
export function open(filename, mode) {
    return new Promise((resolve) => {
        const options = {
            readOnly: typeof mode !== 'undefined' && mode === OPEN_READONLY
        };
        const db = AsyncDatabase.open(filename, options); // new DatabaseSync(filename, options);
        resolve(db);
    });
}
/**
 * A thin wrapper around DatabaseSync that exposes an async API.
 * Compatible with promised-sqlite3's AsyncDatabase interface.
 */
export class AsyncDatabase {
    #db;
    #stmtCache;
    #enableCache;
    /**
     * Create a new AsyncDatabase from a DatabaseSync object.
     *
     * @see Use AsyncDatabase.open() to create and open the database with the async API.
     *
     * @param db - The DatabaseSync object.
     * @param enableCache - If true, prepared statements are cached (default: true)
     */
    constructor(db, enableCache = true) {
        this.#db = db;
        this.#stmtCache = new Map();
        this.#enableCache = enableCache;
    }
    /**
     * @returns The inner DatabaseSync object for direct access (e.g., for extension loading)
     */
    get inner() {
        return this.#db;
    }
    /**
     * Returns a new AsyncDatabase object and automatically opens the database.
     *
     * @param filename - The filename or ':memory:' for in-mutable database
     * @param options - Database options
     */
    static async open(filename, options) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const dbOptions = {
                        open: true,
                        readOnly: options?.readOnly ?? false,
                        enableForeignKeyConstraints: options?.enableForeignKeyConstraints ?? true,
                        allowExtension: options?.allowExtension ?? false,
                        timeout: options?.timeout ?? 0,
                        readBigInts: options?.readBigInts ?? false,
                        returnArrays: options?.returnArrays ?? false,
                        allowBareNamedParameters: options?.allowBareNamedParameters ?? true,
                        allowUnknownNamedParameters: options?.allowUnknownNamedParameters ?? false,
                    };
                    const db = new DatabaseSync(filename, dbOptions);
                    resolve(new AsyncDatabase(db));
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Close the database.
     */
    async close() {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    // Clear statement cache
                    this.#stmtCache.clear();
                    this.#db.close();
                    resolve();
                }
                catch (err) {
                    console.error(err.toString());
                    reject(err);
                }
            });
        });
    }
    /**
     * Get or create a prepared statement from cache
     */
    #getStatement(sql) {
        if (this.#enableCache) {
            let cached = this.#stmtCache.get(sql);
            if (!cached) {
                const sync = this.#db.prepare(sql);
                const async = new AsyncStatement(sync);
                cached = { sync, async };
                this.#stmtCache.set(sql, cached);
            }
            return cached.async;
        }
        else {
            return new AsyncStatement(this.#db.prepare(sql));
        }
    }
    /**
     * Validates that a SQL statement is provided.
     *
     * @param sql - The SQL statement to validate
     * @throws Error if SQL is null, undefined, or empty string
     */
    #validateSQL(sql) {
        if (sql == null || sql === '') {
            throw new Error('SQL statement is required');
        }
    }
    /**
     * Normalize parameters for binding
     * If single object/array, use as-is for named/positional parameters
     * If multiple args, use as positional array
     *
     * Converts undefined values to null as node:sqlite doesn't accept undefined
     */
    #normalizeParams(params) {
        //  fn(param1, param2, param3)  --- becomes ---|
        //  fn([ param1, param2, param3 ])   <---------|
        //  fn({
        //    $param1: param1,
        //    $param2: param2,
        //    $param3: param3
        //  })
        if (typeof params === 'undefined' || params.length === 0) {
            return undefined;
        }
        // console.log(`normalizeParams`, params);
        const normalized = params.length === 1 ? params[0] : params;
        // Convert undefined to null for node:sqlite compatibility
        if (typeof normalized === 'object' && normalized !== null) {
            if (Array.isArray(normalized)) {
                return normalized.map(v => v === undefined ? null : v);
            }
            else {
                const result = {};
                for (const [key, value] of Object.entries(normalized)) {
                    result[key] = value === undefined ? null : value;
                }
                return result;
            }
        }
        // console.log(`normalizeParams normalized`, normalized);
        return [normalized];
    }
    /**
     * Runs the SQL query with the specified parameters.
     *
     * For compatibility with the old sqlite3 package, the
     * params must be supplied in one of three ways:
     *
     * // Directly in the function arguments.
     * db.run("UPDATE tbl SET name = ? WHERE id = ?", "bar", 2);
     * // As an array.
     * db.run("UPDATE tbl SET name = ? WHERE id = ?", [ "bar", 2 ]);
     * // As an object with named parameters.
     * db.run("UPDATE tbl SET name = $name WHERE id = $id", {
     *    $id: 2,
     *    $name: "bar"
     * });
     *
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     */
    async run(sql, ...params) {
        return new Promise((resolve, reject) => {
            setImmediate(async () => {
                try {
                    this.#validateSQL(sql);
                    const asyncStmt = this.#getStatement(sql);
                    // console.log(`run ${sql} params=`, params);
                    const p = this.#normalizeParams(params);
                    // console.log(`run ${sql}`, p);
                    let result;
                    if (typeof p === 'undefined') {
                        result = await asyncStmt.run();
                    }
                    else if (Array.isArray(p)) {
                        result = await asyncStmt.run(...p);
                    }
                    else {
                        result = await asyncStmt.run(p);
                    }
                    resolve({
                        changes: typeof result.changes === 'bigint'
                            ? Number(result.changes)
                            : result.changes,
                        lastInsertRowid: typeof result.lastInsertRowid === 'bigint'
                            ? Number(result.lastInsertRowid)
                            : result.lastInsertRowid
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Runs the SQL query and returns the first result row.
     *
     * For compatibility with the old sqlite3 package, the
     * params must be supplied in one of three ways:
     *
     * // Directly in the function arguments.
     * db.get("SELECT name FROM tbl WHERE id = ?", 2);
     * // As an array.
     * db.get("SELECT name FROM tbl WHERE id = ?", [ 2 ]);
     * // As an object with named parameters.
     * db.get("SELECT name FROM tbl WHERE id = $id", {
     *    $id: 2
     * });
     *
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     */
    async get(sql, ...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    this.#validateSQL(sql);
                    const asyncStmt = this.#getStatement(sql);
                    const p = this.#normalizeParams(params);
                    let result;
                    if (typeof p === 'undefined') {
                        result = asyncStmt.get();
                    }
                    else if (Array.isArray(p)) {
                        result = asyncStmt.get(...p);
                    }
                    else {
                        result = asyncStmt.get(p);
                    }
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Runs the SQL query and returns all result rows.
     *
     * For compatibility with the old sqlite3 package, the
     * params must be supplied in one of three ways:
     *
     * // Directly in the function arguments.
     * db.all("SELECT name FROM tbl WHERE id = ?", 2);
     * // As an array.
     * db.all("SELECT name FROM tbl WHERE id = ?", [ 2 ]);
     * // As an object with named parameters.
     * db.all("SELECT name FROM tbl WHERE id = $id", {
     *    $id: 2
     * });
     *
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     */
    async all(sql, ...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    this.#validateSQL(sql);
                    const asyncStmt = this.#getStatement(sql);
                    const p = this.#normalizeParams(params);
                    let result;
                    if (typeof p === 'undefined') {
                        result = asyncStmt.all();
                    }
                    else if (Array.isArray(p)) {
                        result = asyncStmt.all(...p);
                    }
                    else {
                        result = asyncStmt.all(p);
                    }
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Runs the SQL query with the specified parameters and calls the callback once for each result row.
     *
     * Returns the number of rows processed.
     *
     * For compatibility with the old sqlite3 package, the
     * params must be supplied in one of three ways:
     *
     * // Directly in the function arguments.
     * db.each("SELECT name FROM tbl WHERE id = ?", 2,
     *    function cb(row: any) {
     *        // Act on row
     *    }
     * );
     * // As an array.
     * db.each("SELECT name FROM tbl WHERE id = ?", [ 2 ],
     *    function cb(row: any) {
     *        // Act on row
     *    }
     * );
     * // As an object with named parameters.
     * db.each("SELECT name FROM tbl WHERE id = $id", {
     *    $id: 2
     * },
     *    function cb(row: any) {
     *        // Act on row
     *    }
     * );
     *
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     * @param callback - Function to call for each row
     */
    async each(sql, ...params) {
        const lastArg = params[params.length - 1];
        if (typeof lastArg !== 'function') {
            throw new Error('The last argument to each() must be a callback function.');
        }
        const callback = lastArg;
        const _params = params.slice(0, -1);
        return new Promise((resolve, reject) => {
            setImmediate(async () => {
                try {
                    this.#validateSQL(sql);
                    const asyncStmt = this.#getStatement(sql);
                    const p = this.#normalizeParams(_params);
                    const count = await asyncStmt.each(p, callback);
                    resolve(count);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Runs all SQL queries in the supplied string.
     *
     * @param sql - One or more SQL statements separated by semicolons
     */
    async exec(sql) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    this.#db.exec(sql);
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Prepares the SQL statement and returns an AsyncStatement.
     *
     * @param sql - The SQL statement
     * @param params - Optional parameters to bind immediately
     */
    async prepare(sql, ...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    this.#validateSQL(sql);
                    const asyncStmt = this.#getStatement(sql);
                    // If parameters provided, bind them
                    if (params.length > 0) {
                        const p = this.#normalizeParams(params);
                        // Note: node:sqlite auto-binds on run/get/all, 
                        // so we just store for later use
                        asyncStmt['_bindParams'] = p;
                    }
                    resolve(asyncStmt);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Load a SQLite extension.
     * The database must have been opened with allowExtension: true.
     *
     * @param path - Path to the extension library
     * @param entryPoint - Optional entry point name (not supported in node:sqlite currently)
     */
    async loadExtension(path, entryPoint) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    // Note: node:sqlite doesn'                    // Note: node:sqlite doesn't support entryPoint parameter yet
                    this.#db.loadExtension(path);
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
}
/**
 * A thin wrapper around StatementSync that exposes an async API.
 * Compatible with promised-sqlite3's AsyncStatement interface.
 */
export class AsyncStatement {
    #statement;
    #bindParams;
    /**
     * Create a new AsyncStatement from a StatementSync object.
     *
     * @param statement - The StatementSync object
     */
    constructor(statement) {
        this.#statement = statement;
    }
    /**
     * @returns The inner StatementSync object
     */
    get inner() {
        return this.#statement;
    }
    /**
     * Binds parameters to the prepared statement.
     * Note: In node:sqlite, binding happens automatically on run/get/all,
     * so this method just stores the params for later use.
     *
     * @param params - Parameters to bind
     */
    async bind(...params) {
        return new Promise((resolve) => {
            setImmediate(() => {
                if (params.length === 1) {
                    this.#bindParams = params[0];
                }
                else if (params.length > 1) {
                    this.#bindParams = params;
                }
                resolve();
            });
        });
    }
    /**
     * Resets the row cursor of the statement.
     * Note: node:sqlite handles this automatically, so this is a no-op for compatibility.
     */
    async reset() {
        return new Promise((resolve) => {
            setImmediate(() => {
                // No-op for compatibility with promised-sqlite3
                // node:sqlite handles statement reuse automatically
                resolve();
            });
        });
    }
    /**
     * Finalizes the statement.
     * Note: node:sqlite handles cleanup automatically, so this is a no-op for compatibility.
     */
    async finalize() {
        return new Promise((resolve) => {
            setImmediate(() => {
                // No-op for compatibility with promised-sqlite3
                // node:sqlite handles cleanup automatically
                resolve();
            });
        });
    }
    /**
     * Binds parameters and executes the statement.
     *
     * For compatibility with the old sqlite3 package, the
     * params must be supplied in one of three ways:
     *
     * // Directly in the function arguments.
     * stmt.run("bar", 2);
     * // As an array.
<0xA0>      * stmt.run("bar", [ 2 ]);
     * // As an object with named parameters.
     * stmt.run({
     *    $id: 2,
     *    $name: "bar"
     * });
     *
     * @param params - Parameters to bind (overrides any previously bound params)
     */
    async run(...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    // console.log(`run STATEMENT params=`, params);
                    let p;
                    if (params.length > 0) {
                        p = params.length === 1 ? params[0] : params;
                    }
                    else {
                        p = this.#bindParams;
                    }
                    // console.log(`run STATEMENT`, p);
                    let result;
                    if (typeof p === 'undefined') {
                        result = this.#statement.run();
                    }
                    else if (Array.isArray(p)) {
                        result = this.#statement.run(...p);
                    }
                    else {
                        result = this.#statement.run(p);
                    }
                    resolve({
                        changes: typeof result.changes === 'bigint'
                            ? Number(result.changes)
                            : result.changes,
                        lastInsertRowid: typeof result.lastInsertRowid === 'bigint'
                            ? Number(result.lastInsertRowid)
                            : result.lastInsertRowid
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Binds parameters, executes the statement and retrieves the first result row.
     *
     * For compatibility with the old sqlite3 package, the
     * params must be supplied in one of three ways:
     *
     * // Directly in the function arguments.
     * stmt.get(2);
     * // As an array.
     * stmt.get([ 2 ]);
     * // As an object with named parameters.
     * stmt.get({
     *     $id: 2
     * });
     *
     * @param params - Parameters to bind (overrides any previously bound params)
     */
    async get(...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    let p;
                    if (params.length > 0) {
                        p = params.length === 1 ? params[0] : params;
                    }
                    else {
                        p = this.#bindParams;
                    }
                    let result;
                    if (typeof p === 'undefined') {
                        result = this.#statement.get();
                    }
                    else if (Array.isArray(p)) {
                        result = this.#statement.get(...p);
                    }
                    else {
                        result = this.#statement.get(p);
                    }
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Binds parameters, executes the statement and returns all result rows.
     *
     * For compatibility with the old sqlite3 package, the
     * params must be supplied in one of three ways:
     *
     * // Directly in the function arguments.
     * stmt.all(2);
     * // As an array.
     * stmt.all([ 2 ]);
     * // As an object with named parameters.
     * stmt.all({
     *    $id: 2
     * });
     *
     * @param params - Parameters to bind (overrides any previously bound params)
     */
    async all(...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    let p;
                    if (params.length > 0) {
                        p = params.length === 1 ? params[0] : params;
                    }
                    else {
                        p = this.#bindParams;
                    }
                    let result;
                    if (typeof p === 'undefined') {
                        result = this.#statement.all();
                    }
                    else if (Array.isArray(p)) {
                        result = this.#statement.all(...p);
                    }
                    else {
                        result = this.#statement.all(p);
                    }
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Binds parameters, executes the statement and calls the callback for each result row.
     *
     * Returns the number of rows processed.
     *
     * For compatibility with the old sqlite3 package, the
     * params must be supplied in one of three ways:
     *
     * // Directly in the function arguments.
     * stmt.each(2,
     *    function cb(row: any) {
     *        // Act on row
     *    }
     * );
     * // As an array.
     * stmt.each([ 2 ],
     *    function cb(row: any) {
     *        // Act on row
     *    }
     * );
     * // As an object with named parameters.
     * stmt.each({
     *    $id: 2
     * },
     *    function cb(row: any) {
     *        // Act on row
     *    }
     * );
     *
     * @param params - Parameters to bind
     * @param callback - Function to call for each row
     */
    async each(...params) {
        const lastArg = params[params.length - 1];
        if (typeof lastArg !== 'function') {
            throw new Error('The last argument to each() must be a callback function.');
        }
        const callback = lastArg;
        const _params = params.slice(0, -1);
        return new Promise((resolve, reject) => {
            setImmediate(async () => {
                try {
                    let count = 0;
                    const p = _params.length > 0
                        ? (_params.length === 1 ? _params[0] : _params)
                        : undefined;
                    let iterator;
                    if (typeof p === 'undefined') {
                        iterator = this.#statement.iterate();
                    }
                    else if (Array.isArray(p)) {
                        iterator = this.#statement.iterate(...p);
                    }
                    else {
                        iterator = this.#statement.iterate(p);
                    }
                    for await (const row of iterator) {
                        callback(row);
                        count++;
                    }
                    resolve(count);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
}
//# sourceMappingURL=index.js.map