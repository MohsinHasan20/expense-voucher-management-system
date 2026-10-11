import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or server dir
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_voucher_db',
  jwtSecret: process.env.JWT_SECRET || 'pspl_expense_voucher_jwt_secret_dev_key_2026_at_least_32_bytes',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieSecret: process.env.COOKIE_SECRET || 'pspl_cookie_secret_dev_key_2026',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads/signatures'),
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES || '2097152', 10), // 2MB
  isProduction: process.env.NODE_ENV === 'production',
};
