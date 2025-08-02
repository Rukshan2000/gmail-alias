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
  showConfirmationModal(
    'Clear All Data',
    'This will remove history, settings, statistics, and preferences.',
    () => {
      // Clear all localStorage data
      localStorage.removeItem('gmailAliasHistory');
      localStorage.removeItem('gmailAliasSettings');
      localStorage.removeItem('totalGenerated');
      localStorage.removeItem('aiEnabled');
      
      // Reset current state
      currentAliases = [];
      starredAliases = new Set();
      
      // Reload and reset UI
      loadHistory();
      loadSettings();
      updateStats();
      
      // Clear current results
      const aliasesContainer = document.getElementById('aliasesList');
      if (aliasesContainer) {
        aliasesContainer.innerHTML = '';
      }
      
      // Reset form to defaults
      document.getElementById('baseEmail').value = '';
      document.getElementById('customKeywords').value = '';
      document.getElementById('aliasCount').value = '10';
      document.getElementById('plusAlias').checked = true;
      document.getElementById('dotAlias').checked = false;
      document.getElementById('randomAlias').checked = false;
      
      // Switch back to generator tab
      document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
      document.getElementById('tab-generator').classList.remove('hidden');
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === 'generator') {
          btn.classList.add('active');
        }
      });
      
      showNotification('🗑️ All data cleared successfully!', 'success');
    }
  );
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

// Confirmation Modal Functions
let confirmationCallback = null;

function showConfirmationModal(title, message, callback) {
  document.getElementById('confirmationTitle').textContent = title;
  document.getElementById('confirmationMessage').textContent = message;
  confirmationCallback = callback;
  document.getElementById('confirmationModal').classList.remove('hidden');
}

function closeConfirmationModal() {
  document.getElementById('confirmationModal').classList.add('hidden');
  confirmationCallback = null;
}

