import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { Voucher } from '../models/Voucher.js';
import { UserRole } from '../types/index.js';
import { config } from '../config/env.js';

export async function getSignature(req: Request, res: Response, next: NextFunction) {
  try {
    const rawFilename = req.params.filename;
    const user = req.user!;

    // Sanitize against directory traversal
    const safeFilename = path.basename(rawFilename);
    const filePath = path.join(config.uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Signature image not found',
      });
    }

    // Check database authorization for this signature
    const voucher = await Voucher.findOne({
      $or: [
        { employeeSignaturePath: safeFilename },
        { directorSignaturePath: safeFilename },
      ],
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'No associated voucher found for this signature',
      });
    }

    // If requester is EMPLOYEE, must own the voucher
    if (user.role === UserRole.EMPLOYEE && voucher.employeeId.toString() !== user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view signatures for this voucher.',
      });
    }

    // Determine content type
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    next(error);
  }
}
