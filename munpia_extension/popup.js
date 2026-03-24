/**
 * Munpia Popup Logic
 */

let works = [];
let isStopping = false;

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const categoryGroup = document.getElementById('categoryGroup');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressLabel = document.getElementById('progressLabel');
    const statusContainer = document.getElementById('statusContainer');
    const logArea = document.getElementById('logArea');

    // Radio styles
    categoryGroup.addEventListener('change', (e) => {
        document.querySelectorAll('.radio-option').forEach(el => el.classList.remove('selected'));
        if (e.target.checked) e.target.parentElement.classList.add('selected');
    });

    startBtn.onclick = async () => {
        const category = document.querySelector('input[name="category"]:checked').value;
        const targetUrl = category === 'rookie' 
            ? 'https://www.munpia.com/page/j/view/w/best/rookie'
            : 'https://www.munpia.com/page/j/view/w/best/new.novel.today';

        startBtn.disabled = true;
        statusContainer.style.display = 'block';
        works = [];
        isStopping = false;

        try {
            updateLog('Best 목록 페이지로 이동 중...');
            const tab = await chrome.tabs.create({ url: targetUrl, active: false });
            
            // Wait for Best List load
            await waitTabLoaded(tab.id);
            await sleep(3000);

            // Get Top 100 links
            updateLog('작품 링크 추출 중...');
            const { links } = await chrome.tabs.sendMessage(tab.id, { action: 'GET_LINKS' });

            if (!links || links.length === 0) {
                throw new Error('Best 목록을 가져오지 못했습니다.');
            }

            updateLog(`${links.length}개 작품 발견. 분석 시작...`);
            
            for (let i = 0; i < links.length; i++) {
                if (isStopping) break;
                
                const link = links[i];
                const rank = i + 1;
                updateProgress(rank, links.length);
                updateLog(`[${rank}/${links.length}] 분석 중...`);

                try {
                    // Navigate to Novel
                    await chrome.tabs.update(tab.id, { url: link });
                    await waitTabLoaded(tab.id);
                    await sleep(3000 + Math.random() * 1000);

                    // Scrape Info
                    const info = await chrome.tabs.sendMessage(tab.id, { action: 'GET_NOVEL_INFO' });
                    
                    if (info.error) {
                        works.push({
                            순위: rank, 카테고리: category === 'rookie' ? '신인' : '신규',
                            작품명: `[에러] ${info.error}`, 총연재수: 0, 
                            "최신-1조회": 0, "최신-1추천": 0, "연독률분자(L-4)": 0, "연독률분모(O-4)": 0, "연독률(%)": 0
                        });
                        continue;
                    }

                    // Handle Denominator (4th Oldest)
                    let denominator = 0;
                    if (info.lastPageUrl) {
                        // Navigate to first page of series (last page navigation)
                        await chrome.tabs.update(tab.id, { url: info.lastPageUrl });
                        await waitTabLoaded(tab.id);
                        await sleep(3000 + Math.random() * 1000);
                        
                        const denResp = await chrome.tabs.sendMessage(tab.id, { action: 'GET_DENOMINATOR' });
                        denominator = denResp.denominator || 0;
                    } else {
                        // All episodes on current page
                        denominator = info.denominatorCandidate || 0;
                    }

                    const retention = denominator > 0 ? ((info.viewsL4 / denominator) * 100).toFixed(2) : 0;

                    works.push({
                        "순위": rank,
                        "카테고리": category === 'rookie' ? '신인' : '신규',
                        "작품명": info.title,
                        "작가명": info.author,
                        "총연재수": info.totalEps,
                        "최신-1조회": info.viewsL1,
                        "최신-1추천": info.recsL1,
                        "연독률분사(최신-4)": info.viewsL4,
                        "연독률분모(4화)": denominator,
                        "연독률(%)": retention
                    });
                } catch (e) {
                    updateLog(`[Error] ${link}: ${e.message}`);
                }
            }

            updateLog('데이터 추출 완료. 엑셀 다운로드 중...');
            downloadExcel(works, category);

        } catch (e) {
            updateLog(`Error: ${e.message}`);
            console.error(e);
        } finally {
            startBtn.disabled = false;
        }
    };

    function updateLog(msg) {
        logArea.innerText = msg;
    }

    function updateProgress(current, total) {
        const percent = Math.floor((current / total) * 100);
        progressFill.style.width = `${percent}%`;
        progressPercent.innerText = `${current}/${total}`;
        progressLabel.innerText = '처리 중...';
    }

    async function waitTabLoaded(tabId) {
        return new Promise((resolve) => {
            const check = (tId, changeInfo, tab) => {
                if (tId === tabId && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(check);
                    resolve();
                }
            };
            chrome.tabs.onUpdated.addListener(check);
            
            // Check current status just in case it's already complete
            chrome.tabs.get(tabId, (tab) => {
                if (tab.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(check);
                    resolve();
                }
            });

            // Fallback timeout
            setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(check);
                resolve();
            }, 10000); 
        });
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function downloadExcel(data, category) {
        if (!data.length) return;
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Analysis");
        
        const fileName = `munpia_analysis_${category}_${new Date().toISOString().slice(0,10)}.xlsx`;
        
        // Convert to array buffer
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        
        function s2ab(s) {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }

        const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }
});
