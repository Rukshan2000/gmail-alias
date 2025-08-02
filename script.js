// Global variables
const randomWords = ["news", "client", "shop", "test", "login", "project", "temp", "feedback", "app", "dev", "work", "personal", "newsletter", "signup", "promo", "deals", "social", "gaming", "finance", "travel"];
let currentAliases = [];
let starredAliases = new Set();

// Tab switching logic
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabSections = document.querySelectorAll('.tab-section');
  
  function switchTab(tab) {
    tabSections.forEach(section => {
      section.classList.add('hidden');
    });
    document.getElementById('tab-' + tab).classList.remove('hidden');
    
    tabButtons.forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.classList.remove('bg-transparent', 'hover:bg-white/10');
        btn.classList.add('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500', 'shadow-lg');
      } else {
        btn.classList.add('bg-transparent', 'hover:bg-white/10');
        btn.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500', 'shadow-lg');
      }
    });
    
    updateStats();
  }
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // Default to Generator tab
  switchTab('generator');
});

// Enhanced statistics
function updateStats() {
  const totalGenerated = localStorage.getItem('totalGenerated') || '0';
  const history = JSON.parse(localStorage.getItem('gmailAliasHistory') || '[]');
  const starredCount = currentAliases.filter(a => a.starred).length;
  
  const totalEl = document.getElementById('totalGenerated');
  const historyEl = document.getElementById('historyCount');
  const starredEl = document.getElementById('starredCount');
  
  if (totalEl) totalEl.textContent = totalGenerated;
  if (historyEl) historyEl.textContent = history.length;
  if (starredEl) starredEl.textContent = starredCount;
}

// Quick generate functions
function quickGenerate(type) {
  const baseEmail = document.getElementById('baseEmail').value.trim();
  if (!baseEmail) {
    showNotification('⚠️ Please enter your Gmail address first', 'error');
    return;
  }
  
  // Set appropriate settings for quick generation
  document.getElementById('plusAlias').checked = true;
  document.getElementById('dotAlias').checked = false;
  document.getElementById('randomAlias').checked = false;
  document.getElementById('aliasCount').value = '10';
  
  const keywords = {
    'work': 'work, business, corporate, meeting, project',
    'shopping': 'shopping, deals, store, purchase, order',
    'temp': 'temp, test, trial, signup, verify'
  };
  
  document.getElementById('customKeywords').value = keywords[type] || '';
  
  generateAliases();
}

// Load settings on page load
window.addEventListener('load', () => {
  loadSettings();
  loadHistory();
  setupEmailValidation();
  setupFilterButtons();
  updateStats();
});

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('gmailAliasSettings') || '{}');
  
  if (settings.plusAlias !== undefined) document.getElementById('plusAlias').checked = settings.plusAlias;
  if (settings.dotAlias !== undefined) document.getElementById('dotAlias').checked = settings.dotAlias;
  if (settings.randomAlias !== undefined) document.getElementById('randomAlias').checked = settings.randomAlias;
  if (settings.aliasCount) document.getElementById('aliasCount').value = settings.aliasCount;
  if (settings.customKeywords) document.getElementById('customKeywords').value = settings.customKeywords;
}

function saveSettings() {
  const settings = {
    plusAlias: document.getElementById('plusAlias').checked,
    dotAlias: document.getElementById('dotAlias').checked,
    randomAlias: document.getElementById('randomAlias').checked,
    aliasCount: document.getElementById('aliasCount').value,
    customKeywords: document.getElementById('customKeywords').value
  };
  localStorage.setItem('gmailAliasSettings', JSON.stringify(settings));
}

function setupEmailValidation() {
  const emailInput = document.getElementById('baseEmail');
  const validation = document.getElementById('emailValidation');
  
  emailInput.addEventListener('input', () => {
    const email = emailInput.value.trim();
    validation.classList.remove('hidden');
    
    if (!email) {
      validation.textContent = '';
      validation.classList.add('hidden');
      return;
    }
    
    if (!email.includes('@gmail.com')) {
      validation.textContent = '⚠️ Please enter a valid Gmail address';
      validation.className = 'text-sm text-yellow-400';
    } else if (email.includes('+') || email.split('@')[0].includes('.')) {
      validation.textContent = '💡 Email already has aliases - this might create conflicts';
      validation.className = 'text-sm text-blue-400';
    } else {
      validation.textContent = '✅ Valid Gmail address';
      validation.className = 'text-sm text-green-400';
    }
  });
}

