/**
 * Learning Progress Tracking Module
 * 
 * Implements spaced repetition learning for Dev Mental Models
 */

// Global learning data
let learningData = {};

// Main initialization function
export function initLearningProgress() {
  // Check if already initialized to prevent duplication
  if (document.getElementById('knowledgeLevelContainer')) {
    console.log("Learning progress already initialized, skipping...");
    return;
  }
  
  loadLearningData();
  addKnowledgeLevelButtons();
  enableStudyMode();
  addLearningStats();
}

// Load learning data from localStorage
function loadLearningData() {
  learningData = JSON.parse(localStorage.getItem("learningData") || "{}");
  
  // Initialize learning data for models that don't have it
  window.mentalModels.forEach(model => {
    if (!learningData[model.name]) {
      learningData[model.name] = {
        lastReviewed: null,
        knowledgeLevel: 0, // 0-5 scale
        nextReviewDate: new Date().toISOString()
      };
    }
  });
  
  localStorage.setItem("learningData", JSON.stringify(learningData));
}

// Add knowledge level buttons to the card back
function addKnowledgeLevelButtons() {
  // Check if container already exists to prevent duplication
  if (document.getElementById('knowledgeLevelContainer')) {
    return;
  }
  
  // Create a container for the buttons
  const container = document.createElement('div');
  container.id = 'knowledgeLevelContainer';
  container.className = 'knowledge-level-container';
  container.innerHTML = `
    <div class="knowledge-level-prompt">How well do you know this?</div>
    <div class="knowledge-level-buttons">
      <button data-level="0" class="knowledge-btn knowledge-level-0">Not at all</button>
      <button data-level="1" class="knowledge-btn knowledge-level-1">Barely</button>
      <button data-level="2" class="knowledge-btn knowledge-level-2">Somewhat</button>
      <button data-level="3" class="knowledge-btn knowledge-level-3">Well</button>
      <button data-level="4" class="knowledge-btn knowledge-level-4">Very well</button>
      <button data-level="5" class="knowledge-btn knowledge-level-5">Mastered</button>
    </div>
  `;
  
  // Add click event listeners to the buttons
  container.querySelectorAll('.knowledge-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation(); // Prevent card flip
      const level = parseInt(btn.getAttribute('data-level'));
      const currentModel = window.getFilteredModels()[window.currentIndex].name;
      updateKnowledgeLevel(currentModel, level);
      window.nextCard(); // Move to the next card
    });
    
    // Store original background color as a data attribute for iOS
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const level = btn.getAttribute('data-level');
      const computedStyle = getComputedStyle(document.documentElement);
      const origColor = computedStyle.getPropertyValue(`--level-${level}-color`).trim();
      btn.setAttribute('data-orig-bg', origColor);
      btn.style.backgroundColor = origColor;
    }
  });
  
  // Find the appropriate insertion point
  // Check if card counter exists first
  const insertAfter = document.getElementById('cardCounter') || 
                      document.querySelector('.card-container');
  
  // Add the container to the DOM
  insertAfter.insertAdjacentElement('afterend', container);
}

// Update knowledge level for a model
function updateKnowledgeLevel(modelName, level) {
  // Calculate next review date using spaced repetition algorithm
  // Intervals increase exponentially with knowledge level
  const daysUntilNextReview = Math.pow(2, level);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysUntilNextReview);
  
  learningData[modelName] = {
    lastReviewed: new Date().toISOString(),
    knowledgeLevel: level,
    nextReviewDate: nextDate.toISOString()
  };
  
  localStorage.setItem("learningData", JSON.stringify(learningData));
  
  // Show a notification
  const levelNames = ["Not at all", "Barely", "Somewhat", "Well", "Very well", "Mastered"];
  const nextReviewDays = daysUntilNextReview === 1 ? "tomorrow" : `in ${daysUntilNextReview} days`;
  
  const notification = document.createElement('div');
  notification.className = 'learning-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-title">Progress saved!</div>
      <div class="notification-text">Knowledge level: <strong>${levelNames[level]}</strong></div>
      <div class="notification-text">Next review: <strong>${nextReviewDays}</strong></div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 500);
  }, 2000);
}

// Add learning indicators to the card
export function addLearningIndicators(modelName) {
  if (!learningData[modelName]) return;
  
  const data = learningData[modelName];
  
  // Create indicator element if it doesn't exist
  let indicator = document.getElementById('learningIndicator');
  
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'learningIndicator';
    indicator.className = 'learning-indicator';
    document.getElementById('cardFront').appendChild(indicator);
  }
  
  // Update the indicator content
  // Level indicator (0-5)
  const levelClass = `level-${data.knowledgeLevel}`;
  indicator.className = `learning-indicator ${levelClass}`;
  
  // Set indicator content
  indicator.innerHTML = `
    <div class="indicator-level">${data.knowledgeLevel}/5</div>
  `;
  
  // Add a due indicator if card is due for review
  const nextReviewDate = new Date(data.nextReviewDate);
  const now = new Date();
  
  if (nextReviewDate <= now) {
    indicator.classList.add('due-for-review');
    indicator.innerHTML += `<span class="due-indicator">REVIEW</span>`;
  }
}

