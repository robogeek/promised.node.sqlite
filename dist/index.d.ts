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
import { DatabaseSync, StatementSync } from 'node:sqlite';
export declare const OPEN_READONLY = 1;
export declare const OPEN_READWRITE = 2;
export declare const OPEN_CREATE = 3;
export declare const OPEN_SHAREDCACHE = 4;
export declare const OPEN_PRIVATECACHE = 5;
export declare const OPEN_URI = 6;
/**
 * Options for opening a database connection
 */
export interface DatabaseOptions {
    /**
     * If true, the database is opened in read-only mode
     */
    readOnly?: boolean;
    /**
     * If true, foreign key constraints are enabled
     */
    enableForeignKeyConstraints?: boolean;
    /**
     * If true, allows loading SQLite extensions
     */
    allowExtension?: boolean;
    /**
     * Busy timeout in milliseconds
     */
    timeout?: number;
    /**
     * If true, integer fields are read as BigInts
     */
    readBigInts?: boolean;
    /**
     * If true, query results are returned as arrays
     */
    returnArrays?: boolean;
    /**
     * If true, allows binding named parameters without prefix
     */
    allowBareNamedParameters?: boolean;
    /**
     * If true, unknown named parameters are ignored
     */
    allowUnknownNamedParameters?: boolean;
}
/**
 * Result of a run operation
 */
export interface RunResult {
    /**
     * Number of rows changed
     */
    changes: number;
    /**
     * Last inserted row ID
     */
    lastInsertRowid: number;
}
export declare function open(filename: string): Promise<AsyncDatabase>;
export declare function open(filename: string, mode: number): Promise<AsyncDatabase>;
/**
 * A thin wrapper around DatabaseSync that exposes an async API.
 * Compatible with promised-sqlite3's AsyncDatabase interface.
 */
export declare class AsyncDatabase {
    #private;
    /**
     * Create a new AsyncDatabase from a DatabaseSync object.
     *
     * @see Use AsyncDatabase.open() to create and open the database with the async API.
     *
     * @param db - The DatabaseSync object.
     * @param enableCache - If true, prepared statements are cached (default: true)
     */
    constructor(db: DatabaseSync, enableCache?: boolean);
    /**
     * @returns The inner DatabaseSync object for direct access (e.g., for extension loading)
     */
    get inner(): DatabaseSync;
    /**
     * Returns a new AsyncDatabase object and automatically opens the database.
     *
     * @param filename - The filename or ':memory:' for in-mutable database
     * @param options - Database options
     */
    static open(filename: string, options?: DatabaseOptions): Promise<AsyncDatabase>;
    /**
     * Close the database.
     */
    close(): Promise<void>;
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
    run(sql: string, ...params: unknown[]): Promise<RunResult>;
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
    get<T = any>(sql: string, ...params: unknown[]): Promise<T | undefined>;
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
    all<T = any>(sql: string, ...params: unknown[]): Promise<T[]>;
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
    each<T = any>(sql: string, ...params: any[]): Promise<number>;
    /**
     * Runs all SQL queries in the supplied string.
     *
     * @param sql - One or more SQL statements separated by semicolons
     */
    exec(sql: string): Promise<void>;
    /**
     * Prepares the SQL statement and returns an AsyncStatement.
     *
     * @param sql - The SQL statement
     * @param params - Optional parameters to bind immediately
     */
    prepare(sql: string, ...params: unknown[]): Promise<AsyncStatement>;
    /**
     * Load a SQLite extension.
     * The database must have been opened with allowExtension: true.
     *
     * @param path - Path to the extension library
     * @param entryPoint - Optional entry point name (not supported in node:sqlite currently)
     */
    loadExtension(path: string, entryPoint?: string): Promise<void>;
}
/**
 * A thin wrapper around StatementSync that exposes an async API.
 * Compatible with promised-sqlite3's AsyncStatement interface.
 */
export declare class AsyncStatement {
    #private;
    /**
     * Create a new AsyncStatement from a StatementSync object.
     *
     * @param statement - The StatementSync object
     */
    constructor(statement: StatementSync);
    /**
     * @returns The inner StatementSync object
     */
    get inner(): StatementSync;
    /**
     * Binds parameters to the prepared statement.
     * Note: In node:sqlite, binding happens automatically on run/get/all,
     * so this method just stores the params for later use.
     *
     * @param params - Parameters to bind
     */
    bind(...params: unknown[]): Promise<void>;
    /**
     * Resets the row cursor of the statement.
     * Note: node:sqlite handles this automatically, so this is a no-op for compatibility.
     */
    reset(): Promise<void>;
    /**
     * Finalizes the statement.
     * Note: node:sqlite handles cleanup automatically, so this is a no-op for compatibility.
     */
    finalize(): Promise<void>;
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
    run(...params: unknown[]): Promise<RunResult>;
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
    get<T = any>(...params: unknown[]): Promise<T | undefined>;
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
    all<T = any>(...params: unknown[]): Promise<T[]>;
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
    each<T = any>(...params: any[]): Promise<number>;
}
