/**
 * Munpia Insight Scraper - Popup Script (Index Correction)
 */

document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    const errorMsg = document.getElementById('error-message');
    
    // UI elements
    const novelTitleEl = document.getElementById('novel-title');
    const serialCountEl = document.getElementById('serial-count');
    const latestVCountEl = document.getElementById('latest-vcount');
    const latestRCountEl = document.getElementById('latest-rcount');
    const readRateEl = document.getElementById('read-rate');
    const nValEl = document.getElementById('n-val');
    const dValEl = document.getElementById('d-val');
    const downloadBtn = document.getElementById('download-btn');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url || !tab.url.includes('munpia.com')) {
            showError("문피아 작품 상세 페이지에서 실행해주세요.");
            return;
        }

        chrome.tabs.sendMessage(tab.id, { action: "scrape" }, async (response) => {
            if (chrome.runtime.lastError || !response || response.error) {
                showError("데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
                return;
            }

            const { serialCount, episodes, lastPageUrl, novelTitle } = response;

            // Ensure we have enough data (Need at least 5 for Latest-4)
            if (!episodes || episodes.length < 5) {
                showError(`분석 가능한 회차가 부족합니다. (수집 성공 에피소드: ${episodes ? episodes.length : 0}개)`);
                return;
            }

            // By now, content.js ensures that episodes[0] is the LATEST episode.
            // 최신 -1화 = episodes[1]
            // 최신 -3화 = episodes[3]

            let lastPageEpisodes = episodes;

            // Optional fetch for the oldest episodes (denominator)
            if (lastPageUrl && !lastPageUrl.includes('/page/1')) {
                try {
                    const fetchRes = await fetch(lastPageUrl);
                    if (fetchRes.ok) {
                        const html = await fetchRes.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const fetched = parseEpisodesFromDoc(doc);
                        if (fetched && fetched.length > 0) {
                            lastPageEpisodes = fetched;
                        }
                    }
                } catch (e) {
                    console.error("Fetch Error:", e);
                }
            }

            // Index Map:
            // index 0: Latest
            // index 1: Latest - 1
            // index 4: Latest - 4
            
            const latest1 = episodes[1]; // 최신 -1화
            const nEp = episodes[3];      // 최신 -3화 (분자)
            
            // 첫 화(Oldest) 기준 4번째 = Oldest + 3
            // If episodes are descending, oldest is at index length-1
            // Oldest+3 = index length-4
            const dEp = lastPageEpisodes[lastPageEpisodes.length - 4]; // Denominator
            
            const vVal1 = latest1.v_count;
            const rVal1 = latest1.r_count;
            const nVal = nEp.v_count;
            const dVal = dEp ? dEp.v_count : 0;

            let rate = 0;
            if (dVal > 0) {
                rate = nVal / dVal;
            }

            // Update UI
            novelTitleEl.innerText = novelTitle;
            serialCountEl.innerText = (serialCount || episodes[0].id).toLocaleString() + "화";
            latestVCountEl.innerText = vVal1.toLocaleString();
            latestRCountEl.innerText = rVal1.toLocaleString();
            readRateEl.innerText = rate.toFixed(4);
            nValEl.innerText = nVal.toLocaleString() + ` (-3화)`;
            dValEl.innerText = dVal.toLocaleString() + ` (첫4화)`;

            statusDiv.classList.add('hidden');
            resultsDiv.classList.remove('hidden');

            window.scrapeData = {
                title: novelTitle, serial: serialCount || episodes[0].id,
                l1v: vVal1, l1r: rVal1, rate: rate.toFixed(4), n: nVal, d: dVal
            };
        });
    } catch (err) {
        showError("오류: " + err.message);
    }

    function showError(msg) {
        statusDiv.classList.add('hidden');
        errorDiv.classList.remove('hidden');
        errorMsg.innerText = msg;
    }

    function parseEpisodesFromDoc(doc) {
        // Use same regex as content.js for consistency
        const rows = doc.querySelectorAll('tr');
        const eps = [];
        const datePatternStr = '(\\d{2}\\.\\d{2}\\.\\d{2}|\\d{2}\\.\\d{2}|\\d{2}:\\d{2}|\\d+분\\s*전|\\d+시간\\s*전|어제|오늘)';
        const pattern = new RegExp(`^\\s*(\\d+)\\s+.+?${datePatternStr}\\s+([\\d,]+)\\s+([\\d,]+)`);
        rows.forEach(row => {
            const text = row.innerText.trim();
            const match = text.match(pattern);
            if (match && !text.includes('공지') && !text.includes('후기')) {
                eps.push({
                    id: parseInt(match[1]),
                    v_count: parseInt(match[3].replace(/[^\d]/g, '')),
                    r_count: parseInt(match[4].replace(/[^\d]/g, ''))
                });
            }
        });
        eps.sort((a,b) => b.id - a.id);
        return eps;
    }

    downloadBtn.addEventListener('click', () => {
        if (!window.scrapeData) return;
        const s = window.scrapeData;
        const headers = ["작품명", "전체 연령수", "최신-1화 조회수", "최신-1화 추천수", "연독률", "최신-3화 조회수", "첫-4화 조회수"];
        const data = [s.title, s.serial, s.l1v, s.l1r, s.rate, s.n, s.d];
        let csv = "\uFEFF" + headers.join(",") + "\n" + data.map(v => `"${v}"`).join(",") + "\n";
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `munpia_stats_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
    });
});
