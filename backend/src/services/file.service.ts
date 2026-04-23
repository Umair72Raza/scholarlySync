import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

/**
 * Convert a multer filename to a relative fileUrl stored in DB.
 * e.g. "uuid.pdf" → "uploads/uuid.pdf"
 */
export const getFileUrl = (filename: string): string =>
  `/${env.UPLOAD_DIR}/${filename}`;

/**
 * Resolve a relative fileUrl to an absolute path on disk.
 */
export const getAbsolutePath = (fileUrl: string): string =>
  path.join(process.cwd(), fileUrl);

/**
 * Check whether a file exists at the given relative fileUrl.
 */
export const fileExists = (fileUrl: string): boolean =>
  fs.existsSync(getAbsolutePath(fileUrl));

/**
 * Delete a file from disk by its relative fileUrl.
 * Silent no-op if the file does not exist.
 */
export const deleteFile = (fileUrl: string): void => {
  const absPath = getAbsolutePath(fileUrl);
  if (fs.existsSync(absPath)) {
    fs.unlinkSync(absPath);
  }
};
