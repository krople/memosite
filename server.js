require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase 클라이언트 초기화
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 주기적으로 만료된 메모 정리 (5분마다)
setInterval(async () => {
    try {
        const { error } = await supabase
            .from('memos')
            .delete()
            .lt('expires_at', new Date().toISOString());
        
        if (error) {
            console.error('Error cleaning expired memos:', error);
        } else {
            console.log('Expired memos cleaned');
        }
    } catch (err) {
        console.error('Cleanup error:', err);
    }
}, 5 * 60 * 1000)

// 미들웨어
app.use(bodyParser.json());

// 루트 경로에서 index.html 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 정적 파일 제공
app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/app.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.js'));
});

// 키 검증 (4자 이상)
function isValidPassword(password) {
    return typeof password === 'string' && 
           password.length >= 4;
}

// 키 사용 가능 여부 확인
app.post('/api/check-password', async (req, res) => {
    const { password } = req.body;
    
    if (!isValidPassword(password)) {
        return res.json({ 
            valid: false, 
            message: '키는 4자 이상이어야 합니다.' 
        });
    }
    
    try {
        const { data, error } = await supabase
            .from('memos')
            .select('password')
            .eq('password', password)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
        }
        
        const exists = !!data;
        
        if (exists) {
            return res.json({ 
                valid: false, 
                message: '이미 선택된 키입니다.' 
            });
        }
        
        res.json({ valid: true });
    } catch (error) {
        console.error('Error checking password:', error);
        res.status(500).json({ 
            valid: false, 
            message: '오류가 발생했습니다.' 
        });
    }
});

// 메모 생성
app.post('/api/memo', async (req, res) => {
    const { password, content, duration = 30 } = req.body;
    
    if (!isValidPassword(password)) {
        return res.status(400).json({ 
            error: '키는 4자 이상이어야 합니다.' 
        });
    }
    
    try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + duration * 60 * 1000);
        
        const { data, error } = await supabase
            .from('memos')
            .insert({
                password,
                content: content || '',
                duration_minutes: duration,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        res.json({ 
            success: true,
            expiresAt: data.expires_at
        });
    } catch (error) {
        console.error('Error creating memo:', error);
        res.status(500).json({ error: '메모 생성에 실패했습니다.' });
    }
});

// 메모 조회
app.get('/api/memo/:password', async (req, res) => {
    const { password } = req.params;
    
    if (!isValidPassword(password)) {
        return res.status(400).json({ 
            error: '유효하지 않은 키입니다.' 
        });
    }
    
    try {
        const { data, error } = await supabase
            .from('memos')
            .select('*')
            .eq('password', password)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
            }
            throw error;
        }
        
        // 만료 확인
        if (new Date(data.expires_at) < new Date()) {
            // 만료된 메모 삭제
            await supabase
                .from('memos')
                .delete()
                .eq('password', password);
            
            return res.status(404).json({ error: '메모가 만료되었습니다.' });
        }
        
        res.json({
            content: data.content,
            expiresAt: data.expires_at,
            durationMinutes: data.duration_minutes
        });
    } catch (error) {
        console.error('Error fetching memo:', error);
        res.status(500).json({ error: '메모 조회에 실패했습니다.' });
    }
});

// 메모 업데이트 (실시간 저장)
app.put('/api/memo/:password', async (req, res) => {
    const { password } = req.params;
    const { content, duration } = req.body;
    
    if (!isValidPassword(password)) {
        return res.status(400).json({ 
            error: '유효하지 않은 키입니다.' 
        });
    }
    
    try {
        const updateData = {
            content,
            last_updated: new Date().toISOString()
        };
        
        // duration이 제공되면 만료 시간도 업데이트
        if (duration !== undefined) {
            const expiresAt = new Date(Date.now() + duration * 60 * 1000);
            updateData.expires_at = expiresAt.toISOString();
            updateData.duration_minutes = duration;
        }
        
        const { data, error } = await supabase
            .from('memos')
            .update(updateData)
            .eq('password', password)
            .select()
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
            }
            throw error;
        }
        
        res.json({ 
            success: true,
            expiresAt: data.expires_at
        });
    } catch (error) {
        console.error('Error updating memo:', error);
        res.status(500).json({ error: '메모 업데이트에 실패했습니다.' });
    }
});

// 메모(키) 삭제
app.delete('/api/memo/:password', async (req, res) => {
    const { password } = req.params;
    
    if (!isValidPassword(password)) {
        return res.status(400).json({ 
            error: '유효하지 않은 키입니다.' 
        });
    }
    
    try {
        const { error } = await supabase
            .from('memos')
            .delete()
            .eq('password', password);
        
        if (error) {
            throw error;
        }
        
        console.log(`Key deleted: ${password}`);
        res.json({ success: true, message: '키가 삭제되었습니다.' });
    } catch (error) {
        console.error('Error deleting memo:', error);
        res.status(500).json({ error: '메모 삭제에 실패했습니다.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
