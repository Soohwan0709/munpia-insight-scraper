# Munpia Stats Analyzer Chrome Extension

A Chrome Extension (Manifest V3) to extract and analyze novel metrics from Munpia.

## Features
- **Total Episodes**: Extracts the total number of episodes (excluding notices/events).
- **Latest Metrics**: Displays view and recommendation counts for the "Latest Episode - 1".
- **Retention Rate (연독률)**: Calculates the ratio of the "Latest Episode - 4" view count to the "4th oldest episode" view count.
- **Background Fetch**: Automatically fetches the first episode list page for complete historical data.
- **Excel Export**: Exports analyzed data to a CSV file.

## Technical Details
- **Architecture**: Manifest V3, Chrome Scripting API, Vanilla JS.
- **Scraping**: Intelligent filtering of '공지' (Notice) and '이벤트' (Event) entries.

## How to Install
1. Open Google Chrome.
2. Go to `chrome://extensions/`.
3. Enable **Developer mode** (top right corner).
4. Click **Load unpacked**.
5. Select this folder: `c:\Users\Windows11\antigravity\munpia_extension`.

## How to Use
1. Visit a Munpia novel's episode list page (e.g., `https://novel.munpia.com/XXXXX`).
2. Click the extension icon in your toolbar.
3. Wait for the analysis to complete.
4. Click "Download to Excel (CSV)" to save the data.

## Note
The extension requires at least 5 episodes to perform the full metric calculation. If the novel has fewer than 5 episodes, it will display an error message.
