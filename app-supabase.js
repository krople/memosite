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

const searchToggleBtn = document.getElementById('search-toggle-btn');
const headerLeft = document.querySelector('.header-left');

const findInput = document.getElementById('find-input');
const replaceInput = document.getElementById('replace-input');
const replaceBtn = document.getElementById('replace-btn');
const undoBtn = document.getElementById('undo-btn');
const hidePasswordCheckbox = document.getElementById('hide-password-checkbox');
const hideLoadPasswordCheckbox = document.getElementById('hide-load-password-checkbox');

let currentMemoPassword = null;
let isPasswordHidden = false;
let isLoadPasswordHidden = false;
let saveTimeout = null;
let timerInterval = null;
let expiresAt = null;
let lastSavedContent = '';
let selectedDuration = 30; // 기본 30분

// 실행취소 히스토리
let undoHistory = [];
let isUndoing = false;
const MAX_HISTORY = 50;

// 토스트 알림 함수
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

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
    themeToggle.textContent = currentTheme === 'light' ? 'D' : 'L';
}

themeToggle.addEventListener('click', toggleTheme);

// 검색/일괄수정 토글 기능 (모바일 전용)
searchToggleBtn.addEventListener('click', () => {
    headerLeft.classList.toggle('collapsed');
    
    // 아이콘 변경 (▼: 펼치기, ▲: 접기)
    if (headerLeft.classList.contains('collapsed')) {
        searchToggleBtn.textContent = '▼';
        searchToggleBtn.title = '검색 표시';
    } else {
        searchToggleBtn.textContent = '▲';
        searchToggleBtn.title = '검색 숨김';
    }
});

// 모바일에서 초기 상태를 collapsed로 설정
if (window.innerWidth <= 768) {
    headerLeft.classList.add('collapsed');
    searchToggleBtn.textContent = '▼';
    searchToggleBtn.title = '검색 표시';
}

// 글자 가리기 토글 (키 설정)
hidePasswordCheckbox.addEventListener('change', (e) => {
    isPasswordHidden = e.target.checked;
    
    // 키 설정 입력창 타입 변경
    setKeyInput.type = isPasswordHidden ? 'password' : 'text';
    
    // KEY 버튼 업데이트
    if (currentMemoPassword) {
        updateKeyButton(currentMemoPassword);
    }
});

// 글자 가리기 토글 (키 불러오기)
hideLoadPasswordCheckbox.addEventListener('change', (e) => {
    isLoadPasswordHidden = e.target.checked;
    
    // 키 불러오기 입력창 타입 변경
    loadKeyInput.type = isLoadPasswordHidden ? 'password' : 'text';
});

// 키 검증
function validatePassword(password) {
    if (!password || password.trim().length < 4) {
        return '키는 4자 이상이어야 합니다.';
    }
    return null;
}

// 키 버튼 텍스트 업데이트 (길이 제한)
function updateKeyButton(password) {
    if (isPasswordHidden) {
        const dotCount = Math.min(password.length, 12);
        keyButton.textContent = '•'.repeat(dotCount);
        if (password.length > 12) {
            keyButton.innerHTML = '•'.repeat(12) + '<span style="color: #ff8c00;">...</span>';
        }
        return;
    }
    
    const maxLength = 12;
    if (password.length > maxLength) {
        const truncated = password.substring(0, maxLength);
        keyButton.innerHTML = `${truncated}<span style="color: #ff8c00;">...</span>`;
    } else {
        keyButton.textContent = password;
    }
}

// 타이머 업데이트
function updateTimer() {
    if (!expiresAt || !currentMemoPassword) {
        timerButton.disabled = true;
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
        timerDisplay.textContent = `⏱️ ${hours}:${minutes.toString().padStart(2, '0')} (h)`;
    } else {
        timerDisplay.textContent = `⏱️ ${totalMinutes}:${seconds.toString().padStart(2, '0')} (m)`;
    }
}

