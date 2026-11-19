/**
 * KYPER Official Website - Main Orchestrator
 * Engineered by Kavyansh Gautam (KG)
 */

document.addEventListener('DOMContentLoaded', () => {
  initAudioControl();
  loadUpdatesData();
  initTabs();
  initCopyActions();
  initPricingPlans();
  initTerminal();
});

// Audio Control in Navbar
function initAudioControl() {
  const toggleBtn = document.getElementById('audioToggleBtn');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    if (!window.soundEngine) return;
    const isEnabled = window.soundEngine.toggle();
    toggleBtn.innerHTML = isEnabled ? '🔊 Audio: ON' : '🔇 Audio: OFF';
    showToast(isEnabled ? 'Sound Effects Enabled' : 'Sound Effects Muted');
  });
}

// Dynamic Updates & Changelog Loading
async function loadUpdatesData() {
  try {
    const res = await fetch('data/updates.json');
    if (!res.ok) throw new Error('Failed to load updates.json');
    const data = await res.json();

    // Populate Android Card
    if (data.latestAndroid) {
      const a = data.latestAndroid;
      document.querySelectorAll('.val-android-ver').forEach(el => el.textContent = a.version);
      document.querySelectorAll('.val-android-size').forEach(el => el.textContent = a.fileSizeFormatted);
      document.querySelectorAll('.val-android-date').forEach(el => el.textContent = a.releaseDate);
      document.querySelectorAll('.val-android-sha').forEach(el => el.textContent = a.sha256);

      const dlApkBtn = document.getElementById('btnDownloadApk');
      if (dlApkBtn) dlApkBtn.href = a.downloadUrl;
      const heroApkBtn = document.getElementById('heroBtnDownloadApk');
      if (heroApkBtn) heroApkBtn.href = a.downloadUrl;
    }

    // Populate Extension Card
    if (data.latestExtension) {
      const e = data.latestExtension;
      document.querySelectorAll('.val-ext-ver').forEach(el => el.textContent = e.version);
      document.querySelectorAll('.val-ext-size').forEach(el => el.textContent = e.fileSizeFormatted);
      document.querySelectorAll('.val-ext-date').forEach(el => el.textContent = e.releaseDate);
      document.querySelectorAll('.val-ext-sha').forEach(el => el.textContent = e.sha256);

      const dlExtBtn = document.getElementById('btnDownloadExt');
      if (dlExtBtn) dlExtBtn.href = e.downloadUrl;
      const heroExtBtn = document.getElementById('heroBtnDownloadExt');
      if (heroExtBtn) heroExtBtn.href = e.downloadUrl;
    }

    // Populate Changelog Timeline
    if (data.history && Array.isArray(data.history)) {
      const container = document.getElementById('changelogTimeline');
      if (container) {
        container.innerHTML = '';
        data.history.forEach(item => {
          const itemEl = document.createElement('div');
          itemEl.className = 'timeline-item';
          
          let badgeClass = 'badge';
          if (item.badge === 'LATEST') badgeClass += ' badge-emerald';
          else if (item.badge === 'MAJOR') badgeClass += ' badge-cyan';
          else badgeClass += ' badge-crimson';

          const bulletsHtml = item.changes.map(c => `<li>${c}</li>`).join('');

          itemEl.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-header">
              <span class="timeline-version">${item.version}</span>
              <span class="${badgeClass}">${item.badge}</span>
              <span class="timeline-platform" style="font-size:0.75rem; color:#94a3b8;">${item.platform}</span>
              <span class="timeline-date">${item.date}</span>
            </div>
            <ul class="timeline-bullets">
              ${bulletsHtml}
            </ul>
          `;
          container.appendChild(itemEl);
        });
      }
    }
  } catch (err) {
    console.warn('Could not load dynamic updates.json, fallback values active:', err);
  }
}

// Tab Switching for Install Guides
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');

      if (window.soundEngine) window.soundEngine.playClick();
    });
  });
}

// Interactive Multi-Plan Picker for UPI Gateway
function initPricingPlans() {
  const planCards = document.querySelectorAll('.plan-item-card');
  const displayAmount = document.getElementById('displayPlanAmount');
  const displayTitle = document.getElementById('displayPlanTitle');
  const utrAmtText = document.getElementById('utrAmtText');
  const upiQrImg = document.getElementById('upiQrImg');

  let currentAmount = "99";
  let currentTitle = "1 Month Pro";

  planCards.forEach(card => {
    card.addEventListener('click', () => {
      planCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const amount = card.dataset.amount;
      const title = card.dataset.title;
      currentAmount = amount;
      currentTitle = title;

      if (displayAmount) displayAmount.textContent = `₹${amount}`;
      if (displayTitle) displayTitle.textContent = title;
      if (utrAmtText) utrAmtText.textContent = `₹${amount}`;

      // Update Dynamic QR Code with exact amount!
      if (upiQrImg) {
        upiQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=kavyanshgautam1@ptyes%26pn=KYPER%26am=${amount}%26cu=INR`;
      }

      if (window.soundEngine) window.soundEngine.playClick();
      showToast(`Selected: ${title} (₹${amount})`);
    });
  });
}

