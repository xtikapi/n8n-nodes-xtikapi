# n8n-nodes-xtikapi

Official n8n community node for [XTikAPI](https://xtikapi.com) — fetch public posts, videos, comments, profiles, and trends across **19 social media platforms** (**229 normalized endpoints**) with a single API key.

## Supported Platforms

Douyin, Xiaohongshu (RedNote), WeChat Official Accounts (公众号), WeChat Channels (视频号), Kuaishou, Bilibili, Weibo, Zhihu, Xingtu, Pugongying, TikTok, YouTube, Instagram, X (Twitter), Reddit, Threads, Telegram, LinkedIn.

## Installation

In your self-hosted n8n instance:
1. Open **Settings → Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-xtikapi` and click **Install**

## Credentials

Create an **XTikAPI** credential in n8n and paste your API key (`dk_...`) from [https://xtikapi.com/settings/apikeys](https://xtikapi.com/settings/apikeys) (new accounts include free trial credit, no card required).

## Operations

- **Call Any Endpoint (229 Endpoints)** — Pass any endpoint ID (e.g. `douyin.videos.search`, `xiaohongshu.notes.search`, `wechat_mp.posts.list`, `tiktok.comments.list`) and JSON parameters. Automatically resolves GET/POST, supports `X-Max-Price` budget caps and `Idempotency-Key`.
- **Search Endpoint Catalog (Free)** — Discover endpoints, parameters, and exact per-call USD pricing inside your workflow.

## License

MIT © [XTikAPI](https://xtikapi.com)
