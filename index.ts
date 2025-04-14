import express from 'express';
import cors from 'cors';
import router from './src/routes/index';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend origin
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));


app.use('/', router);
app.get('/api/instagram-profile', async (req:any, res:any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Missing access token' });
    }

    const response = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: token
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});
app.get('/api/instagram-media', async (req:any, res:any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { limit = 5, after } = req.query;

    const mediaResponse = await axios.get('https://graph.instagram.com/me/media', {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments.limit(10){id,text,username,timestamp}',
        access_token: token,
        limit,
        after
      }
    });

    const mediaData = mediaResponse.data.data;

    // Fetch comments for each media item
    const mediaWithComments = await Promise.all(
      mediaData.map(async (media:any) => {
        try {
          const commentRes = await axios.get(`https://graph.instagram.com/${media.id}/comments`, {
            params: {
              access_token: token
            }
          });
          return { ...media, comments: commentRes.data.data };
        } catch (err) {
          return { ...media, comments: [] }; // fallback if comment fetch fails
        }
      })
    );

    res.json({
      data: mediaWithComments,
      paging: mediaResponse.data.paging
    });

  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Media fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});