// Create a study mode that prioritizes due cards
function enableStudyMode() {
  // Check if study mode button already exists to prevent duplication
  if (document.getElementById('studyModeBtn')) {
    return;
  }
  
  // Create UI for study mode
  const studyModeBtn = document.createElement('button');
  studyModeBtn.id = 'studyModeBtn';
  studyModeBtn.className = 'study-mode-btn';
  studyModeBtn.textContent = 'Study Mode';
  document.querySelector('.secondary-controls').appendChild(studyModeBtn);
  
  studyModeBtn.addEventListener('click', () => {
    // Get cards due for review
    const now = new Date();
    const dueModels = window.mentalModels.filter(model => {
      if (!learningData[model.name]) return false;
      const nextReview = new Date(learningData[model.name].nextReviewDate);
      return nextReview <= now;
    });
    
    if (dueModels.length === 0) {
      // Show a message if no cards are due
      const notification = document.createElement('div');
      notification.className = 'study-notification';
      notification.textContent = 'No cards due for review!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
      }, 2000);
      return;
    }
    
    // Activate study mode
    document.body.classList.add('study-mode-active');
    
    // Show how many cards are due
    const notification = document.createElement('div');
    notification.className = 'study-notification';
    notification.textContent = `Study mode activated: ${dueModels.length} cards due for review`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 500);
    }, 2000);
    
    // Go to the first due card
    const dueIndex = window.mentalModels.findIndex(model => model.name === dueModels[0].name);
    window.currentIndex = dueIndex;
    window.updateCard(window.currentIndex);
  });
  
  // Add a button to exit study mode
  const exitStudyBtn = document.createElement('button');
  exitStudyBtn.id = 'exitStudyBtn';
  exitStudyBtn.className = 'exit-study-btn';
  exitStudyBtn.textContent = 'Exit Study Mode';
  exitStudyBtn.style.display = 'none';
  document.querySelector('.secondary-controls').appendChild(exitStudyBtn);
  
  exitStudyBtn.addEventListener('click', () => {
    document.body.classList.remove('study-mode-active');
    studyModeBtn.style.display = 'inline-block';
    exitStudyBtn.style.display = 'none';
    window.updateCard(window.currentIndex);
  });
  
  // Toggle button visibility when study mode is active
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'class') {
        const isStudyMode = document.body.classList.contains('study-mode-active');
        studyModeBtn.style.display = isStudyMode ? 'none' : 'inline-block';
        exitStudyBtn.style.display = isStudyMode ? 'inline-block' : 'none';
      }
    });
  });
  
  observer.observe(document.body, { attributes: true });
}

// Add stats view to show learning progress
function addLearningStats() {
  // Check if stats button already exists to prevent duplication
  if (document.getElementById('statsBtn')) {
    return;
  }
  
  // Add a button to show stats
  const statsBtn = document.createElement('button');
  statsBtn.id = 'statsBtn';
  statsBtn.textContent = 'Progress Stats';
  document.querySelector('.secondary-controls').appendChild(statsBtn);
  
  statsBtn.addEventListener('click', () => {
    showLearningStats();
  });
}

// Show learning statistics
function showLearningStats() {
  // Calculate stats
  const totalModels = window.mentalModels.length;
  const reviewedModels = Object.keys(learningData).filter(
    modelName => learningData[modelName].lastReviewed !== null
  ).length;
  
  // Count models at each knowledge level
  const levelCounts = [0, 0, 0, 0, 0, 0]; // Levels 0-5
  
  window.mentalModels.forEach(model => {
    if (learningData[model.name] && learningData[model.name].lastReviewed !== null) {
      const level = learningData[model.name].knowledgeLevel;
      levelCounts[level]++;
    }
  });
  
  // Count models due for review
  const now = new Date();
  const dueModels = window.mentalModels.filter(model => {
    if (!learningData[model.name]) return false;
    const nextReview = new Date(learningData[model.name].nextReviewDate);
    return nextReview <= now;
  }).length;
  
  // Calculate average knowledge level
  const totalLevels = levelCounts.reduce((sum, count, level) => sum + (count * level), 0);
  const avgLevel = reviewedModels > 0 ? (totalLevels / reviewedModels).toFixed(1) : "0.0";
  
  // Create and show the stats dialog
  const statsDialog = document.createElement('div');
  statsDialog.className = 'stats-dialog';
  statsDialog.innerHTML = `
    <div class="stats-content">
      <h3>Learning Progress</h3>
      <div class="stats-close">&times;</div>
      
      <div class="stats-summary">
        <div class="stat-item">
          <div class="stat-value">${reviewedModels}/${totalModels}</div>
          <div class="stat-label">Models Reviewed</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${avgLevel}</div>
          <div class="stat-label">Avg Knowledge Level</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${dueModels}</div>
          <div class="stat-label">Due for Review</div>
        </div>
      </div>
      
      <div class="knowledge-distribution">
        <h4>Knowledge Distribution</h4>
        <div class="level-bars">
          ${levelCounts.map((count, level) => {
            const percentage = totalModels > 0 ? (count / totalModels) * 100 : 0;
            return `
              <div class="level-bar-container">
                <div class="level-bar-label">Level ${level}</div>
                <div class="level-bar">
                  <div class="level-bar-fill level-${level}" style="width: ${percentage}%"></div>
                </div>
                <div class="level-bar-count">${count}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <button class="reset-progress-btn">Reset Progress</button>
    </div>
  `;
  
  document.body.appendChild(statsDialog);
  
  // Add event listeners
  statsDialog.querySelector('.stats-close').addEventListener('click', () => {
    statsDialog.classList.add('closing');
    setTimeout(() => statsDialog.remove(), 300);
  });
  
  statsDialog.querySelector('.reset-progress-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all learning progress?')) {
      localStorage.removeItem('learningData');
      learningData = {};
      loadLearningData();
      statsDialog.remove();
      window.updateCard(window.currentIndex);
    }
  });
  
  // Animate in
  setTimeout(() => statsDialog.classList.add('visible'), 10);
}