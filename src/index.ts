import {
    Database as DB,
    OPEN_READONLY,
    OPEN_READWRITE,
    OPEN_CREATE,
    OPEN_SHAREDCACHE,
    OPEN_PRIVATECACHE,
    OPEN_URI,
} from 'node:sqlite';


export {
    OPEN_READONLY,
    OPEN_READWRITE,
    OPEN_CREATE,
    OPEN_SHAREDCACHE,
    OPEN_PRIVATECACHE,
    OPEN_URI,
};

export interface RunResult {
    lastID: number;
    changes: number;
}


export function open(filename: string): Promise<Database>
export function open(filename: string, mode: number): Promise<Database>
export function open(filename: string, mode?: number): Promise<Database> {
    const promised: Promise<Database> = (mode === undefined)
        ? new Promise((resolve, reject) => {
            const db = new DB(filename, err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(new Database(db));
            });
        })
        : new Promise((resolve, reject) => {
            const db = new DB(filename, mode, err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(new Database(db));
            });
        });
    return promised;
}



export class Database {
    constructor(protected readonly db: DB) {}

    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close(err => {
                if (err) {
                    reject(err);
                    return;
                }
            });
            resolve();
        });
    }

    each(sql: string): {
        [Symbol.asyncIterator](): {
            next(): Promise<{value: any, done: boolean}>
        }
    }
    each(sql: string, params: any): {
        [Symbol.asyncIterator](): {
            next(): Promise<{value: any, done: boolean}>
        }
    }
    each(sql: string, params?: any): {
        [Symbol.asyncIterator](): {
            next(): Promise<{value: any, done: boolean}>
        }
    } {
        let resolve: ({value: any, done: boolean}) => void = null;
        let reject: (reason?: any) => void = null;
        const cb = (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({value: row, done: false});
        };
        const complete = (err, count) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({value: count, done: true});
        };
        if (params === undefined) {
            this.db.each(sql, cb, complete);
        } else {
            this.db.each(sql, params, cb, complete);
        }
        return {
            [Symbol.asyncIterator]() {
                return {
                    next() {
                        return new Promise((res, rej) => {
                            resolve = res;
                            reject = rej;
                        });
                    }
                };
            }
        };
    }

    all(sql: string): Promise<any[]>
    all(sql: string, params: any): Promise<any[]>
    all(sql: string, params?: any): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const cb = (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            };
            if (params === undefined) {
                this.db.all(sql, cb);
            } else {
                this.db.all(sql, params, cb);
            }
        });
    }

    get(sql: string): Promise<any>
    get(sql: string, params: any): Promise<any>
    get(sql: string, params?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const cb = (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            };
            if (params === undefined) {
                this.db.get(sql, cb);
            } else {
                this.db.get(sql, params, cb);
            }
        });
    }

    run(sql: string): Promise<RunResult>
    run(sql: string, params: any): Promise<RunResult>
    run(sql: string, params?: any): Promise<RunResult> {
        return new Promise((resolve, reject) => {
            function cb(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({
                    lastID: this.lastID,
                    changes: this.changes,
                });
            }
            if (params === undefined) {
                this.db.run(sql, cb);
            } else {
                this.db.run(sql, params, cb);
            }
        });
    }
}
