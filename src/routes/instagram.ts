// import express from "express";
// import axios from "axios";
// import { Router, Request, Response } from "express";
// const router = express.Router();

// const {
//   INSTAGRAM_CLIENT_ID,
//   INSTAGRAM_CLIENT_SECRET,
//   INSTAGRAM_REDIRECT_URI,
//   FRONTEND_URL,
// } = process.env;

// // Step 1: Redirect to Instagram login
// router.get("/login", (req, res) => {
//   const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
//   res.redirect(authUrl);
// });

// // Step 2: Handle callback and exchange code for token

// router.get("/callback", async (req: Request, res: Response) => {
//   const { code } = req.query;

//   if (!code || typeof code !== "string") {
//     return res.status(400).json({ error: "No code provided" });
//   }

//   try {
//     const tokenRes = await axios.post("https://api.instagram.com/oauth/access_token", null, {
//       params: {
//         client_id: process.env.INSTAGRAM_CLIENT_ID!,
//         client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
//         grant_type: "authorization_code",
//         redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
//         code: code,
//       },
//     });

//     const { access_token, user_id } = tokenRes.data;

//     const profileRes = await axios.get(
//       `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${access_token}`
//     );

//     return res.json({
//       access_token,
//       user_id,
//       profile: profileRes.data,
//     });
//   } catch (err: any) {
//     console.error("Token Exchange Failed:", err.response?.data || err.message);
//     return res.status(500).json({ error: "Failed to get access token" });
//   }
// });

// export default router;
