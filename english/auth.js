(() => {
  'use strict';

  const cfg = window.EDAN_SUPABASE_CONFIG;
  if (!cfg || !window.supabase?.createClient) {
    console.warn('Supabase auth is not available.');
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const STORE_KEY = 'edanEnglishAdaptiveLabV2';
  let currentUser = null;
  let cloudReady = false;
  let saveTimer = null;
  let pendingState = null;
  let currentFactorId = null;
  let currentChallengeId = null;
  let enrollingFactorId = null;

  const $ = id => document.getElementById(id);
  const esc = (s='') => String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  function setAuthMessage(message, tone='neutral') {
    const el = $('authMessage');
    if (!el) return;
    el.className = 'auth-message show ' + tone;
    el.textContent = message;
  }

  function clearAuthMessage() {
    const el = $('authMessage');
    if (!el) return;
    el.className = 'auth-message';
    el.textContent = '';
  }

  function showAuthView(view) {
    document.querySelectorAll('[data-auth-view]').forEach(el => el.classList.add('hidden'));
    const target = document.querySelector('[data-auth-view="' + view + '"]');
    target?.classList.remove('hidden');
    document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.authTab === view));
    clearAuthMessage();
  }

  function lockApp() {
    document.body.classList.add('auth-locked');
    $('authGate')?.classList.remove('hidden');
  }

  function unlockApp() {
    document.body.classList.remove('auth-locked');
    $('authGate')?.classList.add('hidden');
  }

  async function getAAL() {
    const { data, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) throw error;
    return data;
  }

  async function listVerifiedTotp() {
    const { data, error } = await client.auth.mfa.listFactors();
    if (error) throw error;
    return (data?.totp || []).filter(f => f.status === 'verified');
  }

  async function ensureMFA() {
    const factors = await listVerifiedTotp();
    const aal = await getAAL();

    if (factors.length && aal.currentLevel !== 'aal2') {
      currentFactorId = factors[0].id;
      showAuthView('mfa-challenge');
      lockApp();
      $('mfaChallengeHint').textContent = '請輸入 Authenticator App 的 6 位數驗證碼。';
      return false;
    }

    if (!factors.length) {
      showAuthView('mfa-enroll');
      lockApp();
      $('mfaEnrollIntro')?.classList.remove('hidden');
      $('mfaEnrollSetup')?.classList.add('hidden');
      return false;
    }

    return true;
  }

  async function fetchCloudState() {
    if (!currentUser) return null;
    const { data, error } = await client
      .from('learning_state')
      .select('state,updated_at,state_version')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function upsertCloudState(state) {
    if (!currentUser || !state) return;
    const payload = JSON.parse(JSON.stringify(state));
    const { error } = await client.from('learning_state').upsert({
      user_id: currentUser.id,
      state: payload,
      state_version: 1
    }, { onConflict: 'user_id' });
    if (error) throw error;
    const sync = $('cloudSyncStatus');
    if (sync) sync.textContent = '已同步 ' + new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});
  }

  async function loadOrMigrateState() {
    const cloud = await fetchCloudState();
    const localRaw = localStorage.getItem(STORE_KEY);

    if (cloud?.state && Object.keys(cloud.state).length) {
      localStorage.setItem(STORE_KEY, JSON.stringify(cloud.state));
      window.dispatchEvent(new CustomEvent('edan:cloud-state', { detail: { state: cloud.state } }));
      return;
    }

    if (localRaw) {
      try {
        const localState = JSON.parse(localRaw);
        await upsertCloudState(localState);
        await logEvent('local_state_migrated', { source: 'localStorage' }, 'migration-v1');
        window.dispatchEvent(new CustomEvent('edan:cloud-state', { detail: { state: localState } }));
        return;
      } catch (e) {
        console.warn('Local migration failed', e);
      }
    }

    window.dispatchEvent(new CustomEvent('edan:cloud-state', { detail: { state: null } }));
  }

  async function logEvent(eventType, payload={}, eventKey=null) {
    if (!currentUser) return;
    const { error } = await client.from('learning_events').insert({
      user_id: currentUser.id,
      event_type: eventType,
      event_key: eventKey,
      payload,
      client_id: navigator.userAgent.slice(0,180)
    });
    if (error) console.warn('Event log failed', error);
  }

  async function finishAuthenticatedBoot() {
    cloudReady = false;
    await loadOrMigrateState();
    cloudReady = true;
    unlockApp();
    updateAccountUI();
    await logEvent('login_ready', { path: location.pathname }, 'login-' + new Date().toISOString().slice(0,10));
  }

  async function handleSession(session) {
    currentUser = session?.user || null;

    if (!currentUser) {
      cloudReady = false;
      lockApp();
      showAuthView('login');
      updateAccountUI();
      return;
    }

    if (!currentUser.email_confirmed_at) {
      lockApp();
      showAuthView('verify-email');
      $('verifyEmailText').textContent = '驗證信已寄到 ' + (currentUser.email || '你的信箱') + '。完成驗證後再回到這一頁。';
      updateAccountUI();
      return;
    }

    try {
      const mfaOk = await ensureMFA();
      if (!mfaOk) {
        updateAccountUI();
        return;
      }
      await finishAuthenticatedBoot();
    } catch (e) {
      lockApp();
      showAuthView('login');
      setAuthMessage('登入驗證失敗：' + (e.message || e), 'bad');
    }
  }

  function updateAccountUI() {
    const btn = $('accountBtn');
    if (btn) btn.textContent = currentUser ? '帳號' : '登入';
    const email = $('accountEmail');
    if (email) email.textContent = currentUser?.email || '尚未登入';
  }

  async function signIn(email,password) {
    setAuthMessage('登入中…');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await handleSession(data.session);
  }

  async function signUp(displayName,email,password) {
    setAuthMessage('建立帳號中…');
    const redirect = location.origin + location.pathname;
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
        emailRedirectTo: redirect
      }
    });
    if (error) throw error;
    if (!data.session) {
      showAuthView('verify-email');
      $('verifyEmailText').textContent = '驗證信已寄到 ' + email + '。請先完成信箱驗證，再回到此頁登入。';
      return;
    }
    await handleSession(data.session);
  }

  async function resetPassword(email) {
    const redirect = location.origin + location.pathname + '?reset=1';
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirect });
    if (error) throw error;
    setAuthMessage('密碼重設信已寄出，請查看信箱。', 'good');
  }

  async function updatePassword(password) {
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
    history.replaceState({}, '', location.pathname);
    setAuthMessage('密碼已更新。', 'good');
    setTimeout(() => showAuthView('login'), 900);
  }

  async function beginMFAEnrollment() {
    setAuthMessage('建立 2FA 設定中…');
    const { data, error } = await client.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Edan English Coach'
    });
    if (error) throw error;
    enrollingFactorId = data.id;
    $('mfaQr').src = data.totp.qr_code;
    $('mfaSecret').textContent = data.totp.secret;
    $('mfaEnrollIntro')?.classList.add('hidden');
    $('mfaEnrollSetup')?.classList.remove('hidden');
    clearAuthMessage();
  }

  async function verifyMFAEnrollment(code) {
    if (!enrollingFactorId) throw new Error('尚未建立驗證器設定');
    const challenge = await client.auth.mfa.challenge({ factorId: enrollingFactorId });
    if (challenge.error) throw challenge.error;
    const verify = await client.auth.mfa.verify({
      factorId: enrollingFactorId,
      challengeId: challenge.data.id,
      code
    });
    if (verify.error) throw verify.error;
    setAuthMessage('雙重驗證已啟用。', 'good');
    const { data } = await client.auth.getSession();
    await handleSession(data.session);
  }

  async function verifyMFAChallenge(code) {
    if (!currentFactorId) {
      const factors = await listVerifiedTotp();
      currentFactorId = factors[0]?.id || null;
    }
    if (!currentFactorId) throw new Error('找不到已啟用的驗證器');
    const challenge = await client.auth.mfa.challenge({ factorId: currentFactorId });
    if (challenge.error) throw challenge.error;
    currentChallengeId = challenge.data.id;
    const verify = await client.auth.mfa.verify({
      factorId: currentFactorId,
      challengeId: currentChallengeId,
      code
    });
    if (verify.error) throw verify.error;
    const { data } = await client.auth.getSession();
    await handleSession(data.session);
  }

  async function openAccountPanel() {
    if (!currentUser) {
      lockApp();
      showAuthView('login');
      return;
    }
    $('accountPanel')?.classList.remove('hidden');
    const factors = await listVerifiedTotp().catch(()=>[]);
    const aal = await getAAL().catch(()=>null);
    $('accountMfaStatus').textContent = factors.length
      ? '已啟用 · ' + (aal?.currentLevel === 'aal2' ? '本次登入已驗證' : '需要再次驗證')
      : '尚未啟用';
  }

  function closeAccountPanel() {
    $('accountPanel')?.classList.add('hidden');
  }

  window.EDAN_CLOUD = {
    get client(){ return client; },
    get user(){ return currentUser; },
    get ready(){ return cloudReady; },
    saveState(state) {
      pendingState = state;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        if (!cloudReady || !currentUser || !pendingState) return;
        const copy = pendingState;
        pendingState = null;
        try { await upsertCloudState(copy); }
        catch (e) {
          console.warn('Cloud state sync failed', e);
          const sync = $('cloudSyncStatus');
          if (sync) sync.textContent = '同步失敗，資料仍保留在本機';
        }
      }, 650);
    },
    logEvent
  };

  function bindUI() {
    document.querySelectorAll('.auth-tab').forEach(btn => btn.addEventListener('click',()=>showAuthView(btn.dataset.authTab)));

    $('loginForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      try { await signIn($('loginEmail').value.trim(), $('loginPassword').value); }
      catch (err) { setAuthMessage(err.message || String(err), 'bad'); }
    });

    $('registerForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const password = $('registerPassword').value;
      if (password.length < 8) return setAuthMessage('密碼至少需要 8 個字元。','bad');
      try { await signUp($('registerName').value.trim(), $('registerEmail').value.trim(), password); }
      catch (err) { setAuthMessage(err.message || String(err), 'bad'); }
    });

    $('forgotForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      try { await resetPassword($('forgotEmail').value.trim()); }
      catch (err) { setAuthMessage(err.message || String(err), 'bad'); }
    });

    $('resetPasswordForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      try { await updatePassword($('newPassword').value); }
      catch (err) { setAuthMessage(err.message || String(err), 'bad'); }
    });

    $('startMfaEnrollBtn')?.addEventListener('click', async()=>{
      try { await beginMFAEnrollment(); }
      catch(err){ setAuthMessage(err.message || String(err),'bad'); }
    });

    $('mfaEnrollForm')?.addEventListener('submit', async e=>{
      e.preventDefault();
      try { await verifyMFAEnrollment($('mfaEnrollCode').value.trim()); }
      catch(err){ setAuthMessage(err.message || String(err),'bad'); }
    });

    $('mfaChallengeForm')?.addEventListener('submit', async e=>{
      e.preventDefault();
      try { await verifyMFAChallenge($('mfaChallengeCode').value.trim()); }
      catch(err){ setAuthMessage(err.message || String(err),'bad'); }
    });

    $('accountBtn')?.addEventListener('click', openAccountPanel);
    $('closeAccountPanelBtn')?.addEventListener('click', closeAccountPanel);
    $('accountPanelBackdrop')?.addEventListener('click', closeAccountPanel);
    $('signOutBtn')?.addEventListener('click', async()=>{
      await client.auth.signOut();
      closeAccountPanel();
      currentUser = null;
      cloudReady = false;
      lockApp();
      showAuthView('login');
      updateAccountUI();
    });

    $('resendVerificationBtn')?.addEventListener('click', async()=>{
      const email = $('registerEmail')?.value.trim() || $('loginEmail')?.value.trim() || currentUser?.email;
      if (!email) return setAuthMessage('請先輸入 Email。','bad');
      const { error } = await client.auth.resend({ type:'signup', email, options:{ emailRedirectTo:location.origin+location.pathname } });
      if (error) setAuthMessage(error.message,'bad');
      else setAuthMessage('驗證信已重新寄出。','good');
    });
  }

  async function boot() {
    bindUI();
    lockApp();

    if (new URLSearchParams(location.search).get('reset') === '1') {
      showAuthView('reset-password');
    }

    client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        lockApp();
        showAuthView('reset-password');
        return;
      }
      if (event === 'SIGNED_OUT') {
        currentUser = null;
        cloudReady = false;
        lockApp();
        showAuthView('login');
        updateAccountUI();
      }
    });

    const { data } = await client.auth.getSession();
    if (new URLSearchParams(location.search).get('reset') === '1' && data.session) {
      currentUser = data.session.user;
      showAuthView('reset-password');
      return;
    }
    await handleSession(data.session);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
