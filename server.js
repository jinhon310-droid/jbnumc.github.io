const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000; // 서버가 실행될 포트 번호
const DB_FILE = path.join(__dirname, 'db.json'); // 데이터를 저장할 파일

// 미들웨어 설정
app.use(cors()); // CORS 정책 허용 (다른 주소에서의 요청을 받기 위함)
app.use(express.json({ limit: '10mb' })); // 요청 본문의 JSON 파싱, 이미지 데이터(Base64)를 위해 용량 제한 늘리기

// 초기 데이터 파일 생성 (파일이 없을 경우)
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

// (GET) 저장된 웹사이트 콘텐츠를 불러오는 API
app.get('/api/content', (req, res) => {
  fs.readFile(DB_FILE, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: '데이터를 읽는 중 오류 발생' });
    }
    res.json(JSON.parse(data));
  });
});

// (POST) 웹사이트 콘텐츠를 서버에 저장하는 API
app.post('/api/content', (req, res) => {
  const newContent = req.body;

  // 1. 기존 데이터 파일을 읽어옵니다.
  fs.readFile(DB_FILE, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: '데이터를 읽는 중 오류 발생' });
    }

    let existingContent = {};
    try {
      existingContent = JSON.parse(data);
    } catch (e) {
      console.error('JSON 파싱 오류:', e);
      // 기존 파일이 비어있거나 유효한 JSON이 아니면 빈 객체로 시작합니다.
    }

    // 2. 새로운 콘텐츠를 기존 콘텐츠와 병합합니다.
    const updatedContent = { ...existingContent, ...newContent };

    // 3. 병합된 데이터를 다시 파일에 씁니다. (가독성을 위해 2칸 들여쓰기)
    fs.writeFile(DB_FILE, JSON.stringify(updatedContent, null, 2), 'utf8', (err) => {
      if (err) {
        return res.status(500).json({ message: '데이터 저장 중 오류 발생' });
      }
      res.json({ message: '콘텐츠가 성공적으로 서버에 저장되었습니다.' });
    });
  });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});