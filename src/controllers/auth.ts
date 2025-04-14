import { Request, Response } from 'express';
import axios from 'axios';

interface InstagramUser {
  id: string;
  username: string;
  profile_picture_url: string;
}

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url: string;
  permalink: string;
  timestamp: string;
}

export const instagramLogin = (req: Request, res: Response) => {
  const scopes = [
    'user_profile',
    'user_media',
    'instagram_business_manage_comments', // ✅ NEW scope replacing 'instagram_manage_comments'
  ];
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.APP_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=${scopes.join(',')}&response_type=code`;
  res.redirect(authUrl);
};

export const instagramCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    console.log('test', req.query);

    const params = new URLSearchParams();
    params.append('client_id', process.env.APP_ID!);
    params.append('client_secret', process.env.APP_SECRET!);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', process.env.REDIRECT_URI!);
    params.append('code', code as string);

    const { data } = await axios.post<{
      access_token: string;
      user_id: string;
    }>('https://api.instagram.com/oauth/access_token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // ✅ Success! Redirect with the token
    res.redirect(`${process.env.FRONTEND_URL}/?token=${data.access_token}`);
  } catch (error: any) {
    console.error('Instagram token exchange error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.query;
    
    const { data } = await axios.get<InstagramUser>(
      `https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${access_token}`
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// controllers/instagram.ts
export const getMedia = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const access_token = authHeader.split(' ')[1];
    const { limit = 12, after } = req.query;

    // First get media IDs
    const mediaResponse = await axios.get(
      'https://graph.instagram.com/me/media',
      {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
          access_token,
          limit,
          after
        },
        timeout: 10000
      }
    );

    // Then get details for each media item
    const mediaItems = await Promise.all(
      mediaResponse.data.data.map(async (media: { id: string }) => {
        const itemResponse = await axios.get(
          `https://graph.instagram.com/${media.id}`,
          {
            params: {
              fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp',
              access_token
            }
          }
        );
        return itemResponse.data;
      })
    );

    res.json({
      data: mediaItems,
      paging: mediaResponse.data.paging
    });

  } catch (error) {
    console.error('Media fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch media',
      details: axios.isAxiosError(error) ? error.response?.data : null
    });
  }
};