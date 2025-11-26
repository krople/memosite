// DOM 요소
const keyModal = document.getElementById('key-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const setKeyInput = document.getElementById('set-key-input');
const setKeyBtn = document.getElementById('set-key-btn');
const setKeyError = document.getElementById('set-key-error');
const loadKeyInput = document.getElementById('load-key-input');
const loadKeyBtn = document.getElementById('load-key-btn');
const loadKeyError = document.getElementById('load-key-error');

const keyButton = document.getElementById('key-button');
const timerInfo = document.getElementById('timer-info');
const timerButton = document.getElementById('timer-button');
const timerDisplay = document.getElementById('timer-display');
const durationModal = document.getElementById('duration-modal');
const closeDurationModalBtn = document.getElementById('close-duration-modal-btn');
const themeToggle = document.getElementById('theme-toggle');
const memoEditor = document.getElementById('memo-editor');
const saveStatus = document.getElementById('save-status');
const charCount = document.getElementById('char-count');
const charCountNoSpace = document.getElementById('char-count-no-space');

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const searchCount = document.getElementById('search-count');
const highlightLayer = document.getElementById('highlight-layer');

let currentMemoPassword = null;
let saveTimeout = null;
let timerInterval = null;
let expiresAt = null;
let lastSavedContent = '';
let searchMatches = [];
let currentMatchIndex = -1;
let selectedDuration = 30; // 기본 30분

// 글자 수 업데이트 함수
function updateCharCount(text) {
    const totalChars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    charCount.textContent = `${totalChars}자`;
    if (charCountNoSpace) {
        charCountNoSpace.textContent = `${charsNoSpace}자(공백제외)`;
    }
}

// 테마 전환 기능
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// 테마 토글 버튼 이벤트
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// 모달 표시/숨기기
function showModal() {
    // 이미 키가 설정되어 있으면 새 키 설정 칸에 현재 키 표시
    if (currentMemoPassword) {
        setKeyInput.value = currentMemoPassword;
    }
    keyModal.classList.add('active');
}

function hideModal() {
    keyModal.classList.remove('active');
}

// 키 검증
function validatePassword(password) {
    if (!password) {
        return '키를 입력해주세요.';
    }
    if (password.length < 4) {
        return '키는 4자 이상이어야 합니다.';
    }
    return null;
}

// 타이머 업데이트
function updateTimer() {
    if (!expiresAt) {
        if (timerInfo) {
            timerInfo.style.display = 'none';
        }
        timerDisplay.textContent = '⏱️ --:--';
        return;
    }
    
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) {
        clearInterval(timerInterval);
        alert('메모가 만료되었습니다.');
        resetApp();
        return;
    }
    
    const totalMinutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    // 1시간(60분) 이상이면 시간:분 형식, 이하면 분:초 형식
    if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        timerDisplay.textContent = `⏱️ ${hours}:${minutes.toString().padStart(2, '0')}`;
    } else {
        timerDisplay.textContent = `⏱️ ${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function startTimer() {
    if (timerInfo) {
        timerInfo.style.display = 'block';
    }
    if (timerInterval) clearInterval(timerInterval);
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

// 키 설정 (새 메모 생성)
setKeyBtn.addEventListener('click', async () => {
    const password = setKeyInput.value.trim();
    
    const error = validatePassword(password);
    if (error) {
        setKeyError.textContent = error;
        return;
    }
    
    try {
        // 키 사용 가능 여부 확인
        const checkResponse = await fetch('/api/check-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const checkData = await checkResponse.json();
        
        if (!checkData.valid) {
            setKeyError.textContent = checkData.message;
            return;
        }
        
        // 메모 생성
        const createResponse = await fetch('/api/memo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, content: memoEditor.value })
        });
        
        if (!createResponse.ok) {
            throw new Error('메모 생성 실패');
        }
        
        // 메모장 활성화 (기존 내용 유지)
        currentMemoPassword = password;
        keyButton.textContent = password;
        // memoEditor.value는 그대로 유지
        memoEditor.placeholder = '여기에 메모를 작성하세요...';
        lastSavedContent = memoEditor.value;
        updateCharCount(memoEditor.value);
        
        // 기본 유효시간 30분 적용
        selectedDuration = 30;
        expiresAt = Date.now() + 30 * 60 * 1000;
        
        hideModal();
        startTimer();
        memoEditor.focus();
        
        setKeyInput.value = '';
        setKeyError.textContent = '';
        loadKeyError.textContent = '';
        saveStatus.textContent = '저장 완료';
        
    } catch (error) {
        console.error(error);
        setKeyError.textContent = '오류가 발생했습니다. 다시 시도해주세요.';
    }
});

// 키 불러오기 (기존 메모 조회)
loadKeyBtn.addEventListener('click', async () => {
    const password = loadKeyInput.value.trim();
    
    const error = validatePassword(password);
    if (error) {
        loadKeyError.textContent = error;
        return;
    }
    
    try {
        const response = await fetch(`/api/memo/${password}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '메모를 찾을 수 없습니다.');
        }
        
        const data = await response.json();
        
        // 메모장 활성화
        currentMemoPassword = password;
        keyButton.textContent = password;
        memoEditor.value = data.content;
        memoEditor.placeholder = '여기에 메모를 작성하세요...';
        lastSavedContent = data.content;
        charCount.textContent = `${data.content.length}자`;
        expiresAt = data.expiresAt;
        
        hideModal();
        startTimer();
        memoEditor.focus();
        
        loadKeyInput.value = '';
        setKeyError.textContent = '';
        loadKeyError.textContent = '';
        
    } catch (error) {
        console.error(error);
        loadKeyError.textContent = error.message;
    }
});

