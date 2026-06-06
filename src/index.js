/**
 *
 * Copyright 2025 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
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
 *  limitations under the License.
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
     * @param filename - The filename or ':memory:' for in-memory database
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
            let stmt = this.#stmtCache.get(sql);
            if (!stmt) {
                stmt = this.#db.prepare(sql);
                this.#stmtCache.set(sql, stmt);
            }
            return stmt;
        }
        else {
            return this.#db.prepare(sql);
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
        if (params.length === 0) {
            return undefined;
        }
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
        return normalized;
    }
    /**
     * Runs the SQL query with the specified parameters.
     *
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     */
    async run(sql, ...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const stmt = this.#getStatement(sql);
                    const p = this.#normalizeParams(params);
                    const result = p !== undefined ? stmt.run(p) : stmt.run();
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
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     */
    async get(sql, ...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const stmt = this.#getStatement(sql);
                    const p = this.#normalizeParams(params);
                    const result = p !== undefined ? stmt.get(p) : stmt.get();
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
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     */
    async all(sql, ...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const stmt = this.#getStatement(sql);
                    const p = this.#normalizeParams(params);
                    const result = p !== undefined ? stmt.all(p) : stmt.all();
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
     * Returns the number of rows processed.
     *
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     * @param callback - Function to call for each row
     */
    async each(sql, params, callback) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const stmt = this.#getStatement(sql);
                    const iterator = params !== undefined
                        ? stmt.iterate(params)
                        : stmt.iterate();
                    let count = 0;
                    for (const row of iterator) {
                        try {
                            callback(row);
                            count++;
                        }
                        catch (err) {
                            reject(err);
                            return;
                        }
                    }
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
                    const stmt = this.#db.prepare(sql);
                    const asyncStmt = new AsyncStatement(stmt);
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
                    // Note: node:sqlite doesn't support entryPoint parameter yet
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
     * @param params - Parameters to bind (overrides any previously bound params)
     */
    async run(...params) {
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
                    const result = p !== undefined ? this.#statement.run(p) : this.#statement.run();
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
                    const result = p !== undefined ? this.#statement.get(p) : this.#statement.get();
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
                    const result = p !== undefined ? this.#statement.all(p) : this.#statement.all();
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
     * @param params - Parameters to bind
     * @param callback - Function to call for each row
     */
    async each(params, callback) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const iterator = params !== undefined
                        ? this.#statement.iterate(params)
                        : this.#statement.iterate();
                    let count = 0;
                    for (const row of iterator) {
                        try {
                            callback(row);
                            count++;
                        }
                        catch (err) {
                            reject(err);
                            return;
                        }
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