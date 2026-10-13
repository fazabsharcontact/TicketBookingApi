import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

console.log(`mencoba terhubung ke URL:`, process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 1000,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Koneksi ke PostgreSQL gagal:', err.message);
    } else {
        console.log(`Koneksi ke PostgreSQL berhasil!`);
        release();
    }
});

const db = {
    query: (text, params) => pool.query(text, params),
    pool
};

export default db;