// Enter 키로 키 설정/불러오기
setKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        setKeyBtn.click();
    }
});

loadKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadKeyBtn.click();
    }
});

// 키 버튼 클릭 (모달 열기)
keyButton.addEventListener('click', () => {
    showModal();
});

// 타이머 버튼 클릭 (유효시간 설정 모달 열기)
if (timerButton) {
    timerButton.addEventListener('click', () => {
        if (currentMemoPassword) {
            durationModal.classList.add('active');
        }
    });
}

// 유효시간 모달 닫기
if (closeDurationModalBtn) {
    closeDurationModalBtn.addEventListener('click', () => {
        durationModal.classList.remove('active');
    });
}

// 유효시간 옵션 클릭
document.querySelectorAll('.duration-option').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!currentMemoPassword) return;
        
        const minutes = parseInt(btn.dataset.minutes);
        selectedDuration = minutes;
        expiresAt = Date.now() + minutes * 60 * 1000;
        
        // 서버에 저장 (만료 시간 업데이트)
        try {
            const response = await fetch(`/api/memo/${currentMemoPassword}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: memoEditor.value })
            });
            
            if (response.ok) {
                updateTimer();
                durationModal.classList.remove('active');
            }
        } catch (error) {
            console.error(error);
            alert('유효시간 설정 실패');
        }
    });
});

// 모달 X 버튼 (모달 닫기)
closeModalBtn.addEventListener('click', () => {
    hideModal();
});

// 검색 기능
let searchTimeout = null;

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightSearchText(searchText) {
    const content = memoEditor.value;
    highlightLayer.textContent = '';
    searchMatches = [];
    currentMatchIndex = -1;
    searchCount.textContent = '';
    
    if (!searchText || !content) {
        return;
    }
    
    // 모든 매치 찾기
    const regex = new RegExp(escapeRegExp(searchText), 'gi');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        searchMatches.push({
            index: match.index,
            length: searchText.length
        });
    }
    
    if (searchMatches.length === 0) {
        searchCount.textContent = '0/0';
        return;
    }
    
    // 하이라이트 표시
    let lastIndex = 0;
    let highlightedText = '';
    
    searchMatches.forEach((match, idx) => {
        // 매치 이전 텍스트
        highlightedText += content.substring(lastIndex, match.index);
        // 하이라이트된 텍스트
        const isFirst = idx === 0;
        highlightedText += `<mark class="highlight${isFirst ? ' current' : ''}">${content.substring(match.index, match.index + match.length)}</mark>`;
        lastIndex = match.index + match.length;
    });
    
    // 나머지 텍스트
    highlightedText += content.substring(lastIndex);
    
    highlightLayer.innerHTML = highlightedText;
    
    // 첫 번째 매치로 이동
    if (searchMatches.length > 0) {
        currentMatchIndex = 0;
        scrollToMatch(0);
        searchCount.textContent = `1/${searchMatches.length}`;
    }
}

function scrollToMatch(index) {
    if (index < 0 || index >= searchMatches.length) return;
    
    const match = searchMatches[index];
    const content = memoEditor.value;
    
    // textarea에서 위치 계산
    const beforeText = content.substring(0, match.index);
    const lines = beforeText.split('\n');
    const lineNumber = lines.length;
    
    // 스크롤 위치 조정
    const lineHeight = parseFloat(getComputedStyle(memoEditor).lineHeight);
    const scrollTop = (lineNumber - 1) * lineHeight - 100;
    
    memoEditor.scrollTop = Math.max(0, scrollTop);
    
    // 하이라이트 레이어 동기화
    highlightLayer.scrollTop = memoEditor.scrollTop;
    
    // 검색창에 포커스를 다시 돌려줌
    setTimeout(() => searchInput.focus(), 0);
}

function navigateSearch(direction) {
    if (searchMatches.length === 0) return;
    
    // 현재 하이라이트 제거
    const highlights = highlightLayer.querySelectorAll('.highlight');
    highlights.forEach(h => h.classList.remove('current'));
    
    // 다음/이전 매치로 이동
    if (direction === 'next') {
        currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
    } else {
        currentMatchIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    }
    
    // 새 하이라이트 추가
    if (highlights[currentMatchIndex]) {
        highlights[currentMatchIndex].classList.add('current');
    }
    
    scrollToMatch(currentMatchIndex);
    searchCount.textContent = `${currentMatchIndex + 1}/${searchMatches.length}`;
}

// 메모장 스크롤 시 하이라이트 레이어 동기화
memoEditor.addEventListener('scroll', () => {
    highlightLayer.scrollTop = memoEditor.scrollTop;
    highlightLayer.scrollLeft = memoEditor.scrollLeft;
});

// 메모장 크기 변경 시 하이라이트 레이어 동기화
const syncHighlightSize = () => {
    highlightLayer.style.width = memoEditor.offsetWidth + 'px';
    highlightLayer.style.height = memoEditor.offsetHeight + 'px';
};

window.addEventListener('resize', syncHighlightSize);
setTimeout(syncHighlightSize, 100);

searchInput.addEventListener('input', () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        const searchText = searchInput.value.trim();
        highlightSearchText(searchText);
    }, 300);
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSearch('next');
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateSearch('prev');
    } else if (e.key === 'Enter') {
        e.preventDefault();
        navigateSearch('next');
    }
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    highlightLayer.textContent = '';
    searchMatches = [];
    currentMatchIndex = -1;
    searchCount.textContent = '';
    memoEditor.focus();
});

// 실시간 저장
memoEditor.addEventListener('input', () => {
    const content = memoEditor.value;
    updateCharCount(content);
    
    // 검색 중이면 하이라이트 업데이트
    const searchText = searchInput.value.trim();
    if (searchText) {
        highlightSearchText(searchText);
    }
    
    // 키가 설정되어 있을 때만 서버에 저장
    if (!currentMemoPassword) {
        saveStatus.textContent = '로컬 전용';
        return;
    }
    
    // 내용이 변경되었을 때만 저장
    if (content !== lastSavedContent) {
        saveStatus.textContent = '저장 중...';
        saveStatus.className = 'saving';
        
        if (saveTimeout) clearTimeout(saveTimeout);
        
        saveTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/memo/${currentMemoPassword}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
                
                if (response.ok) {
                    lastSavedContent = content;
                    saveStatus.textContent = '저장 완료';
                    saveStatus.className = '';
                    
                    // 저장 성공 시 만료 시간 업데이트 (마지막 수정 시간 + 30분)
                    expiresAt = Date.now() + 30 * 60 * 1000;
                } else {
                    throw new Error('저장 실패');
                }
            } catch (error) {
                console.error(error);
                saveStatus.textContent = '저장 실패';
                saveStatus.className = 'error';
            }
        }, 500); // 0.5초 후 저장
    }
});

// 앱 초기화
function resetApp() {
    currentMemoPassword = null;
    expiresAt = null;
    keyButton.textContent = 'KEY';
    memoEditor.value = '';
    // 메모장과 검색창은 항상 활성화 상태 유지
    // memoEditor.disabled = true;
    memoEditor.placeholder = '여기에 메모를 작성하세요...';
    searchInput.value = '';
    // searchInput.disabled = true;
    saveStatus.textContent = '로컬 전용';
    updateCharCount('');
    lastSavedContent = '';
    setKeyInput.value = '';
    loadKeyInput.value = '';
    setKeyError.textContent = '';
    loadKeyError.textContent = '';
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    if (timerInfo) {
        timerInfo.style.display = 'none';
    }
    timerDisplay.textContent = '⏱️ --:--';
    showModal();
}

// URL 파라미터로 키가 전달된 경우 (모바일 접속)
window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const password = urlParams.get('password') || urlParams.get('p');
    
    if (password) {
        // 자동으로 키 불러오기
        loadKeyInput.value = password;
        loadKeyBtn.click();
    } else {
        // 키 없이 시작하면 로컬 전용 모드
        saveStatus.textContent = '로컬 전용';
    }
});

// 페이지 이탈 시 경고 (메모 작성 중일 때만)
window.addEventListener('beforeunload', (e) => {
    if (currentMemoPassword && memoEditor.value.trim()) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// 페이지 로드 시 테마 초기화
initTheme();
