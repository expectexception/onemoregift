'use strict';
// File-based database backup for cron on the droplet.
// Writes a gzipped JSON dump of every collection to backend/backups/ and keeps
// the newest KEEP_BACKUPS files.
//
// Usage:   node scripts/backup-db.js [--include-media]
// Cron:    0 3 * * *  cd /path/to/backend && node scripts/backup-db.js >> backups/backup.log 2>&1

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const mongoose = require('mongoose');

const KEEP_BACKUPS = Number(process.env.BACKUP_KEEP || 14);
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const includeMedia = process.argv.includes('--include-media');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const file = path.join(BACKUP_DIR, `omg-backup-${stamp}.json.gz`);

    const collections = (await db.listCollections().toArray())
        .map(c => c.name)
        .filter(name => !name.startsWith('system.'))
        .filter(name => includeMedia || name !== 'imagestores')
        .sort();

    const gzip = zlib.createGzip();
    const out = fs.createWriteStream(file);
    gzip.pipe(out);
    const write = (chunk) => new Promise((resolve, reject) => gzip.write(chunk, e => e ? reject(e) : resolve()));

    const serializeDoc = (doc) => JSON.stringify(doc, (key, value) => {
        if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
            return { $base64: Buffer.from(value.data).toString('base64') };
        }
        return value;
    });

    let total = 0;
    await write(`{"_meta":{"exportedAt":"${new Date().toISOString()}","db":"${db.databaseName}","collections":${collections.length}}`);
    for (const name of collections) {
        await write(`,"${name}":[`);
        let first = true;
        for await (const doc of db.collection(name).find({})) {
            await write((first ? '' : ',') + serializeDoc(doc));
            first = false;
            total++;
        }
        await write(']');
    }
    await write('}');
    await new Promise((resolve) => { gzip.end(); out.on('finish', resolve); });

    const sizeKb = Math.round(fs.statSync(file).size / 1024);
    console.log(`[Backup] ${path.basename(file)}: ${collections.length} collections, ${total} docs, ${sizeKb} KB`);

    // Retention: keep newest N backups
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('omg-backup-') && f.endsWith('.json.gz'))
        .sort()
        .reverse();
    for (const old of backups.slice(KEEP_BACKUPS)) {
        fs.unlinkSync(path.join(BACKUP_DIR, old));
        console.log(`[Backup] Pruned old backup ${old}`);
    }

    await mongoose.disconnect();
    process.exit(0);
})().catch((err) => {
    console.error('[Backup] Failed:', err.message);
    process.exit(1);
});
