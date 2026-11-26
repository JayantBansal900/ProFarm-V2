import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import {
  auditController, deactivateController, reactivateController, resetMfaController,
  roleController, statsController, usersController,
} from '../controllers/admin.controller';

const router = Router();

// Signed in, an admin, and protected by two-step verification.
router.use(requireAuth, requireAdmin);

router.get('/stats', statsController);
router.get('/users', usersController);
router.patch('/users/:id/role', roleController);
router.post('/users/:id/deactivate', deactivateController);
router.post('/users/:id/reactivate', reactivateController);
router.post('/users/:id/reset-mfa', resetMfaController);
router.get('/audit', auditController);

export const adminRoutes = router;