function startTimer() {
    timerButton.disabled = false;
    if (timerInterval) clearInterval(timerInterval);
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

// 키 설정 입력창에서 엔터 키로 설정
setKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        setKeyBtn.click();
    }
});

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
        // 메모 생성 (중복 시 에러 발생)
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
        
        if (insertError) {
            if (insertError.code === '23505') { // unique constraint violation
                setKeyError.textContent = '이미 선택된 키입니다.';
                return;
            }
            throw insertError;
        }
        
        // 메모장 활성화
        currentMemoPassword = password;
        updateKeyButton(password);
        memoEditor.placeholder = '여기에 메모를 작성하세요...';
        memoEditor.value = ''; // 새 키 생성 시 메모 내용 초기화
        lastSavedContent = '';
        updateCharCount('');
        
        // 로컬 저장소 초기화
        localStorage.removeItem('localMemo');
        
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

// 키 불러오기 입력창에서 엔터 키로 불러오기
loadKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        loadKeyBtn.click();
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
        updateKeyButton(password);
        memoEditor.value = data.content || '';
        memoEditor.placeholder = '여기에 메모를 작성하세요...';
        lastSavedContent = memoEditor.value;
        updateCharCount(memoEditor.value);
        
        // 로컬 저장소 초기화
        localStorage.removeItem('localMemo');
        
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
    
    // 하이라이트 업데이트
    if (findInput.value) {
        highlightMatches(findInput.value);
    }
    
    // 실행취소 히스토리에 추가 (실행취소 중이 아닐 때만)
    if (!isUndoing && (undoHistory.length === 0 || undoHistory[undoHistory.length - 1] !== content)) {
        undoHistory.push(content);
        if (undoHistory.length > MAX_HISTORY) {
            undoHistory.shift();
        }
    }
    
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
const deleteKeyBtn = document.getElementById('delete-key-btn');

deleteKeyBtn.addEventListener('click', async () => {
    if (!currentMemoPassword) {
        alert('삭제할 키가 없습니다.');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('memos')
            .delete()
            .eq('password', currentMemoPassword);
        
        if (error) throw error;
        
        // 완전히 삭제 (로컬 포함)
        memoEditor.value = '';
        updateCharCount('');
        localStorage.removeItem('localMemo');
        showToast('키와 메모가 삭제되었습니다');
        
        // KEY 버튼으로 초기화
        currentMemoPassword = null;
        keyButton.textContent = 'KEY';
        memoEditor.placeholder = '여기에 메모를 작성하세요...';
        
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerButton.disabled = true;
        timerDisplay.textContent = '⏱️ --:--';
        expiresAt = null;
        
        saveStatus.textContent = '';
        hideDurationModal();
        showModal();
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('키 삭제에 실패했습니다.');
    }
});

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
    keyButton.textContent = 'KEY';
    memoEditor.value = localStorage.getItem('localMemo') || '';
    memoEditor.placeholder = '여기에 메모를 작성하세요...';
    lastSavedContent = '';
    updateCharCount(memoEditor.value);
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerButton.disabled = true;
    timerDisplay.textContent = '⏱️ --:--';
    expiresAt = null;
    
    saveStatus.textContent = '';
}

// 단어 일괄 수정 기능
let highlightedMatches = [];
let currentHighlightIndex = 0;
const findCount = document.getElementById('find-count');

// 하이라이트 적용 함수
function highlightMatches(searchText) {
    removeHighlights();
    
    const content = memoEditor.value;
    if (!searchText || !content) return;
    
    const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    
    // 임시로 하이라이트 표시를 위한 마크 삽입
    let highlightedContent = content.replace(regex, (match) => {
        return `<mark class="find-highlight">${match}</mark>`;
    });
    
    // textarea 뒤에 하이라이트 레이어 생성
    let highlightLayer = document.querySelector('.highlight-layer');
    if (!highlightLayer) {
        highlightLayer = document.createElement('div');
        highlightLayer.className = 'highlight-layer';
        memoEditor.parentNode.insertBefore(highlightLayer, memoEditor);
    }
    
    highlightLayer.innerHTML = highlightedContent;
    highlightLayer.scrollTop = memoEditor.scrollTop;
}

// 하이라이트 제거 함수
function removeHighlights() {
    const highlightLayer = document.querySelector('.highlight-layer');
    if (highlightLayer) {
        highlightLayer.remove();
    }
}