// Copy Actions & Toast
function initCopyActions() {
  const copyUpiBtn = document.getElementById('btnCopyUpi');
  if (copyUpiBtn) {
    copyUpiBtn.addEventListener('click', () => {
      const upiId = 'kavyanshgautam1@ptyes';
      navigator.clipboard.writeText(upiId).then(() => {
        showToast(`UPI ID Copied: ${upiId}`);
        if (window.soundEngine) window.soundEngine.playSuccess();
      });
    });
  }

  document.querySelectorAll('.btn-copy-sha').forEach(btn => {
    btn.addEventListener('click', () => {
      const hash = btn.dataset.hash;
      if (hash) {
        navigator.clipboard.writeText(hash).then(() => {
          showToast('SHA-256 Checksum copied to clipboard!');
          if (window.soundEngine) window.soundEngine.playClick();
        });
      }
    });
  });

  // UTR submission simulation
  const utrForm = document.getElementById('utrForm');
  if (utrForm) {
    utrForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const utrVal = document.getElementById('utrInput').value;
      if (!utrVal || utrVal.length < 6) {
        showToast('Please enter a valid 12-digit UPI UTR number');
        return;
      }
      showToast('🎉 UTR Recorded! Your Pro key will be sent to WhatsApp within 10 minutes.');
      if (window.soundEngine) window.soundEngine.playSuccess();
      utrForm.reset();
    });
  }
}

// Toast notification helper
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Interactive Terminal
function initTerminal() {
  const termBody = document.getElementById('terminalBody');
  const termBtns = document.querySelectorAll('[data-term-cmd]');
  if (!termBody || !termBtns.length) return;

  const COMMANDS = {
    'status': `
<span class="term-cmd">> kyper --status</span>
<span class="term-success">[OK] Cloudflare AI Worker v2.0: Online (99.98% uptime)</span>
<span class="term-highlight">[HOST] https://ghosttyper-api.26c648ynfx.workers.dev</span>
<span class="term-success">[ANDROID] v6.1 (Build 42) • DirectReply RemoteInput Active</span>
<span class="term-success">[EXTENSION] v5.2 (Universal DOM Injector) • Active</span>
<span class="term-highlight">[AUTH] Key Engine: Online • Developer ID: KG (Kavyansh Gautam)</span>
`,
    'defense': `
<span class="term-cmd">> kyper --defense-matrix</span>
<span class="term-success">[SHIELD 1] Emergency & Crisis Empathy Filter: RUNNING</span>
<span class="term-success">[SHIELD 2] Bank OTP / Sensitive Transaction Shield: ENFORCED</span>
<span class="term-success">[SHIELD 3] Ping-Pong Loop Guard: Active (Max 3 turns / 15m)</span>
<span class="term-success">[SHIELD 4] Muted Chat Discard Engine: Silent RankingMap Active</span>
<span class="term-success">[SHIELD 5] Pure Media & Audio Voice Note Guard: ACTIVE</span>
`,
    'benchmark': `
<span class="term-cmd">> kyper --benchmark</span>
[BENCHMARK] Android Notification Intercept: 8.2ms
[BENCHMARK] AI Generation (Cloudflare Edge): 134.8ms
[BENCHMARK] RemoteInput DirectReply Dispatch: 14.1ms
<span class="term-highlight">[TOTAL ROUNDTRIP] 157.1ms (World Record Auto-Reply)</span>
<span class="term-success">[BATTERY DRAIN] <0.8% per 24 hours in deep sleep</span>
`
  };

  termBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.termCmd;
      if (COMMANDS[cmd]) {
        termBody.innerHTML += COMMANDS[cmd];
        termBody.scrollTop = termBody.scrollHeight;
        if (window.soundEngine) window.soundEngine.playType();
      }
    });
  });
}
