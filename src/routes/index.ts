import { Router } from 'express';
import { 
  instagramLogin, 
  instagramCallback,
  getProfile,
  getMedia
} from '../controllers/auth';

const router = Router();

router.get('/auth/instagram', instagramLogin);
router.get('/auth/instagram/callback', instagramCallback);
router.get('/profile', getProfile);
// router.get('/media', getMedia);

export default router;