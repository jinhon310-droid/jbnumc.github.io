document.addEventListener("DOMContentLoaded", () => {
  const SERVER_URL = ''; // 서버의 현재 주소로 API 요청을 보냅니다.

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

  const quillHosts = Array.from(document.querySelectorAll('.quill-editor'));
  const editables = Array.from(document.querySelectorAll('.editable[data-key]'));
  const images = Array.from(document.querySelectorAll('img[data-storage-key]'));

  quillHosts.forEach((host) => {
    const q = new Quill(host, { theme: 'snow', modules: { toolbar: toolbarOptions } });
    host.__quill = q;
  });

  async function loadContentFromServer() {
    try {
      const response = await fetch(`${SERVER_URL}/api/content`);
      if (!response.ok) throw new Error('서버에서 데이터를 불러오는 데 실패했습니다.');
      const data = await response.json();

      quillHosts.forEach((host) => {
        const key = host.dataset.key;
        if (data[key]) {
          try {
            host.__quill.setContents(JSON.parse(data[key]));
          } catch (e) {
            console.error('Quill JSON 파싱 오류', e);
          }
        }
      });

      editables.forEach(elem => {
        const key = elem.dataset.key;
        if (data[key]) {
          elem.innerHTML = data[key];
        }
      });
      
      images.forEach(img => {
        const key = img.dataset.storageKey;
        if (data[key]) {
          img.src = data[key];
        }
      });
      console.log('콘텐츠 로드 성공!');
    } catch (error) {
      console.error('콘텐츠 로드 오류:', error);
      alert('콘텐츠 로드에 실패했습니다. 서버가 실행 중인지 확인하세요.');
    }
  }

  async function saveContent() {
    const contentToSave = {};

    quillHosts.forEach((host) => {
      const key = host.dataset.key;
      contentToSave[key] = JSON.stringify(host.__quill.getContents());
    });
    
    editables.forEach(elem => {
      const key = elem.dataset.key;
      contentToSave[key] = elem.innerHTML;
    });

    images.forEach(img => {
      const key = img.dataset.storageKey;
      contentToSave[key] = img.src;
    });

    try {
      const response = await fetch(`${SERVER_URL}/api/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentToSave)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || '저장 실패');
      alert('콘텐츠가 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('콘텐츠 저장 오류:', error);
      alert('콘텐츠 저장에 실패했습니다. 서버가 실행 중인지 확인하세요.');
    }
  }

  const adminPassword = "test";
  const toggleBtn = document.getElementById('toggle-edit-mode');
  const saveBtn = document.getElementById('save-content');
  
  if (saveBtn) saveBtn.addEventListener('click', saveContent);

  function setEditing(on) {
    document.body.classList.toggle('editing', on);
    quillHosts.forEach(host => host.__quill.enable(on));
    editables.forEach(elem => elem.setAttribute('contenteditable', on ? 'true' : 'false'));
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
          saveContent();
        }
      };
      reader.readAsDataURL(file);
    });
  });

  loadContentFromServer();
});

function changePassword() {
  const newPassword = prompt("새로운 편집자 모드 비밀번호를 입력하세요:");
  if (newPassword) {
    alert("죄송합니다. 현재 버전에서는 비밀번호 변경 기능이 지원되지 않습니다.");
  }
}
