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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const index_1 = __importDefault(require("./src/routes/index"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const corsOptions = {
    origin: 'http://localhost:5173', // Your frontend origin
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use((0, cors_1.default)(corsOptions));
app.use('/', index_1.default);
app.get('/api/instagram-profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Missing access token' });
        }
        const response = yield axios_1.default.get('https://graph.instagram.com/me', {
            params: {
                fields: 'id,username,account_type,media_count',
                access_token: token
            }
        });
        res.json(response.data);
    }
    catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}));
app.get('/api/instagram-media', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token)
            return res.status(401).json({ error: 'Unauthorized' });
        const { limit = 5, after } = req.query;
        const mediaResponse = yield axios_1.default.get('https://graph.instagram.com/me/media', {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments.limit(10){id,text,username,timestamp}',
                access_token: token,
                limit,
                after
            }
        });
        const mediaData = mediaResponse.data.data;
        // Fetch comments for each media item
        const mediaWithComments = yield Promise.all(mediaData.map((media) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const commentRes = yield axios_1.default.get(`https://graph.instagram.com/${media.id}/comments`, {
                    params: {
                        access_token: token
                    }
                });
                return Object.assign(Object.assign({}, media), { comments: commentRes.data.data });
            }
            catch (err) {
                return Object.assign(Object.assign({}, media), { comments: [] }); // fallback if comment fetch fails
            }
        })));
        res.json({
            data: mediaWithComments,
            paging: mediaResponse.data.paging
        });
    }
    catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ error: 'Media fetch failed' });
    }
}));
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
