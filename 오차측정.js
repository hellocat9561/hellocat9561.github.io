(function() {
    try {
        // --- Trusted Types 정책 생성 (가장 안정적인 방식) ---
        // 정책을 window 객체에 저장하여, 스크립트를 여러 번 실행해도 충돌하지 않도록 방지합니다.
        if (!window.myCustomPolicy) {
            try {
                // 이 블록은 페이지 로드 후 최초 실행 시에만 작동합니다.
                window.myCustomPolicy = trustedTypes.createPolicy('my-shadow-dom-policy#1', {
                    createHTML: string => string,
                });
            } catch (e) {
                // Trusted Types를 지원하지 않거나, 다른 이유로 실패하면 null로 설정합니다.
                window.myCustomPolicy = null;
            }
        }

        // HTML 생성을 위한 안전한 래퍼(wrapper) 함수
        const createHTML = (html) => {
            if (window.myCustomPolicy) {
                return window.myCustomPolicy.createHTML(html);
            }
            return html;
        };


        // --- 이전에 만든 요소들 제거 ---
        document.getElementById('my-window-container')?.remove();
        document.getElementById('my-reopen-button')?.remove();
        document.getElementById('my-reopen-style')?.remove();

        // --- 1. Shadow DOM을 담을 컨테이너 만들기 ---
        const container = document.createElement('div');
        container.id = 'my-window-container';
        document.body.appendChild(container);

        // --- 2. Shadow Root 생성 및 격리된 공간 활성화 ---
        const shadowRoot = container.attachShadow({ mode: 'open' });

        // --- 3. 드래그 가능한 창과 모든 요소를 Shadow DOM 내부에 생성 ---
        const windowDiv = document.createElement('div');
        windowDiv.id = 'my-draggable-window';
        
        const headerDiv = document.createElement('div');
        headerDiv.id = 'my-window-header';
        headerDiv.innerHTML = createHTML('<span>🚀 서버 시간 측정기</span>');

        const closeButton = document.createElement('button');
        closeButton.title = '숨기기';
        closeButton.innerHTML = createHTML('×');

        const contentDiv = document.createElement('div');
        contentDiv.id = 'my-window-content';
        
        // --- 여기에 새로운 UI 요소들을 정의합니다 ---
        const contentHTML = `
            <fieldset>
                <legend>1. 측정 대상 선택</legend>
                <div class="radio-group">
                    <label><input type="radio" name="website" value="navyism" checked> 네이비즘</label>
                    <label><input type="radio" name="website" value="timeseeker"> 타임씨커</label>
                </div>
            </fieldset>
            <fieldset>
                <legend>2. 측정 설정</legend>
                <div class="input-group">
                    <label for="interval">간격(ms):</label>
                    <input type="number" id="interval" value="100" min="10">
                </div>
                <div class="input-group">
                    <label for="count">횟수:</label>
                    <input type="number" id="count" value="10" min="1">
                </div>
            </fieldset>
            <button id="measure-button">측정 시작</button>
            <div id="log-console-wrapper">
                <pre id="log-console"></pre>
            </div>
            <div id="result-area" class="hidden">
                <p>평균 오차</p>
                <span id="result-value"></span>
                <button id="copy-button">복사하기</button>
            </div>
        `;
        contentDiv.innerHTML = createHTML(contentHTML);

        // --- 4. CSS 스타일을 Shadow DOM 내부에 직접 삽입 ---
        const styles = `
            /* 기본 창 스타일 */
            :host { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
            #my-draggable-window {
                position: fixed; top: 100px; left: 100px; width: 350px;
                background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 2147483647;
                color: #333; display: flex; flex-direction: column;
                transition: opacity 0.2s, transform 0.2s;
            }
            #my-window-header {
                padding: 10px 15px; cursor: move; background-color: #f7f7f7;
                border-bottom: 1px solid #e0e0e0; border-top-left-radius: 10px;
                border-top-right-radius: 10px; display: flex;
                justify-content: space-between; align-items: center; user-select: none;
                font-weight: 600; color: #555;
            }
            #my-window-header > button {
                cursor: pointer; border: none; background: transparent;
                font-size: 24px; font-weight: 300; color: #999; padding: 0 5px; line-height: 1;
            }
            #my-window-header > button:hover { color: #333; }
            #my-window-content { padding: 15px; }

            /* 측정 UI 스타일 */
            fieldset { border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
            legend { font-size: 14px; font-weight: 600; padding: 0 5px; color: #007bff; }
            .radio-group, .input-group { display: flex; align-items: center; margin-bottom: 8px; }
            .radio-group label { margin-right: 15px; cursor: pointer; font-size: 14px; }
            .input-group label { width: 80px; font-size: 14px; }
            input[type="number"] { width: calc(100% - 90px); padding: 6px; border: 1px solid #ccc; border-radius: 4px; }
            
            #measure-button {
                width: 100%; padding: 10px; font-size: 16px; font-weight: 600;
                color: white; background-color: #007bff; border: none;
                border-radius: 6px; cursor: pointer; transition: background-color 0.2s;
            }
            #measure-button:hover { background-color: #0056b3; }
            #measure-button:disabled { background-color: #a0a0a0; cursor: not-allowed; }

            #log-console-wrapper {
                background-color: #2b2b2b; color: #a9b7c6; border-radius: 6px;
                margin-top: 15px; padding: 5px 0; max-height: 150px; overflow-y: auto;
            }
            #log-console { margin: 0; padding: 5px 10px; font-family: "SF Mono", "Consolas", monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all; }
            
            #result-area {
                margin-top: 15px; padding: 15px; border: 2px dashed #007bff;
                border-radius: 6px; text-align: center;
            }
            #result-area p { margin: 0 0 5px; font-size: 14px; color: #555; }
            #result-value { font-size: 36px; font-weight: 700; color: #d9534f; }
            #copy-button {
                display: block; margin: 10px auto 0; padding: 5px 15px;
                font-size: 13px; color: #007bff; background: #e7f3ff;
                border: 1px solid #007bff; border-radius: 15px; cursor: pointer;
            }
            #copy-button:hover { background: #d0e7ff; }
            .hidden { display: none; }
        `;
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        
        // --- 5. 생성된 모든 요소를 Shadow DOM에 추가 ---
        headerDiv.appendChild(closeButton);
        windowDiv.appendChild(headerDiv);
        windowDiv.appendChild(contentDiv);
        shadowRoot.appendChild(styleSheet);
        shadowRoot.appendChild(windowDiv);

        // --- '다시 열기' 버튼은 여전히 body에 직접 추가 ---
        const reopenButton = document.createElement('button');
        reopenButton.id = 'my-reopen-button';
        reopenButton.innerHTML = createHTML('🚀 측정기 열기');
        const reopenStyleSheet = document.createElement('style');
        reopenStyleSheet.id = 'my-reopen-style';
        reopenStyleSheet.textContent = `
            #my-reopen-button {
                position: fixed; bottom: 20px; right: 20px;
                z-index: 2147483647; padding: 10px 15px; font-size: 14px;
                font-weight: bold; color: white; background-color: #007bff;
                border: none; border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                cursor: pointer; display: none; transition: transform 0.2s ease;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            #my-reopen-button:hover { background-color: #0056b3; transform: scale(1.05); }
        `;
        document.head.appendChild(reopenStyleSheet);
        document.body.appendChild(reopenButton);
        

        // --- 6. 기능 구현 ---
        
        // --- 드래그 기능 ---
        let isDragging = false;
        let offsetX, offsetY;

        headerDiv.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = windowDiv.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                windowDiv.style.left = `${e.clientX - offsetX}px`;
                windowDiv.style.top = `${e.clientY - offsetY}px`;
            }
        });
        document.addEventListener('mouseup', () => { isDragging = false; });

        // --- 숨기기/보이기 기능 ---
        closeButton.addEventListener('click', () => {
            container.style.display = 'none'; // 컨테이너 자체를 숨김
            reopenButton.style.display = 'block';
        });
        reopenButton.addEventListener('click', () => {
            container.style.display = 'block';
            reopenButton.style.display = 'none';
        });

        // --- 측정 기능 로직 ---
        const measureButton = shadowRoot.querySelector('#measure-button');
        const logConsole = shadowRoot.querySelector('#log-console');
        const resultArea = shadowRoot.querySelector('#result-area');
        const resultValue = shadowRoot.querySelector('#result-value');
        const copyButton = shadowRoot.querySelector('#copy-button');

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const log = (message) => {
            logConsole.textContent += message + '\n';
            logConsole.parentElement.scrollTop = logConsole.parentElement.scrollHeight; // 자동 스크롤
        };

        measureButton.addEventListener('click', async () => {
            measureButton.disabled = true;
            measureButton.textContent = '측정 중...';
            logConsole.textContent = ''; // 로그 초기화
            resultArea.classList.add('hidden'); // 이전 결과 숨기기

            const website = shadowRoot.querySelector('input[name="website"]:checked').value;
            const interval = parseInt(shadowRoot.querySelector('#interval').value) || 100;
            const count = parseInt(shadowRoot.querySelector('#count').value) || 10;
            
            log(`■ 대상: ${website}`);
            log(`■ 설정: ${interval}ms 간격, ${count}회 측정`);
            log('------------------------------------');

            const differences = [];

            for (let i = 0; i < count; i++) {
                try {
                    let pageTimestamp;
                    const computerTimestamp = new Date().getTime(); [2]

                    if (website === 'navyism') {
                        const timeStr = document.getElementById("time_area")?.textContent;
                        if (!timeStr) throw new Error("네이비즘 시간 요소(#time_area)를 찾을 수 없습니다.");
                        
                        const parts = timeStr.match(/\d+/g);
                        if (!parts || parts.length < 6) throw new Error("네이비즘 시간 형식이 올바르지 않습니다.");
                        
                        const msecEl = document.getElementById("msec_area");
                        // ★★★ BUG FIX: msecEl.textContent가 비어있을 때 parseInt가 NaN을 반환하는 문제 수정 ★★★
                        const milliseconds = msecEl ? (parseInt(msecEl.textContent) || 0) : 0;
                        
                        const pageDate = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5], milliseconds);
                        pageTimestamp = pageDate.getTime();

                    } else if (website === 'timeseeker') {
                        const timeEl = document.getElementsByClassName("countup-body")[0];
                        if (!timeEl) throw new Error("타임씨커 시간 요소(.countup-body)를 찾을 수 없습니다.");
                        
                        const timeStr = timeEl.textContent.replaceAll('\t','').replaceAll('\n','');
                        const parts = timeStr.match(/\d+/g);
                        if (!parts || parts.length < 6) throw new Error("타임씨커 시간 형식이 올바르지 않습니다.");
                        
                        const pageDate = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
                        pageTimestamp = pageDate.getTime();
                    }
                    
                    if (isNaN(pageTimestamp)) throw new Error("시간을 숫자로 변환하는 데 실패했습니다 (Invalid Date).");

                    const difference = pageTimestamp - computerTimestamp;
                    differences.push(difference);
                    log(`${i + 1}회차: ${difference > 0 ? '+' : ''}${difference}ms`);

                } catch (error) {
                    log(`${i + 1}회차 측정 실패: ${error.message}`);
                }
                
                if (i < count - 1) {
                    await sleep(interval);
                }
            }

            log('------------------------------------');

            if (differences.length > 0) {
                const sum = differences.reduce((acc, val) => acc + val, 0);
                const average = sum / differences.length;
                
                resultValue.textContent = `${average > 0 ? '+' : ''}${average.toFixed(2)}ms`;
                resultArea.classList.remove('hidden');
                log(`✅ 측정 완료! 평균 오차: ${average.toFixed(2)}ms`);
            } else {
                log('❌ 모든 측정에 실패했습니다. 페이지 요소를 확인해주세요.');
            }
            
            measureButton.disabled = false;
            measureButton.textContent = '다시 측정';
        });

        copyButton.addEventListener('click', () => {
            const textToCopy = resultValue.textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert(`'${textToCopy}' 복사 완료!`);
            }).catch(err => {
                console.error('복사 실패:', err);
                alert('복사에 실패했습니다. 콘솔을 확인해주세요.');
            });
        });

        console.log("✅ Shadow DOM으로 보호된 측정기가 생성되었습니다.");

    } catch (err) {
        console.error("❌ 스크립트 실행 중 오류가 발생했습니다:", err.message, err.stack);
    }
})()