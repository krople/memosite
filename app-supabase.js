// ============================================
// Supabase 설정 - 여기에 직접 입력하세요!
// ============================================
const SUPABASE_CONFIG = {
    url: 'https://zgtzizxgnmhyytyerdhj.supabase.co',  // 예: 'https://xxxxxxxxxxxxx.supabase.co'
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpndHppenhnbm1oeXl0eWVyZGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTMzODcsImV4cCI6MjA3OTcyOTM4N30.GF2adnCmk48E8-bSuelk_1zzL8qzRjoVKUn91wzfaMM'   // 예: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
// ============================================

// Supabase 설정 (파일 설정 우선, 없으면 localStorage, 없으면 프롬프트)
let supabaseUrl = SUPABASE_CONFIG.url || localStorage.getItem('supabaseUrl') || '';
let supabaseKey = SUPABASE_CONFIG.key || localStorage.getItem('supabaseKey') || '';
let supabase = null;

// Supabase 클라이언트 초기화
function initSupabase() {
    if (supabaseUrl && supabaseKey) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        return true;
    }
    return false;
}

// Supabase 설정 확인 및 요청
function checkSupabaseConfig() {
    if (!initSupabase()) {
        const url = prompt('Supabase Project URL을 입력하세요:\n(파일에 직접 설정하려면 app-supabase.js의 SUPABASE_CONFIG를 수정하세요)');
        const key = prompt('Supabase Anon Key를 입력하세요:');
        
        if (url && key) {
            supabaseUrl = url;
            supabaseKey = key;
            localStorage.setItem('supabaseUrl', url);
            localStorage.setItem('supabaseKey', key);
            initSupabase();
            return true;
        }
        return false;
    }
    return true;
}

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
    updateThemeIcon();
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const currentTheme = document.body.getAttribute('data-theme');
    themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
}

themeToggle.addEventListener('click', toggleTheme);

// 키 검증
function validatePassword(password) {
    if (!password || password.trim().length < 4) {
        return '키는 4자 이상이어야 합니다.';
    }
    return null;
}

