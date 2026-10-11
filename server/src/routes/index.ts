import { Router } from 'express';
import authRoutes from './authRoutes.js';
import voucherRoutes from './voucherRoutes.js';
import directorRoutes from './directorRoutes.js';
import accountsRoutes from './accountsRoutes.js';
import signatureRoutes from './signatureRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/vouchers', voucherRoutes);
apiRouter.use('/director', directorRoutes);
apiRouter.use('/accounts', accountsRoutes);
apiRouter.use('/signatures', signatureRoutes);

export default apiRouter;
