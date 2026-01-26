# X/Twitter Home Masonry Layout

A browser userscript that transforms X/Twitter's home timeline into a masonry (Pinterest/Instagram-like) layout.

English | [简体中文](docs/README_CN.md)

## Features

- **Masonry Layout**: Transform the traditional single-column timeline into a multi-column masonry grid for more efficient browsing
- **Infinite Scroll**: Automatically load more tweets without manual pagination
- **Rich Media**: Support images, videos, and other multimedia content
- **Complete Information**: Display avatar, username, tweet text, like counts, retweet counts, and more
- **Quick Access**: "Open in X" link to quickly jump to original tweets
- **Auto Update**: Configured with automatic update functionality
- **Zero Backend**: Directly calls X GraphQL API, no server needed

## Installation

1. **Install Tampermonkey Extension**

   - Chrome/Edge: [Tampermonkey](https://www.tampermonkey.net/)
   - Firefox: [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/)
   - Any other compatible userscript manager

2. **Install the Script**

   - Click the link below for one-click installation:
     - [Install X Home Masonry Timeline](https://raw.githubusercontent.com/akayuki39/twitter-masonry/main/home_timeline_masonry.user.js)
   - Or create a new script in Tampermonkey and paste the contents of `home_timeline_masonry.user.js` from the repository

3. **Use the Script**

   - Open [https://x.com/home?tm-masonry=1](https://x.com/home?tm-masonry=1) or [https://twitter.com/home?tm-masonry=1](https://twitter.com/home?tm-masonry=1)
   - Or visit [https://x.com/](https://x.com/) first, then click the "Home 瀑布流" (Home Masonry) button in the bottom right corner to open the masonry view in a new tab

## Usage

### Activation Methods

- **URL Parameter**: Add `?tm-masonry=1` to the X home URL
- **Button Method**: Click the "Home Masonry" button in the bottom right corner while on X

### Browsing Content

- Scroll down to automatically load more tweets
- Click images to view them in full size
- Click usernames to visit their profiles
- Click "Open in X" to view the original tweet in a new tab

## FAQ

**Q: The script isn't working. What should I do?**

A: Please ensure:
- You are logged into your X account
- Your browser has Tampermonkey installed and the script is enabled
- Refresh the page after logging into X

**Q: Getting a 401 error?**

A: This is usually due to expired cookies. Simply log into X again and refresh the masonry page.

**Q: How do I update the script?**

A: The script is configured for automatic updates. Tampermonkey will periodically check and update to the latest version. You can also manually reinstall.

**Q: Which browsers are supported?**

A: Google Chrome, Microsoft Edge, Firefox, Safari, and any browser that supports Tampermonkey.

## Technical Details

- Directly calls X GraphQL `HomeTimeline` API
- Uses your login cookies and official bearer token
- Leverages Tampermonkey's cross-domain capabilities for requests
- Automatically handles CORS and authentication

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Contributing

Issues and Pull Requests are welcome!

## Links

- [GitHub Repository](https://github.com/akayuki39/twitter-masonry)
- [Tampermonkey Official Website](https://www.tampermonkey.net/)