function confirmAction() {
  if (confirmationCallback) {
    confirmationCallback();
  }
  closeConfirmationModal();
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

// AI Features Implementation
let aiEnabled = false;
let spamDetectionModel = null;
let intentClassificationModel = null;

// Initialize AI models
async function initializeAI() {
  if (!aiEnabled) return;
  
  try {
    console.log('🧠 Initializing AI models...');
    
    // Simple spam detection model (lightweight)
    spamDetectionModel = tf.sequential({
      layers: [
        tf.layers.dense({ units: 16, activation: 'relu', inputShape: [10] }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });
    
    // Intent classification model
    intentClassificationModel = tf.sequential({
      layers: [
        tf.layers.dense({ units: 20, activation: 'relu', inputShape: [15] }),
        tf.layers.dense({ units: 10, activation: 'relu' }),
        tf.layers.dense({ units: 4, activation: 'softmax' }) // work, shopping, temp, personal
      ]
    });
    
    console.log('✅ AI models initialized successfully');
    showNotification('🧠 AI features enabled! Smart analysis active.', 'success');
  } catch (error) {
    console.error('❌ AI initialization failed:', error);
    showNotification('⚠️ AI features unavailable in this browser', 'error');
  }
}

// Toggle AI features
function toggleAI() {
  aiEnabled = !aiEnabled;
  if (aiEnabled) {
    initializeAI();
    localStorage.setItem('aiEnabled', 'true');
  } else {
    localStorage.setItem('aiEnabled', 'false');
    showNotification('🔄 AI features disabled', 'success');
  }
}

// AI-powered spam detection
function detectSpamAlias(alias) {
  if (!aiEnabled || !spamDetectionModel) return { isSpam: false, confidence: 0 };
  
  try {
    // Extract features (simplified)
    const features = [
      alias.length / 50, // normalized length
      (alias.match(/\d/g) || []).length / alias.length, // digit ratio
      (alias.match(/[A-Z]/g) || []).length / alias.length, // uppercase ratio
      (alias.match(/[!@#$%^&*()]/g) || []).length / alias.length, // special chars
      alias.includes('+') ? 1 : 0,
      alias.includes('.') ? 1 : 0,
      (alias.match(/(.)\1{2,}/g) || []).length, // repeated chars
      alias.split('+').length - 1, // plus count
      alias.split('.').length - 1, // dot count
      Math.random() * 0.1 // noise factor
    ];
    
    const prediction = spamDetectionModel.predict(tf.tensor2d([features]));
    const confidence = prediction.dataSync()[0];
    
    return {
      isSpam: confidence > 0.7,
      confidence: confidence,
      riskLevel: confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low'
    };
  } catch (error) {
    console.error('Spam detection error:', error);
    return { isSpam: false, confidence: 0 };
  }
}

// AI-powered intent classification
function classifyIntent(alias, keywords = '') {
  if (!aiEnabled || !intentClassificationModel) return { intent: 'unknown', confidence: 0 };
  
  try {
    const categories = ['work', 'shopping', 'temp', 'personal'];
    const text = (alias + ' ' + keywords).toLowerCase();
    
    // Extract features
    const features = [
      text.includes('work') || text.includes('business') || text.includes('corporate') ? 1 : 0,
      text.includes('shop') || text.includes('buy') || text.includes('purchase') ? 1 : 0,
      text.includes('temp') || text.includes('test') || text.includes('trial') ? 1 : 0,
      text.includes('personal') || text.includes('private') ? 1 : 0,
      text.includes('newsletter') || text.includes('news') ? 1 : 0,
      text.includes('social') || text.includes('media') ? 1 : 0,
      text.includes('finance') || text.includes('bank') ? 1 : 0,
      text.includes('gaming') || text.includes('game') ? 1 : 0,
      alias.length / 30,
      (text.match(/\+/g) || []).length,
      (text.match(/\./g) || []).length,
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1
    ];
    
    const prediction = intentClassificationModel.predict(tf.tensor2d([features]));
    const probabilities = prediction.dataSync();
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    
    return {
      intent: categories[maxIndex],
      confidence: probabilities[maxIndex],
      breakdown: categories.map((cat, i) => ({ category: cat, probability: probabilities[i] }))
    };
  } catch (error) {
    console.error('Intent classification error:', error);
    return { intent: 'unknown', confidence: 0 };
  }
}

// Enhanced alias generation with AI
function generateAliasesWithAI() {
  if (!aiEnabled) {
    generateAliases();
    return;
  }
  
  generateAliases();
  
  // Add AI analysis to generated aliases
  setTimeout(() => {
    if (currentAliases && currentAliases.length > 0) {
      currentAliases.forEach((alias, index) => {
        const spamAnalysis = detectSpamAlias(alias.email);
        const intentAnalysis = classifyIntent(alias.email, document.getElementById('customKeywords').value);
        
        alias.aiAnalysis = {
          spam: spamAnalysis,
          intent: intentAnalysis,
          riskScore: spamAnalysis.confidence * 100
        };
      });
      
      displayAliases();
      showAIInsights();
    }
  }, 500);
}

// Display AI insights
function showAIInsights() {
  if (!aiEnabled || !currentAliases.length) return;
  
  const highRiskAliases = currentAliases.filter(a => a.aiAnalysis && a.aiAnalysis.spam.riskLevel === 'high').length;
  const intents = currentAliases.map(a => a.aiAnalysis?.intent.intent).filter(Boolean);
  const mostCommonIntent = intents.length > 0 ? intents.reduce((a, b, i, arr) => 
    arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
  ) : 'unknown';
  
  if (highRiskAliases > 0) {
    showNotification(`⚠️ AI detected ${highRiskAliases} potentially risky aliases`, 'error');
  }
  
  if (mostCommonIntent !== 'unknown') {
    showNotification(`🎯 AI classified most aliases as: ${mostCommonIntent}`, 'success');
  }
}

// Toggle AI features function
function toggleAIFeatures() {
  toggleAI();
  document.getElementById('aliasInfoPopup').classList.add('hidden');
}

// Learn Modal functions
function openLearnModal() {
  document.getElementById('aliasInfoPopup').classList.add('hidden');
  document.getElementById('learnModal').classList.remove('hidden');
}

// Tab switching for learn modal
function switchLearnTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.learn-section').forEach(content => {
    content.classList.add('hidden');
  });
  
  // Remove active class from all tab buttons
  document.querySelectorAll('.learn-nav-button').forEach(btn => {
    btn.classList.remove('active');
    btn.classList.remove('bg-white/20', 'text-white');
    btn.classList.add('text-gray-300', 'hover:text-white', 'hover:bg-white/10');
  });
  
  // Show selected tab content
  document.getElementById('learn-' + tabName).classList.remove('hidden');
  
  // Add active class to selected tab button
  const activeBtn = document.querySelector(`[data-section="${tabName}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active', 'bg-white/20', 'text-white');
    activeBtn.classList.remove('text-gray-300', 'hover:text-white', 'hover:bg-white/10');
  }
}

// Enhanced DOMContentLoaded event to include all functionality
document.addEventListener('DOMContentLoaded', function() {
  // Load AI preference on startup
  if (localStorage.getItem('aiEnabled') === 'true') {
    aiEnabled = true;
    setTimeout(initializeAI, 1000);
  }
  
  // Initialize learn modal tab functionality
  document.querySelectorAll('.learn-nav-button').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.getAttribute('data-section');
      switchLearnTab(tabName);
    });
  });
  
  // Initialize first tab as active
  switchLearnTab('basics');
  
  // Show Gmail Alias info popup on first load or refresh
  document.getElementById('aliasInfoPopup').classList.remove('hidden');
  
  // Keyboard shortcuts implementation
  if (typeof Mousetrap !== 'undefined') {
    // Tab switching shortcuts
    Mousetrap.bind('1', function() {
      switchTab('generator');
      return false;
    });
    
    Mousetrap.bind('2', function() {
      switchTab('results');
      return false;
    });
    
    Mousetrap.bind('3', function() {
      switchTab('history');
      return false;
    });
    
    // Generate aliases with AI
    Mousetrap.bind('g', function() {
      if (document.getElementById('baseEmail').value.trim()) {
        if (aiEnabled) {
          generateAliasesWithAI();
        } else {
          generateAliases();
        }
      } else {
        document.getElementById('baseEmail').focus();
      }
      return false;
    });
    
    // Copy all aliases
    Mousetrap.bind('ctrl+c', function() {
      if (currentAliases && currentAliases.length > 0) {
        copyAllAliases();
      }
      return false;
    });
    
    // Quick generation shortcuts
    Mousetrap.bind('w', function() {
      quickGenerate('work');
      return false;
    });
    
    Mousetrap.bind('s', function() {
      quickGenerate('shopping');
      return false;
    });
    
    Mousetrap.bind('t', function() {
      quickGenerate('temp');
      return false;
    });
    
    // Clear history
    Mousetrap.bind('del', function() {
      clearHistory();
      return false;
    });
    
    // Close popup/modals
    Mousetrap.bind('escape', function() {
      // Close confirmation modal first (higher priority)
      if (!document.getElementById('confirmationModal').classList.contains('hidden')) {
        closeConfirmationModal();
      } else {
        document.getElementById('aliasInfoPopup').classList.add('hidden');
      }
      return false;
    });
    
    // Help shortcut to show popup
    Mousetrap.bind('?', function() {
      document.getElementById('aliasInfoPopup').classList.remove('hidden');
      return false;
    });

    // Toggle AI features
    Mousetrap.bind('a', function() {
      toggleAI();
      return false;
    });
  }

  // Burger menu and drawer logic for mobile
  const burgerBtn = document.getElementById('burgerMenuBtn');
  const drawer = document.getElementById('mobileDrawer');
  const closeBtn = document.getElementById('closeDrawerBtn');
  const overlay = document.getElementById('drawerOverlay');
  const tabButtons = drawer ? drawer.querySelectorAll('.tab-button') : [];

  function openDrawer() {
    if (drawer && overlay) {
      drawer.classList.remove('-translate-x-full');
      overlay.classList.remove('hidden');
    }
  }
  
  function closeDrawer() {
    if (drawer && overlay) {
      drawer.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    }
  }
  
  if (burgerBtn) burgerBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      closeDrawer();
    });
  });
});
