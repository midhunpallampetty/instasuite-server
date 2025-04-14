"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMedia = exports.getProfile = exports.instagramCallback = exports.instagramLogin = void 0;
const axios_1 = __importDefault(require("axios"));
const instagramLogin = (req, res) => {
    const scopes = [
        'user_profile',
        'user_media',
        'instagram_business_manage_comments', // ✅ NEW scope replacing 'instagram_manage_comments'
    ];
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.APP_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=${scopes.join(',')}&response_type=code`;
    res.redirect(authUrl);
};
exports.instagramLogin = instagramLogin;
const instagramCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { code } = req.query;
        console.log('test', req.query);
        const params = new URLSearchParams();
        params.append('client_id', process.env.APP_ID);
        params.append('client_secret', process.env.APP_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', process.env.REDIRECT_URI);
        params.append('code', code);
        const { data } = yield axios_1.default.post('https://api.instagram.com/oauth/access_token', params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        // ✅ Success! Redirect with the token
        res.redirect(`${process.env.FRONTEND_URL}/?token=${data.access_token}`);
    }
    catch (error) {
        console.error('Instagram token exchange error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        res.status(500).json({ error: 'Authentication failed' });
    }
});
exports.instagramCallback = instagramCallback;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { access_token } = req.query;
        const { data } = yield axios_1.default.get(`https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${access_token}`);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
exports.getProfile = getProfile;
// controllers/instagram.ts
const getMedia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
            return res.status(401).json({ error: 'Missing authorization header' });
        }
        const access_token = authHeader.split(' ')[1];
        const { limit = 12, after } = req.query;
        // First get media IDs
        const mediaResponse = yield axios_1.default.get('https://graph.instagram.com/me/media', {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
                access_token,
                limit,
                after
            },
            timeout: 10000
        });
        // Then get details for each media item
        const mediaItems = yield Promise.all(mediaResponse.data.data.map((media) => __awaiter(void 0, void 0, void 0, function* () {
            const itemResponse = yield axios_1.default.get(`https://graph.instagram.com/${media.id}`, {
                params: {
                    fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp',
                    access_token
                }
            });
            return itemResponse.data;
        })));
        res.json({
            data: mediaItems,
            paging: mediaResponse.data.paging
        });
    }
    catch (error) {
        console.error('Media fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch media',
            details: axios_1.default.isAxiosError(error) ? (_a = error.response) === null || _a === void 0 ? void 0 : _a.data : null
        });
    }
});
exports.getMedia = getMedia;
