document.addEventListener("DOMContentLoaded", () => {
  const SERVER_URL = 'https://port-0-jbnumc-mfcb8jgf2ab5add5.sel3.cloudtype.app'; // 우리가 만든 서버 주소

  const toolbarOptions = [
    [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'header': 1 }, { 'header': 2 }, "blockquote"],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ];

  // 각 편집 요소들을 변수에 저장
  const quillHosts = Array.from(document.querySelectorAll('.quill-editor'));
  const editables = Array.from(document.querySelectorAll('.editable[data-key]'));
  const images = Array.from(document.querySelectorAll('img[data-storage-key]'));

  // Quill 에디터 초기화
  quillHosts.forEach((host) => {
    const q = new Quill(host, { theme: 'snow', modules: { toolbar: toolbarOptions } });
    host.__quill = q;
  });

  // 서버에서 콘텐츠를 로드하여 페이지에 적용하는 함수
  async function loadContentFromServer() {
    try {
      const response = await fetch(`${SERVER_URL}/api/content`);
      if (!response.ok) throw new Error('서버에서 데이터를 불러오는 데 실패했습니다.');
      const content = await response.json();

      // Quill 에디터 내용 적용
      quillHosts.forEach(host => {
        const key = host.dataset.key;
        if (content[`quill::${key}`]) {
          host.__quill.root.innerHTML = content[`quill::${key}`];
        }
      });

      // 일반 편집 가능 영역 내용 적용
      editables.forEach(el => {
        const key = el.dataset.key;
        if (content[`editable::${key}`]) {
          el.innerHTML = content[`editable::${key}`];
        }
      });

      // 이미지 소스 적용
      images.forEach(img => {
        const key = img.dataset.storageKey;
        if (content[`img::${key}`]) {
          img.src = content[`img::${key}`];
        }
      });

    } catch (error) {
      console.error('콘텐츠 로드 오류:', error);
      // alert('페이지 콘텐츠를 불러오는 데 실패했습니다.');
    }
  }

  // 저장 버튼 이벤트 리스너 (서버로 데이터 전송)
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const contentToSave = {};

      quillHosts.forEach(host => {
        const key = host.dataset.key;
        contentToSave[`quill::${key}`] = host.__quill.root.innerHTML;
      });
      editables.forEach(el => {
        const key = el.dataset.key;
        contentToSave[`editable::${key}`] = el.innerHTML;
      });
      images.forEach(img => {
        const key = img.dataset.storageKey;
        contentToSave[`img::${key}`] = img.src;
      });

      try {
        const response = await fetch(`${SERVER_URL}/api/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contentToSave)
        });
        if (!response.ok) throw new Error('저장에 실패했습니다.');
        
        const result = await response.json();
        alert('성공적으로 저장되었습니다.');
        console.log(result.message);

      } catch (error) {
        console.error('저장 오류:', error);
        alert('서버에 저장하는 중 오류가 발생했습니다.');
      }
    });
  }

  // --- 기존 편집 모드 토글 및 기타 기능 (수정 없음) ---
  let adminPassword = localStorage.getItem("site::admin-password") || "admin123";
  function changePassword() {
    const newPw = prompt("새 비밀번호를 입력하세요 (4자 이상):");
    if (newPw && newPw.length >= 4) {
      localStorage.setItem("site::admin-password", newPw);
      adminPassword = newPw;
      alert("비밀번호가 변경되었습니다.");
    }
  }

  const toggleBtn = document.getElementById('editToggle');
  function setEditing(on) {
    document.body.classList.toggle('editing', on);
    quillHosts.forEach(h => on ? h.__quill.enable() : h.__quill.disable());
    editables.forEach(el => el.setAttribute('contenteditable', on ? 'true' : 'false'));
    if (saveBtn) saveBtn.style.display = on ? 'inline-block' : 'none';
    if (toggleBtn) toggleBtn.textContent = on ? '✅ 편집자 모드 끄기' : '✏️ 편집자 모드 켜기';
    if (toggleBtn) toggleBtn.dataset.editing = on ? '1' : '0';
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isEditing = toggleBtn.dataset.editing === '1';
      if (isEditing) {
        setEditing(false);
      } else {
        const password = prompt('편집자 모드 비밀번호를 입력하세요:');
        if (password === adminPassword) setEditing(true);
        else alert('비밀번호가 올바르지 않습니다.');
      }
    });
  }

  const pwBtn = document.createElement("button");
  pwBtn.textContent = "🔑 비밀번호 변경";
  pwBtn.className = "btn edit-only";
  pwBtn.addEventListener("click", changePassword);
  document.querySelector(".nav-links")?.appendChild(pwBtn);

  document.querySelectorAll('input[type="file"][data-target]').forEach(input => {
    input.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      const selector = input.dataset.target;
      const target = document.querySelector(selector);
      reader.onload = ev => {
        if (target) {
            target.src = ev.target.result;
        }
      };
      reader.readAsDataURL(file);
      input.value = '';
    });
  });

  // 페이지가 로드될 때 서버에서 콘텐츠를 불러오도록 실행
  loadContentFromServer();
  // 초기 상태는 읽기 전용으로 설정
  setEditing(false);
});
