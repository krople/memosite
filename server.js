const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 메모 저장소 (메모리 기반)
// 구조: { key: { content: string, createdAt: Date, lastUpdated: Date } }
const memoStore = new Map();

// 주기적으로 만료된 메모 정리
setInterval(() => {
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    for (const [key, data] of memoStore.entries()) {
        // 마지막 업데이트 시간 기준으로 30분 경과 시 삭제
        if (now - data.lastUpdated > thirtyMinutes) {
            memoStore.delete(key);
            console.log(`Expired memo removed: ${key}`);
        }
    }
}, 5 * 60 * 1000); // 5분마다 체크

// 미들웨어
app.use(bodyParser.json());

// 정적 파일 제공 (CSS, JS)
app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/app.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.js'));
});

// 루트 경로에서 index.html 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 키 검증 (4자 이상)
function isValidPassword(password) {
    return typeof password === 'string' && 
           password.length >= 4;
}

// 키 사용 가능 여부 확인
app.post('/api/check-password', (req, res) => {
    const { password } = req.body;
    
    if (!isValidPassword(password)) {
        return res.json({ 
            valid: false, 
            message: '키는 4자 이상이어야 합니다.' 
        });
    }
    
    const exists = memoStore.has(password);
    
    if (exists) {
        return res.json({ 
            valid: false, 
            message: '이미 선택된 키입니다.' 
        });
    }
    
    res.json({ valid: true });
});

// 메모 생성
app.post('/api/memo', (req, res) => {
    const { password, content } = req.body;
    
    if (!isValidPassword(password)) {
        return res.status(400).json({ 
            error: '키는 4자 이상이어야 합니다.' 
        });
    }
    
    // 새 메모 생성 또는 업데이트
    if (!memoStore.has(password)) {
        memoStore.set(password, {
            content: content || '',
            createdAt: Date.now(),
            lastUpdated: Date.now()
        });
    } else {
        const memo = memoStore.get(password);
        memo.content = content || '';
        memo.lastUpdated = Date.now();
    }
    
    res.json({ success: true });
});

// 메모 조회
app.get('/api/memo/:password', (req, res) => {
    const { password } = req.params;
    
    if (!isValidPassword(password)) {
        return res.status(400).json({ 
            error: '유효하지 않은 키입니다.' 
        });
    }
    
    const memo = memoStore.get(password);
    
    if (!memo) {
        return res.status(404).json({ 
            error: '메모를 찾을 수 없습니다.' 
        });
    }
    
    // 마지막 수정 후 30봸 경과 확인
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (now - memo.lastUpdated > thirtyMinutes) {
        memoStore.delete(password);
        return res.status(404).json({ 
            error: '메모가 만료되었습니다.' 
        });
    }
    
    res.json({ 
        content: memo.content,
        createdAt: memo.createdAt,
        lastUpdated: memo.lastUpdated,
        expiresAt: memo.lastUpdated + thirtyMinutes
    });
});

// 메모 업데이트 (실시간 저장)
app.put('/api/memo/:password', (req, res) => {
    const { password } = req.params;
    const { content } = req.body;
    
    if (!isValidPassword(password)) {
        return res.status(400).json({ 
            error: '유효하지 않은 키입니다.' 
        });
    }
    
    const memo = memoStore.get(password);
    
    if (!memo) {
        return res.status(404).json({ 
            error: '메모를 찾을 수 없습니다.' 
        });
    }
    
    // 마지막 수정 후 30분 경과 확인
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (now - memo.lastUpdated > thirtyMinutes) {
        memoStore.delete(password);
        return res.status(404).json({ 
            error: '메모가 만료되었습니다.' 
        });
    }
    
    memo.content = content;
    memo.lastUpdated = Date.now();
    
    res.json({ success: true });
});

// 메모(키) 삭제
app.delete('/api/memo/:password', (req, res) => {
    const { password } = req.params;
    
    if (!isValidPassword(password)) {
        return res.status(400).json({ 
            error: '유효하지 않은 키입니다.' 
        });
    }
    
    const memo = memoStore.get(password);
    
    if (!memo) {
        return res.status(404).json({ 
            error: '메모를 찾을 수 없습니다.' 
        });
    }
    
    // 키 삭제
    memoStore.delete(password);
    console.log(`Key deleted: ${password}`);
    
    res.json({ success: true, message: '키가 삭제되었습니다.' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
