import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { isAllowedFileType, validateImageMagicBytes } from '../utils/fileSecurity.js';

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Memory storage so we can validate magic bytes before committing to disk
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: config.maxFileSizeBytes, // 2MB
  },
  fileFilter: (_req, file, cb) => {
    if (isAllowedFileType(file.originalname, file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG images are allowed.'));
    }
  },
});

export const uploadSignatureMem = upload.single('signature');

/**
 * Middleware that validates the uploaded signature buffer magic bytes,
 * writes it securely to private upload directory, and attaches the saved filename to req.savedSignatureFilename.
 */
export async function validateAndSaveSignature(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return next();
  }

  try {
    // 1. Validate magic bytes
    if (!validateImageMagicBytes(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image content. File signature does not match PNG or JPEG format.',
      });
    }

    // 2. Generate secure unguessable filename
    const ext = path.extname(req.file.originalname).toLowerCase();
    const safeRandom = crypto.randomBytes(16).toString('hex');
    const filename = `sig_${Date.now()}_${safeRandom}${ext}`;
    const targetPath = path.join(config.uploadDir, filename);

    // 3. Write file to disk in private folder
    fs.writeFileSync(targetPath, req.file.buffer);

    // 4. Attach saved filename to request
    (req as any).savedSignatureFilename = filename;
    (req as any).savedSignaturePath = targetPath;

    next();
  } catch (error) {
    next(error);
  }
}
