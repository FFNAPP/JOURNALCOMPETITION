const SUPABASE_URL = 'https://wvxgkadxqzftjrtxotuw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2eGdrYWR4cXpmdGpydHhvdHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjY1NjQsImV4cCI6MjA5NjE0MjU2NH0.AT1jTT9HzLDyGRf0huj_wAzdoJjgbDFIAn8PJvVhJfo';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function requireSession(redirectTo = 'index.html') {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = redirectTo; return null; }
  return session;
}

function getRole(session)    { return session?.user?.app_metadata?.role || 'anon'; }
function getCoachId(session) { return session?.user?.app_metadata?.coach_id || null; }

async function requireRole(role) {
  const session = await requireSession();
  if (!session) return null;
  if (getRole(session) !== role) { location.href = 'journal.html'; return null; }
  return session;
}

async function logout() { await sb.auth.signOut(); location.href = 'index.html'; }

sb.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') location.href = 'index.html';
});

// ── MODAL CHANGEMENT DE MOT DE PASSE ───────────────────────
function openPasswordModal() {
  document.getElementById('_pwd-modal').style.display = 'flex';
  document.getElementById('_pwd-new').value = '';
  document.getElementById('_pwd-confirm').value = '';
  document.getElementById('_pwd-msg').textContent = '';
  document.getElementById('_pwd-new').focus();
}

function closePasswordModal() {
  document.getElementById('_pwd-modal').style.display = 'none';
}

async function submitPasswordChange() {
  const np = document.getElementById('_pwd-new').value;
  const cp = document.getElementById('_pwd-confirm').value;
  const msg = document.getElementById('_pwd-msg');
  msg.style.color = '#C0392B';
  if (np.length < 8) { msg.textContent = 'Le mot de passe doit contenir au moins 8 caractères.'; return; }
  if (np !== cp)     { msg.textContent = 'Les deux mots de passe ne correspondent pas.'; return; }
  const btn = document.getElementById('_pwd-submit');
  btn.disabled = true; btn.textContent = 'Enregistrement…';
  const { error } = await sb.auth.updateUser({ password: np });
  btn.disabled = false; btn.textContent = 'Enregistrer';
  if (error) { msg.textContent = 'Erreur : ' + error.message; return; }
  msg.style.color = '#1A7A4A';
  msg.textContent = 'Mot de passe modifié avec succès.';
  setTimeout(closePasswordModal, 1800);
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.createElement('div');
  modal.id = '_pwd-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;align-items:center;justify-content:center';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:2rem;width:100%;max-width:380px;box-shadow:0 8px 32px rgba(0,0,0,.2);font-family:\'DM Sans\',sans-serif">
      <div style="font-size:16px;font-weight:600;color:#0A1628;margin-bottom:4px">Modifier le mot de passe</div>
      <div style="font-size:13px;color:#5A6478;margin-bottom:1.5rem">Choisissez un nouveau mot de passe (8 caractères minimum).</div>
      <label style="font-size:12px;font-weight:500;color:#5A6478;display:block;margin-bottom:4px">Nouveau mot de passe</label>
      <input id="_pwd-new" type="password" placeholder="••••••••" style="width:100%;padding:9px 12px;border:1px solid #DDE3EE;border-radius:8px;font-size:14px;font-family:\'DM Sans\',sans-serif;margin-bottom:12px;outline:none">
      <label style="font-size:12px;font-weight:500;color:#5A6478;display:block;margin-bottom:4px">Confirmer le mot de passe</label>
      <input id="_pwd-confirm" type="password" placeholder="••••••••" style="width:100%;padding:9px 12px;border:1px solid #DDE3EE;border-radius:8px;font-size:14px;font-family:\'DM Sans\',sans-serif;margin-bottom:12px;outline:none" onkeydown="if(event.key===\'Enter\')submitPasswordChange()">
      <div id="_pwd-msg" style="font-size:13px;min-height:18px;margin-bottom:12px"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button onclick="closePasswordModal()" style="padding:8px 16px;border:1px solid #DDE3EE;border-radius:8px;background:#fff;cursor:pointer;font-size:13px;font-weight:500;font-family:\'DM Sans\',sans-serif">Annuler</button>
        <button id="_pwd-submit" onclick="submitPasswordChange()" style="padding:8px 16px;border:none;border-radius:8px;background:#0A1628;color:#fff;cursor:pointer;font-size:13px;font-weight:600;font-family:\'DM Sans\',sans-serif">Enregistrer</button>
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) closePasswordModal(); });
  document.body.appendChild(modal);
});