// textarea 스크롤 시 하이라이트 레이어도 동기화
memoEditor.addEventListener('scroll', () => {
    const highlightLayer = document.querySelector('.highlight-layer');
    if (highlightLayer) {
        highlightLayer.scrollTop = memoEditor.scrollTop;
    }
});

// 찾을 단어 입력 시 하이라이트
findInput.addEventListener('input', () => {
    const findText = findInput.value;
    
    if (!findText) {
        // 입력이 비어있으면 하이라이트 제거
        removeHighlights();
        highlightedMatches = [];
        findCount.textContent = '';
        return;
    }
    
    const currentContent = memoEditor.value;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = [...currentContent.matchAll(regex)];
    
    if (matches.length > 0) {
        highlightedMatches = matches;
        findCount.textContent = `${matches.length}개`;
        
        // 하이라이트 적용
        highlightMatches(findText);
        
        // 첫 번째 매치 스크롤 (포커스를 빼앗지 않도록 setTimeout 사용)
        setTimeout(() => {
            const firstMatch = matches[0];
            const currentFocus = document.activeElement;
            if (currentFocus === findInput || currentFocus === replaceInput) {
                // 입력창에 포커스가 있으면 선택하지 않음
                return;
            }
            memoEditor.setSelectionRange(firstMatch.index, firstMatch.index + firstMatch[0].length);
            memoEditor.scrollTop = Math.max(0, (firstMatch.index / currentContent.length) * memoEditor.scrollHeight - memoEditor.clientHeight / 2);
        }, 0);
    } else {
        highlightedMatches = [];
        findCount.textContent = '0개';
        removeHighlights();
    }
});

replaceBtn.addEventListener('click', () => {
    const findText = findInput.value;
    const replaceText = replaceInput.value;
    
    if (!findText) {
        showToast('찾을 단어를 입력하세요');
        return;
    }
    
    // 바꿀 단어가 비어있으면 확인 요청
    if (!replaceText) {
        if (!confirm('바꿀 단어가 비어있습니다.\n찾은 단어를 모두 지우시겠습니까?')) {
            return;
        }
    }
    
    const currentContent = memoEditor.value;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = currentContent.match(regex);
    
    if (!matches || matches.length === 0) {
        showToast('찾을 단어가 없습니다');
        return;
    }
    
    const newContent = currentContent.replace(regex, replaceText);
    
    // 히스토리에 변경 전 상태 저장
    if (undoHistory.length === 0 || undoHistory[undoHistory.length - 1] !== currentContent) {
        undoHistory.push(currentContent);
        if (undoHistory.length > MAX_HISTORY) {
            undoHistory.shift();
        }
    }
    
    // 변경 후 상태도 히스토리에 추가
    undoHistory.push(newContent);
    if (undoHistory.length > MAX_HISTORY) {
        undoHistory.shift();
    }
    
    memoEditor.value = newContent;
    updateCharCount(newContent);
    
    // 자동 저장
    if (currentMemoPassword) {
        saveMemo(newContent);
    } else {
        localStorage.setItem('localMemo', newContent);
        saveStatus.textContent = '로컬 저장됨';
    }
    
    showToast(`${matches.length}개 항목 변경됨`);
    
    // 입력창 초기화
    findInput.value = '';
    replaceInput.value = '';
    findCount.textContent = '';
    highlightedMatches = [];
    removeHighlights();
});

// 실행취소 기능
undoBtn.addEventListener('click', () => {
    if (undoHistory.length <= 1) {
        showToast('실행취소할 내용이 없습니다');
        return;
    }
    
    isUndoing = true;
    undoHistory.pop(); // 현재 상태 제거
    const previousContent = undoHistory[undoHistory.length - 1];
    
    memoEditor.value = previousContent;
    updateCharCount(previousContent);
    
    // 자동 저장
    if (currentMemoPassword) {
        saveMemo(previousContent);
    } else {
        localStorage.setItem('localMemo', previousContent);
        saveStatus.textContent = '로컬 저장됨';
    }
    
    showToast('실행취소됨');
    
    setTimeout(() => {
        isUndoing = false;
    }, 100);
});

// Ctrl+Z 키보드 단축키
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoBtn.click();
    }
});

// 엔터 키로 수정 실행
findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        replaceInput.focus();
    }
});

replaceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        replaceBtn.click();
    }
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
