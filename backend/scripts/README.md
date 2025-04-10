# Database Management Scripts

This directory contains scripts for managing the database.

## Backup Script

The `backupDatabase.js` script creates a backup of all collections in the database. The backup is saved as JSON files in the `backups` directory.

### Usage

```bash
node backupDatabase.js
```

## Restore Script

The `restoreDatabase.js` script restores a database backup created by the `backupDatabase.js` script. It will restore all collections from the JSON files in the specified backup directory.

### Usage

```bash
node restoreDatabase.js <backupDirectoryPath>
```

Example:

```bash
node restoreDatabase.js ../backups/2023-04-06T12-34-56.789Z
```

## Reset Script

The `resetDatabase.js` script removes all data from the database except for the admin user with username "admin2". This allows you to start fresh while keeping your admin access.

### Usage

```bash
node resetDatabase.js
```

**WARNING: This will delete ALL data except the admin2 user account. This operation CANNOT be undone.**

## Recommended Workflow

1. Create a backup before resetting the database:
   ```bash
   node backupDatabase.js
   ```

2. Reset the database:
   ```bash
   node resetDatabase.js
   ```

3. If needed, restore from a backup:
   ```bash
   node restoreDatabase.js <backupDirectoryPath>
   ```
