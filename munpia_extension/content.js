/**
 * Munpia Content Script
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_LINKS') {
        const links = Array.from(document.querySelectorAll('a.novel-wrap, .recommend-line-2 a, .best-list a'))
            .map(a => a.href)
            .filter(href => href.includes('novel.munpia.com/'))
            .filter((v, i, a) => a.indexOf(v) === i); // Unique
        
        sendResponse({ links: links.slice(0, 100) });
    } 
    
    else if (request.action === 'GET_NOVEL_INFO') {
        try {
            const title = document.querySelector('.detail-box h2 a, h2 a, .novel-title')?.innerText.trim() || 'Unknown Title';
            const author = document.querySelector('.author strong, .novel-author')?.innerText.trim() || 'Unknown Author';
            
            // Robust Total Episodes extraction
            let totalEps = 0;
            const metaSelectors = ['.detail-box .meta-data', '.novel-info .meta-data', '.meta-data', '.box-detail-info'];
            for (let sel of metaSelectors) {
                const text = document.querySelector(sel)?.innerText || '';
                const match = text.match(/연재수\s*:\s*([\d,]+)/);
                if (match) {
                    totalEps = parseInt(match[1].replace(/,/g, ''));
                    break;
                }
            }

            // Get valid episode rows (excluding notices)
            const rows = Array.from(document.querySelectorAll('#episodeList tr, .section-table tr, .episode-table tr')).filter(row => {
                const isNotice = row.classList.contains('notice') || 
                                row.classList.contains('event') ||
                                row.querySelector('.ico.notice, .ico.event') ||
                                row.innerText.includes('공지') || 
                                row.innerText.includes('이벤트');
                const hasLink = row.querySelector('a[href*="/neSrl/"]');
                return hasLink && !isNotice;
            });

            // Fallback for totalEps from first row if still 0
            if (totalEps === 0 && rows.length > 0) {
                const firstNum = rows[0].querySelector('td:first-child, .num')?.innerText.trim();
                if (firstNum && !isNaN(firstNum.replace(/,/g, ''))) {
                    totalEps = parseInt(firstNum.replace(/,/g, ''));
                }
            }

            if (totalEps > 0 && totalEps < 5) {
                return sendResponse({ error: '데이터 부족 (5화 미만)' });
            }
            if (totalEps === 0) {
                return sendResponse({ error: '연재수 확인 불가' });
            }

            if (rows.length < 2) {
                return sendResponse({ error: '회차 목록 로딩 실패' });
            }

            // Latest-1 (2nd valid row)
            const rowL1 = rows[1]; 
            const viewsL1 = parseInt(rowL1.querySelector('td:nth-child(4), .v-count, .hit, .view')?.innerText.replace(/,/g, '') || '0');
            const recsL1 = parseInt(rowL1.querySelector('td:nth-child(5), .r-count, .rec, .recommend')?.innerText.replace(/,/g, '') || '0');

            // Latest-4 (5th valid row)
            const rowL4 = rows.length >= 5 ? rows[4] : rows[rows.length - 1];
            const viewsL4 = parseInt(rowL4.querySelector('td:nth-child(4), .v-count, .hit, .view')?.innerText.replace(/,/g, '') || '0');

            // Check for last page button
            const lastPageBtn = document.querySelector('.pagination a.end, a[title="끝쪽"], .page-end');
            const lastPageUrl = lastPageBtn ? lastPageBtn.href : null;

            sendResponse({
                title,
                author,
                totalEps,
                viewsL1,
                recsL1,
                viewsL4,
                lastPageUrl,
                rowsCountOnCurrent: rows.length,
                denominatorCandidate: rows.length >= 4 ? parseInt(rows[rows.length - 4].querySelector('td:nth-child(4), .v-count, .hit, .view')?.innerText.replace(/,/g, '') || '0') : null
            });
        } catch (e) {
            sendResponse({ error: e.message });
        }
    }

    else if (request.action === 'GET_DENOMINATOR') {
        try {
            const rows = Array.from(document.querySelectorAll('#episodeList tr, .section-table tr, .episode-table tr')).filter(row => {
                const isNotice = row.classList.contains('notice') || 
                                row.classList.contains('event') ||
                                row.querySelector('.ico.notice, .ico.event') ||
                                row.innerText.includes('공지') || 
                                row.innerText.includes('이벤트');
                const hasLink = row.querySelector('a[href*="/neSrl/"]');
                return hasLink && !isNotice;
            });

            if (rows.length < 4) {
                // If fewer than 4 episodes on the last page, we take the oldest available (the very bottom)
                const targetRow = rows[rows.length - 1];
                const denominator = parseInt(targetRow.querySelector('td:nth-child(4), .v-count, .hit, .view')?.innerText.replace(/,/g, '') || '0');
                return sendResponse({ denominator });
            }

            const row4 = rows[rows.length - 4];
            const denominator = parseInt(row4.querySelector('td:nth-child(4), .v-count, .hit, .view')?.innerText.replace(/,/g, '') || '0');

            sendResponse({ denominator });
        } catch (e) {
            sendResponse({ error: e.message });
        }
    }
    
    return true; // Keep channel open for async
});
