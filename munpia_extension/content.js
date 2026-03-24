/**
 * Munpia Content Scraper - Strict Episode Filtering (With Relative Time Support)
 */

console.log('Scraper Ready (Relative Time Support)');

async function scrapePageWithDelay() {
    console.log("--- DEBUG: SCRAPE START ---");
    
    // 2s delay for Dynamic Content
    await new Promise(resolve => setTimeout(resolve, 2000));

    const bodyText = document.body.innerText;
    
    // 1. Serial Count (Metadata)
    let serialCount = 0;
    const serialMatch = bodyText.match(/연재수\s*[:\s]*(\d+)/);
    if (serialMatch) serialCount = parseInt(serialMatch[1]);

    // 2. Extract Episodes
    const episodes = [];
    const allRows = document.querySelectorAll('tr');
    
    // Support Patterns: 
    // - Date: 25.03.24, 03.24
    // - Time: 12:34
    // - Relative: 12분 전, 5시간 전, 어제, 오늘
    const datePatternStr = '(\\d{2}\\.\\d{2}\\.\\d{2}|\\d{2}\\.\\d{2}|\\d{2}:\\d{2}|\\d+분\\s*전|\\d+시간\\s*전|어제|오늘)';
    const rowPattern = new RegExp(`^\\s*(\\d+)\\s+.+?${datePatternStr}\\s+([\\d,]+)\\s+([\\d,]+)`);
    
    allRows.forEach(row => {
        const text = row.innerText.trim();
        
        // Skip notices or meta
        if (text.includes('공지') || text.includes('후기') || text.includes('이벤트') || text.includes('안내')) return;

        try {
            const match = text.match(rowPattern);
            if (match) {
                const epId = parseInt(match[1]);
                // Views and Recommendations are in capture groups 3 and 4 
                // because group 2 is the date/time string.
                const vVal = parseInt(match[3].replace(/[^\d]/g, '')) || 0;
                const rVal = parseInt(match[4].replace(/[^\d]/g, '')) || 0;

                if (vVal > 0) {
                    episodes.push({
                        id: epId,
                        v_count: vVal,
                        r_count: rVal,
                        title: text.substring(match[1].length, text.indexOf(match[2])).trim()
                    });
                }
            }
        } catch (err) {
            console.error("Row Parse Error:", err, text);
        }
    });

    // Fallback line-by-line if table scan fails
    if (episodes.length === 0) {
        const lines = bodyText.split('\n');
        lines.forEach(line => {
            const match = line.match(rowPattern);
            if (match && !line.includes('공지')) {
                episodes.push({
                    id: parseInt(match[1]),
                    v_count: parseInt(match[3].replace(/[^\d]/g, '')),
                    r_count: parseInt(match[4].replace(/[^\d]/g, ''))
                });
            }
        });
    }

    // Sort descending by ID to guarantee Index 0 is Latest
    episodes.sort((a, b) => b.id - a.id);

    return {
        serialCount,
        episodes,
        lastPageUrl: document.querySelector('a[href*="page/"]')?.href || null,
        novelTitle: document.title.split('-')[0].trim() || 'unnamed'
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape") {
        scrapePageWithDelay().then(data => sendResponse(data));
    }
    return true;
});
