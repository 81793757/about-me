
// ===================================
// 1. Supabase 연결
// ===================================

const SUPABASE_URL = "https://xgtayflyjvfrardjuyao.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable__GHFHwEcFohwLf-I_ftbtA_gdAB4t6t";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let isAdmin = false;

// ===================================
// 2. 방명록 불러오기
// ===================================

async function loadGuestbook() {
  const list = document.getElementById("guestbook-list");
  const status = document.getElementById("guestbook-status");

  status.textContent = "방명록을 불러오는 중...";
  list.replaceChildren();

  const { data, error } = await db
    .from("guestbook")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    status.textContent = "방명록을 불러오지 못했습니다.";
    console.error(error);
    return;
  }

  status.textContent = data.length
    ? `총 ${data.length}개의 방명록`
    : "아직 작성된 방명록이 없습니다.";

  data.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "guestbook-item";

    const name = document.createElement("div");
    name.className = "guest-name";
    name.textContent = entry.name;

    const date = document.createElement("div");
    date.className = "guest-date";
    date.textContent = new Date(
      entry.created_at
    ).toLocaleString("ko-KR");

    const message = document.createElement("div");
    message.className = "guest-message";
    message.textContent = entry.message;

    item.append(name, date, message);

    // 관리자에게만 삭제 버튼 표시
    if (isAdmin) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.textContent = "삭제";

      deleteButton.addEventListener("click", () => {
        deleteGuestbook(entry.id);
      });

      item.appendChild(deleteButton);
    }

    list.appendChild(item);
  });
}

// ===================================
// 3. 방명록 작성
// ===================================

document
  .getElementById("guestbook-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameInput = document.getElementById("guest-name");
    const messageInput = document.getElementById("guest-message");
    const status = document.getElementById("guestbook-status");
    const submitButton = event.currentTarget.querySelector(
      'button[type="submit"]'
    );

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) {
      status.textContent = "닉네임과 메시지를 입력해주세요.";
      return;
    }

    if (name.length > 30 || message.length > 500) {
      status.textContent = "입력 가능한 글자 수를 초과했습니다.";
      return;
    }

    submitButton.disabled = true;
    status.textContent = "등록 중...";

    const { error } = await db
      .from("guestbook")
      .insert([{ name, message }]);

    submitButton.disabled = false;

    if (error) {
      status.textContent = "등록에 실패했습니다.";
      console.error(error);
      return;
    }

    nameInput.value = "";
    messageInput.value = "";

    status.textContent = "방명록이 등록되었습니다!";

    await loadGuestbook();
  });

// ===================================
// 4. 관리자 로그인
// ===================================

document
  .getElementById("admin-login-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-password").value;
    const status = document.getElementById("admin-status");

    status.textContent = "로그인 중...";

    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      status.textContent = "로그인에 실패했습니다.";
      console.error(error);
      return;
    }

    isAdmin = true;

    document.getElementById("admin-login-form").hidden = true;
    document.getElementById("admin-logout").hidden = false;

    status.textContent = "관리자로 로그인했습니다.";

    await loadGuestbook();
  });

// ===================================
// 5. 관리자 로그아웃
// ===================================

document
  .getElementById("admin-logout")
  .addEventListener("click", async () => {
    await db.auth.signOut();

    isAdmin = false;

    document.getElementById("admin-login-form").hidden = false;
    document.getElementById("admin-logout").hidden = true;
    document.getElementById("admin-status").textContent =
      "로그아웃했습니다.";

    await loadGuestbook();
  });

// ===================================
// 6. 방명록 삭제
// ===================================

async function deleteGuestbook(id) {
  if (!isAdmin) return;

  if (!confirm("이 방명록을 삭제할까요?")) return;

  const { error } = await db
    .from("guestbook")
    .delete()
    .eq("id", id);

  if (error) {
    alert("삭제에 실패했습니다.");
    console.error(error);
    return;
  }

  await loadGuestbook();
}

// ===================================
// 7. 로그인 상태 복원
// ===================================

async function initializeGuestbook() {
  const { data } = await db.auth.getSession();

  isAdmin = Boolean(data.session);

  if (isAdmin) {
    document.getElementById("admin-login-form").hidden = true;
    document.getElementById("admin-logout").hidden = false;
  }

  await loadGuestbook();
}

db.auth.onAuthStateChange((event, session) => {
  isAdmin = Boolean(session);

  document.getElementById("admin-login-form").hidden = isAdmin;
  document.getElementById("admin-logout").hidden = !isAdmin;

  loadGuestbook();
});

initializeGuestbook();
