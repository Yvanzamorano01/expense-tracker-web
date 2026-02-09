import { Router, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import { encryptFile, decryptFile } from '../config/encryption';
import env from '../config/env';
import path from 'path';
import fs from 'fs';

const router = Router();

/**
 * Backup Routes
 * FR-7.1 to FR-7.2: Backup and Restore
 * NFR-S4: Backup encryption
 */

// Apply optional auth to all routes
router.use(optionalAuth);

/**
 * @route   POST /api/backup/create
 * @desc    Create database backup
 * @access  Private (if password protected)
 */
router.post(
  '/create',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Ensure backup directory exists
    if (!fs.existsSync(env.DATABASE_BACKUP_PATH)) {
      fs.mkdirSync(env.DATABASE_BACKUP_PATH, { recursive: true });
    }

    // Read database file
    if (!fs.existsSync(env.DATABASE_PATH)) {
      throw new AppError('Database file not found', 404);
    }

    const dbBuffer = fs.readFileSync(env.DATABASE_PATH);

    // Encrypt if enabled
    const backupBuffer = env.ENCRYPTION_ENABLED
      ? await encryptFile(dbBuffer)
      : dbBuffer;

    // Generate filename
    const filename = `backup-${Date.now()}.db${env.ENCRYPTION_ENABLED ? '.enc' : ''}`;
    const backupPath = path.join(env.DATABASE_BACKUP_PATH, filename);

    // Save backup
    fs.writeFileSync(backupPath, backupBuffer);

    res.json({
      success: true,
      message: 'Backup created successfully',
      data: {
        filename,
        path: backupPath,
        encrypted: env.ENCRYPTION_ENABLED,
        size: backupBuffer.length,
        createdAt: new Date(),
      },
    });
  })
);

/**
 * @route   POST /api/backup/restore
 * @desc    Restore database from backup
 * @access  Private (if password protected)
 */
router.post(
  '/restore',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { filename } = req.body;

    if (!filename) {
      throw new AppError('Backup filename is required', 400);
    }

    const backupPath = path.join(env.DATABASE_BACKUP_PATH, filename);

    if (!fs.existsSync(backupPath)) {
      throw new AppError('Backup file not found', 404);
    }

    // Read backup file
    let backupBuffer = fs.readFileSync(backupPath);

    // Decrypt if encrypted
    if (filename.endsWith('.enc')) {
      if (!env.ENCRYPTION_ENABLED) {
        throw new AppError('Encryption key not configured', 500);
      }
      // @ts-ignore - Buffer type compatibility
      backupBuffer = await decryptFile(backupBuffer);
    }

    // Create a copy of current database before restoring
    const currentBackupPath = path.join(
      env.DATABASE_BACKUP_PATH,
      `pre-restore-${Date.now()}.db`
    );

    if (fs.existsSync(env.DATABASE_PATH)) {
      fs.copyFileSync(env.DATABASE_PATH, currentBackupPath);
    }

    // Restore database
    fs.writeFileSync(env.DATABASE_PATH, backupBuffer);

    res.json({
      success: true,
      message: 'Database restored successfully. Please restart the application.',
      data: {
        restoredFrom: filename,
        previousBackup: path.basename(currentBackupPath),
      },
    });
  })
);

/**
 * @route   GET /api/backup/list
 * @desc    List all available backups
 * @access  Private (if password protected)
 */
router.get(
  '/list',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!fs.existsSync(env.DATABASE_BACKUP_PATH)) {
      fs.mkdirSync(env.DATABASE_BACKUP_PATH, { recursive: true });
    }

    const files = fs.readdirSync(env.DATABASE_BACKUP_PATH);

    const backups = files
      .filter(file => file.endsWith('.db') || file.endsWith('.db.enc'))
      .map(file => {
        const filepath = path.join(env.DATABASE_BACKUP_PATH, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          encrypted: file.endsWith('.enc'),
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json({
      success: true,
      data: {
        backups,
        count: backups.length,
      },
    });
  })
);

/**
 * @route   DELETE /api/backup/:filename
 * @desc    Delete a backup file
 * @access  Private (if password protected)
 */
router.delete(
  '/:filename',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { filename } = req.params;

    const backupPath = path.join(env.DATABASE_BACKUP_PATH, filename);

    if (!fs.existsSync(backupPath)) {
      throw new AppError('Backup file not found', 404);
    }

    fs.unlinkSync(backupPath);

    res.json({
      success: true,
      message: 'Backup deleted successfully',
    });
  })
);

export default router;
