import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure public/uploads/profiles directory exists
  const uploadsDir = path.resolve(process.cwd(), 'public/uploads/profiles');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Parse JSON payloads with a max size of 5MB
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Profile image upload API endpoint (Phase 8/9 Fix)
  app.post('/api/upload-profile-image', (req, res) => {
    try {
      const { fileName, fileData, mimeType } = req.body;
      if (!fileName || !fileData) {
        return res.status(400).json({ error: 'Missing file name or data.' });
      }

      // Security validation: sanitize filename and reject non-image extensions
      const cleanFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '');
      const ext = path.extname(cleanFileName).toLowerCase();
      if (!['.webp', '.jpg', '.jpeg', '.png'].includes(ext)) {
        return res.status(400).json({ error: 'Security rejection: Only WebP, JPEG, and PNG images are allowed.' });
      }

      // Validate MIME type
      const allowedMimes = ['image/webp', 'image/jpeg', 'image/png', 'image/jpg'];
      if (mimeType && !allowedMimes.includes(mimeType)) {
        return res.status(400).json({ error: 'Security rejection: Unsupported MIME type.' });
      }

      // Extract binary data
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Maximum limit check: 300KB
      if (buffer.length > 300 * 1024) {
        return res.status(400).json({ error: 'Optimized file exceeds maximum 300KB threshold.' });
      }

      const filePath = path.join(uploadsDir, cleanFileName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/profiles/${cleanFileName}`;
      return res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.error('Profile image upload error:', err);
      return res.status(500).json({ error: 'Failed to write profile image to storage.' });
    }
  });

  // Serve static public folder
  app.use(express.static(path.resolve(process.cwd(), 'public')));

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  } else {
    // In development mode, mount Vite middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kasuwar Kanawa Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