function setupFilterButtons() {
  document.querySelectorAll('.filter-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterAliases(btn.dataset.filter);
    });
  });
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@gmail\.com$/;
  return emailRegex.test(email);
}

function insertDots(emailName) {
  let result = [];
  for (let i = 1; i < emailName.length; i++) {
    if (emailName[i - 1] !== '.' && emailName[i] !== '.') {
      result.push(emailName.slice(0, i) + '.' + emailName.slice(i));
    }
  }
  return result;
}

function generateAliases() {
  const base = document.getElementById('baseEmail').value.trim();
  const plus = document.getElementById('plusAlias').checked;
  const dot = document.getElementById('dotAlias').checked;
  const random = document.getElementById('randomAlias').checked;
  const count = parseInt(document.getElementById('aliasCount').value);
  const customKeywords = document.getElementById('customKeywords').value.trim();
  
  if (!validateEmail(base)) {
    showNotification('❌ Please enter a valid Gmail address', 'error');
    return;
  }

  if (!plus && !dot && !random) {
    showNotification('❌ Please select at least one alias type', 'error');
    return;
  }
  
  const [name, domain] = base.split('@');
  const aliases = [];
  const aliasTypes = [];
  
  // Get custom keywords
  const customWords = customKeywords ? 
    customKeywords.split(',').map(w => w.trim()).filter(w => w) : [];
  
  let plusCount = 0, dotCount = 0, randomCount = 0;
  
  // Generate aliases based on selected types
  while (aliases.length < count) {
    if (plus && aliases.length < count) {
      const allKeywords = [...customWords, ...randomWords];
      const keyword = allKeywords[Math.floor(Math.random() * allKeywords.length)];
      const alias = `${name}+${keyword}@${domain}`;
      if (!aliases.includes(alias)) {
        aliases.push(alias);
        aliasTypes.push('plus');
        plusCount++;
      }
    }
    
    if (random && aliases.length < count) {
      const word = Math.random().toString(36).substring(2, 8);
      const alias = `${name}+${word}@${domain}`;
      if (!aliases.includes(alias)) {
        aliases.push(alias);
        aliasTypes.push('random');
        randomCount++;
      }
    }
    
    if (dot && aliases.length < count) {
      const dotted = insertDots(name);
      for (const d of dotted) {
        if (aliases.length < count) {
          const alias = `${d}@${domain}`;
          if (!aliases.includes(alias)) {
            aliases.push(alias);
            aliasTypes.push('dot');
            dotCount++;
          }
        }
      }
    }
    
    // Prevent infinite loop
    if (aliases.length === 0) break;
    if (aliases.length > 100) break;
  }
  
  currentAliases = aliases.slice(0, count).map((alias, index) => ({
    email: alias,
    type: aliasTypes[index] || 'unknown',
    starred: false
  }));

  // Update summary
  updateSummary(plusCount, dotCount, randomCount);
  
  // Display aliases
  displayAliases();
  
  // Save to history
  saveToHistory(base, currentAliases);
  
  // Save settings
  saveSettings();
  
  // Update total generated counter
  const totalGenerated = parseInt(localStorage.getItem('totalGenerated') || '0') + currentAliases.length;
  localStorage.setItem('totalGenerated', totalGenerated.toString());
  
  // Show results
  // Switch to Results tab with enhanced animation
  document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
  document.getElementById('tab-results').classList.remove('hidden');
  document.querySelectorAll('.tab-button').forEach(btn => {
    if (btn.dataset.tab === 'results') {
      btn.classList.remove('bg-transparent', 'hover:bg-white/10');
      btn.classList.add('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500', 'shadow-lg');
    } else {
      btn.classList.add('bg-transparent', 'hover:bg-white/10');
      btn.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500', 'shadow-lg');
    }
  });
  
  // Smooth scroll to results
  setTimeout(() => {
    document.getElementById('tab-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
  
  updateStats();
  showNotification(`🎉 Generated ${currentAliases.length} aliases successfully!`, 'success');
}

function updateSummary(plusCount, dotCount, randomCount) {
  const total = currentAliases.length;
  const breakdown = [];
  
  if (plusCount > 0) breakdown.push(`${plusCount} keyword aliases`);
  if (dotCount > 0) breakdown.push(`${dotCount} dot variants`);
  if (randomCount > 0) breakdown.push(`${randomCount} random aliases`);
  
  document.getElementById('summaryBreakdown').textContent = 
    `Total: ${total} • ${breakdown.join(' • ')}`;
}

function displayAliases() {
  const container = document.getElementById('aliasesList');
  container.innerHTML = '';
  
  currentAliases.forEach((alias, index) => {
    const item = createAliasItem(alias, index);
    container.appendChild(item);
  });
}

function createAliasItem(alias, index) {
  const div = document.createElement('div');
  div.className = `alias-item flex items-center justify-between p-4 glass-input rounded-xl ${alias.type} group`;
  div.innerHTML = `
    <div class="flex items-center space-x-4 flex-1">
      <button class="star-button text-gray-400 hover:text-yellow-400 text-xl transition-all ${alias.starred ? 'starred' : ''}" 
              onclick="toggleStar(${index})">
        ${alias.starred ? '⭐' : '☆'}
      </button>
      <div class="flex-1">
        <div class="text-white font-mono text-lg">${alias.email}</div>
        <div class="flex items-center space-x-2 mt-1">
          <span class="text-xs px-3 py-1 rounded-full bg-gradient-to-r ${
            alias.type === 'plus' ? 'from-blue-500 to-blue-600' : 
            alias.type === 'dot' ? 'from-green-500 to-green-600' : 
            'from-purple-500 to-purple-600'
          } text-white font-medium">
            ${alias.type === 'plus' ? '➕ Keyword' : alias.type === 'dot' ? '🔘 Dot' : '🎲 Random'}
          </span>
          <span class="text-gray-400 text-xs">
            ${alias.type === 'plus' ? 'Perfect for subscriptions' : 
              alias.type === 'dot' ? 'Gmail ignores dots' : 
              'Unique identifier'}
          </span>
        </div>
      </div>
    </div>
    <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onclick="copyAlias('${alias.email}')" 
              class="text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all flex items-center space-x-1">
        <span>📋</span>
        <span class="text-sm">Copy</span>
      </button>
      <button onclick="testMailto('${alias.email}')" 
              class="text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all flex items-center space-x-1">
        <span>✉️</span>
        <span class="text-sm">Test</span>
      </button>
    </div>
  `;
  return div;
}

function toggleStar(index) {
  currentAliases[index].starred = !currentAliases[index].starred;
  displayAliases();
}

function filterAliases(filter) {
  const items = document.querySelectorAll('.alias-item');
  
  items.forEach((item, index) => {
    const alias = currentAliases[index];
    let show = false;
    
    switch (filter) {
      case 'all':
        show = true;
        break;
      case 'plus':
        show = alias.type === 'plus';
        break;
      case 'dot':
        show = alias.type === 'dot';
        break;
      case 'random':
        show = alias.type === 'random';
        break;
      case 'starred':
        show = alias.starred;
        break;
    }
    
    item.style.display = show ? 'flex' : 'none';
  });
}

function copyAlias(email) {
  navigator.clipboard.writeText(email).then(() => {
    showNotification('✅ Alias copied!', 'success');
  }).catch(() => {
    showNotification('❌ Failed to copy!', 'error');
  });
}

function testMailto(email) {
  window.open(`mailto:${email}`, '_blank');
}

function copyAllAliases() {
  const text = currentAliases.map(a => a.email).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    showNotification('✅ All aliases copied!', 'success');
  }).catch(() => {
    showNotification('❌ Failed to copy!', 'error');
  });
}

function exportToFile(format) {
  if (currentAliases.length === 0) {
    showNotification('❌ No aliases to export!', 'error');
    return;
  }

  let content, filename, mimeType;
  
  if (format === 'txt') {
    content = currentAliases.map(a => a.email).join('\n');
    filename = 'gmail-aliases.txt';
    mimeType = 'text/plain';
  } else if (format === 'csv') {
    content = 'Email,Type,Starred\n' + 
      currentAliases.map(a => `${a.email},${a.type},${a.starred}`).join('\n');
    filename = 'gmail-aliases.csv';
    mimeType = 'text/csv';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification(`✅ Exported as ${format.toUpperCase()}!`, 'success');
}

function saveToHistory(baseEmail, aliases) {
  const history = JSON.parse(localStorage.getItem('gmailAliasHistory') || '[]');
  const entry = {
    id: Date.now(),
    baseEmail,
    aliases: aliases.slice(0, 3), // Save only first 3 to keep storage light
    timestamp: new Date().toISOString(),
    count: aliases.length
  };
  
  history.unshift(entry);
  // Keep only last 10 entries
  const trimmedHistory = history.slice(0, 10);
  localStorage.setItem('gmailAliasHistory', JSON.stringify(trimmedHistory));
  
  loadHistory();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem('gmailAliasHistory') || '[]');
  const container = document.getElementById('historyList');
  
  if (history.length === 0) {
    container.innerHTML = '<div class="text-center py-12"><div class="text-6xl mb-4">📭</div><p class="text-gray-400">No recent aliases</p></div>';
    return;
  }
  
  container.innerHTML = history.map(entry => `
    <div class="history-item p-4 rounded-xl glass-input cursor-pointer group transition-all hover:scale-105" onclick="loadFromHistory('${entry.id}')">
      <div class="flex justify-between items-center">
        <div class="flex-1">
          <div class="text-white font-mono text-lg mb-1">${entry.baseEmail}</div>
          <div class="flex items-center space-x-3 text-sm">
            <span class="text-gray-400">${entry.count} aliases</span>
            <span class="text-gray-500">•</span>
            <span class="text-gray-400">${new Date(entry.timestamp).toLocaleDateString()}</span>
            <span class="text-gray-500">•</span>
            <span class="text-blue-400">${new Date(entry.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
        <div class="text-right opacity-0 group-hover:opacity-100 transition-opacity">
          <div class="text-gray-400 text-sm">
            ${entry.aliases.slice(0, 2).map(a => a.email ? a.email.split('@')[0] : a.split('@')[0]).join(', ')}...
          </div>
          <div class="text-blue-400 text-xs mt-1">Click to load</div>
        </div>
      </div>
    </div>
  `).join('');
}

function loadFromHistory(id) {
  const history = JSON.parse(localStorage.getItem('gmailAliasHistory') || '[]');
  const entry = history.find(h => h.id == id);
  
  if (entry) {
    document.getElementById('baseEmail').value = entry.baseEmail;
    
    // Rebuild currentAliases from entry.aliases
    currentAliases = entry.aliases.map(a => ({
      email: a.email || a,
      type: a.type || 'plus',
      starred: a.starred || false
    }));
    
    // Update summary
    let plusCount = currentAliases.filter(a => a.type === 'plus').length;
    let dotCount = currentAliases.filter(a => a.type === 'dot').length;
    let randomCount = currentAliases.filter(a => a.type === 'random').length;
    updateSummary(plusCount, dotCount, randomCount);
    
    // Display aliases
    displayAliases();
    
    // Switch to Results tab
    document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('tab-results').classList.remove('hidden');
    document.querySelectorAll('.tab-button').forEach(btn => {
      if (btn.dataset.tab === 'results') {
        btn.classList.remove('bg-transparent', 'hover:bg-white/10');
        btn.classList.add('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500', 'shadow-lg');
      } else {
        btn.classList.add('bg-transparent', 'hover:bg-white/10');
        btn.classList.remove('bg-gradient-to-r', 'from-indigo-500', 'to-purple-500', 'shadow-lg');
      }
    });
    
    setTimeout(() => {
      document.getElementById('tab-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    updateStats();
    showNotification('📚 Loaded from history successfully!', 'success');
  }
}

function clearHistory() {
  if (confirm('Clear all history?')) {
    localStorage.removeItem('gmailAliasHistory');
    loadHistory();
    showNotification('✅ History cleared!', 'success');
  }
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-xl text-white font-medium z-50 transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  notification.style.transform = 'translateX(400px)';
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Interactive effects
document.addEventListener('mousemove', (e) => {
  const orbs = document.querySelectorAll('.floating-orb');
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  
  orbs.forEach((orb, index) => {
    const speed = (index + 1) * 0.5;
    orb.style.transform = `translate(${x * speed * 20}px, ${y * speed * 20}px)`;
  });
});

// Save settings when checkboxes change
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', saveSettings);
  });

  const aliasCountInput = document.getElementById('aliasCount');
  const customKeywordsInput = document.getElementById('customKeywords');
  
  if (aliasCountInput) aliasCountInput.addEventListener('change', saveSettings);
  if (customKeywordsInput) customKeywordsInput.addEventListener('input', saveSettings);
});