// 타이머 업데이트
function updateTimer() {
    if (!expiresAt || !currentMemoPassword) {
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
    if (!checkSupabaseConfig()) {
        setKeyError.textContent = 'Supabase 설정이 필요합니다.';
        return;
    }
    
    const password = setKeyInput.value.trim();
    
    const error = validatePassword(password);
    if (error) {
        setKeyError.textContent = error;
        return;
    }
    
    try {
        // 키 사용 가능 여부 확인
        const { data: existingMemo, error: checkError } = await supabase
            .from('memos')
            .select('password')
            .eq('password', password)
            .single();
        
        if (existingMemo) {
            setKeyError.textContent = '이미 선택된 키입니다.';
            return;
        }
        
        // 메모 생성
        const now = new Date();
        const expiresAtDate = new Date(now.getTime() + 30 * 60 * 1000);
        
        const { data, error: insertError } = await supabase
            .from('memos')
            .insert({
                password,
                content: memoEditor.value || '',
                duration_minutes: 30,
                expires_at: expiresAtDate.toISOString()
            })
            .select()
            .single();
        
        if (insertError) throw insertError;
        
        // 메모장 활성화
        currentMemoPassword = password;
        keyButton.textContent = password;
        memoEditor.placeholder = '여기에 메모를 작성하세요...';
        lastSavedContent = memoEditor.value;
        updateCharCount(memoEditor.value);
        
        selectedDuration = 30;
        expiresAt = new Date(data.expires_at).getTime();
        
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

// 키 불러오기
loadKeyBtn.addEventListener('click', async () => {
    if (!checkSupabaseConfig()) {
        loadKeyError.textContent = 'Supabase 설정이 필요합니다.';
        return;
    }
    
    const password = loadKeyInput.value.trim();
    
    const error = validatePassword(password);
    if (error) {
        loadKeyError.textContent = error;
        return;
    }
    
    try {
        const { data, error: fetchError } = await supabase
            .from('memos')
            .select('*')
            .eq('password', password)
            .single();
        
        if (fetchError || !data) {
            loadKeyError.textContent = '존재하지 않는 키입니다.';
            return;
        }
        
        // 만료 확인
        if (new Date(data.expires_at) < new Date()) {
            await supabase.from('memos').delete().eq('password', password);
            loadKeyError.textContent = '메모가 만료되었습니다.';
            return;
        }
        
        currentMemoPassword = password;
        keyButton.textContent = password;
        memoEditor.value = data.content || '';
        memoEditor.placeholder = '여기에 메모를 작성하세요...';
        lastSavedContent = memoEditor.value;
        updateCharCount(memoEditor.value);
        
        selectedDuration = data.duration_minutes || 30;
        expiresAt = new Date(data.expires_at).getTime();
        
        hideModal();
        startTimer();
        memoEditor.focus();
        
        loadKeyInput.value = '';
        loadKeyError.textContent = '';
        setKeyError.textContent = '';
        
    } catch (error) {
        console.error(error);
        loadKeyError.textContent = '오류가 발생했습니다. 다시 시도해주세요.';
    }
});

// 자동 저장
memoEditor.addEventListener('input', () => {
    const content = memoEditor.value;
    updateCharCount(content);
    
    if (!currentMemoPassword) {
        // 로컬 모드: localStorage에 저장
        localStorage.setItem('localMemo', content);
        saveStatus.textContent = '로컬 저장됨';
        return;
    }
    
    if (content === lastSavedContent) {
        return;
    }
    
    saveStatus.textContent = '저장 중...';
    
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    
    saveTimeout = setTimeout(async () => {
        try {
            const { error } = await supabase
                .from('memos')
                .update({
                    content: content,
                    last_updated: new Date().toISOString()
                })
                .eq('password', currentMemoPassword);
            
            if (error) throw error;
            
            lastSavedContent = content;
            saveStatus.textContent = '저장 완료';
        } catch (error) {
            console.error('Save error:', error);
            saveStatus.textContent = '저장 실패';
        }
    }, 500);
});

// 유효시간 설정
document.querySelectorAll('.duration-option').forEach(button => {
    button.addEventListener('click', async () => {
        if (!currentMemoPassword) {
            alert('키를 먼저 설정해주세요.');
            return;
        }
        
        const minutes = parseInt(button.getAttribute('data-minutes'));
        selectedDuration = minutes;
        
        try {
            const expiresAtDate = new Date(Date.now() + minutes * 60 * 1000);
            
            const { data, error } = await supabase
                .from('memos')
                .update({
                    expires_at: expiresAtDate.toISOString(),
                    duration_minutes: minutes
                })
                .eq('password', currentMemoPassword)
                .select()
                .single();
            
            if (error) throw error;
            
            expiresAt = new Date(data.expires_at).getTime();
            updateTimer();
            hideDurationModal();
            
        } catch (error) {
            console.error('Duration update error:', error);
            alert('유효시간 설정에 실패했습니다.');
        }
    });
});

// 키 삭제
async function deleteCurrentKey() {
    if (!currentMemoPassword) return;
    
    if (!confirm('정말로 이 키를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('memos')
            .delete()
            .eq('password', currentMemoPassword);
        
        if (error) throw error;
        
        alert('키가 삭제되었습니다.');
        resetApp();
    } catch (error) {
        console.error('Delete error:', error);
        alert('키 삭제에 실패했습니다.');
    }
}

// 모달 관련
function showModal() {
    keyModal.style.display = 'flex';
    if (currentMemoPassword) {
        setKeyInput.value = currentMemoPassword;
        loadKeyInput.value = '';
    }
}

function hideModal() {
    keyModal.style.display = 'none';
    setKeyInput.value = '';
    loadKeyInput.value = '';
    setKeyError.textContent = '';
    loadKeyError.textContent = '';
}

function showDurationModal() {
    durationModal.style.display = 'flex';
}

function hideDurationModal() {
    durationModal.style.display = 'none';
}

closeModalBtn.addEventListener('click', hideModal);
closeDurationModalBtn.addEventListener('click', hideDurationModal);

keyModal.addEventListener('click', (e) => {
    if (e.target === keyModal) {
        hideModal();
    }
});

durationModal.addEventListener('click', (e) => {
    if (e.target === durationModal) {
        hideDurationModal();
    }
});

keyButton.addEventListener('click', showModal);
timerButton.addEventListener('click', showDurationModal);

// 앱 초기화
function resetApp() {
    currentMemoPassword = null;
    keyButton.textContent = '🔑 키 설정';
    memoEditor.value = localStorage.getItem('localMemo') || '';
    memoEditor.placeholder = '로컬 모드 (키 없이 사용)';
    lastSavedContent = '';
    updateCharCount(memoEditor.value);
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (timerInfo) {
        timerInfo.style.display = 'none';
    }
    timerDisplay.textContent = '⏱️ --:--';
    expiresAt = null;
    
    saveStatus.textContent = '';
}

// 검색 기능
function highlightSearchText(text, searchTerm) {
    if (!searchTerm || searchTerm.length === 0) {
        highlightLayer.innerHTML = '';
        searchCount.textContent = '';
        searchMatches = [];
        currentMatchIndex = -1;
        return;
    }
    
    try {
        const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = [...text.matchAll(regex)];
        searchMatches = matches.map(m => m.index);
        
        if (matches.length === 0) {
            highlightLayer.innerHTML = '';
            searchCount.textContent = '0/0';
            currentMatchIndex = -1;
            return;
        }
        
        let highlightedText = text.replace(regex, match => {
            return `<mark>${match}</mark>`;
        });
        
        highlightedText = highlightedText.replace(/\n/g, '<br>');
        highlightLayer.innerHTML = highlightedText;
        
        currentMatchIndex = 0;
        searchCount.textContent = `1/${matches.length}`;
        scrollToMatch(0);
        
    } catch (e) {
        console.error('Highlight error:', e);
    }
}

function scrollToMatch(index) {
    if (searchMatches.length === 0) return;
    
    const marks = highlightLayer.querySelectorAll('mark');
    if (marks[index]) {
        marks.forEach((m, i) => {
            if (i === index) {
                m.style.backgroundColor = '#ff6b6b';
                m.style.color = 'white';
            } else {
                m.style.backgroundColor = '#ffd43b';
                m.style.color = 'black';
            }
        });
        
        const markRect = marks[index].getBoundingClientRect();
        const containerRect = memoEditor.getBoundingClientRect();
        const scrollTop = memoEditor.scrollTop;
        const offset = markRect.top - containerRect.top + scrollTop - 100;
        
        memoEditor.scrollTop = offset;
    }
}

function navigateSearch(direction) {
    if (searchMatches.length === 0) return;
    
    if (direction === 'down') {
        currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
    } else {
        currentMatchIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    }
    
    searchCount.textContent = `${currentMatchIndex + 1}/${searchMatches.length}`;
    scrollToMatch(currentMatchIndex);
}

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const text = memoEditor.value;
    highlightSearchText(text, searchTerm);
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSearch('down');
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateSearch('up');
    }
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    highlightLayer.innerHTML = '';
    searchCount.textContent = '';
    searchMatches = [];
    currentMatchIndex = -1;
});

memoEditor.addEventListener('scroll', () => {
    highlightLayer.scrollTop = memoEditor.scrollTop;
    highlightLayer.scrollLeft = memoEditor.scrollLeft;
});

// URL 파라미터에서 키 로드
const urlParams = new URLSearchParams(window.location.search);
const urlPassword = urlParams.get('p');

// 초기화
initTheme();
initSupabase();

if (urlPassword) {
    loadKeyInput.value = urlPassword;
    showModal();
} else if (!currentMemoPassword) {
    const localMemo = localStorage.getItem('localMemo');
    if (localMemo) {
        memoEditor.value = localMemo;
        updateCharCount(localMemo);
    }
    memoEditor.placeholder = '로컬 모드 (키 없이 사용)';
}
