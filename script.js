// Import learning progress module
import { initLearningProgress, addLearningIndicators } from './learning-progress.js';

const DEFAULT_MODELS = [
  {
    name: "YAGNI",
    explanation: "You Aren't Gonna Need It – don't implement something unless it's necessary.",
    tags: ["architecture", "planning"]
  },
  {
    name: "Separation of Concerns",
    explanation: "Divide software into distinct sections, each addressing a _separate concern_.",
    tags: ["architecture"]
  },
  {
    name: "Single Responsibility Principle",
    explanation: "A module or class should have one, and only one, `reason to change`.",
    tags: ["backend", "architecture"]
  },
  {
    name: "Cognitive Load",
    explanation: "Minimize the **mental effort** required to understand code or UI.",
    tags: ["frontend", "ux"]
  }
];

// Expose globals for use in learning-progress.js
window.mentalModels = loadModels();
window.currentIndex = 0;
// Track if learning progress has been initialized
window.learningProgressInitialized = false;

const card = document.getElementById("card");
const front = document.getElementById("cardFront");
const back = document.getElementById("cardBack");
const tagFilter = document.getElementById("tagFilter");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

// Expose helper functions for learning-progress.js
window.renderExplanation = function(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

window.updateCard = function(index) {
  const filteredModels = getFilteredModels();
  if (filteredModels.length === 0) {
    front.textContent = "No models match this filter";
    back.innerHTML = "Try selecting a different tag";
    return;
  }
  
  const model = filteredModels[index];
  if (!model) return;
  
  front.textContent = model.name;
  back.innerHTML = renderExplanation(model.explanation);
  
  // Add learning progress indicators if enabled
  if (typeof addLearningIndicators === 'function') {
    addLearningIndicators(model.name);
  }
  
  // Update card counter display
  updateCardCounter(index, filteredModels.length);
  
  card.classList.remove("flipped");
  
  // Add a subtle animation
  card.style.animation = "none";
  setTimeout(() => {
    card.style.animation = "cardPulse 0.5s ease";
  }, 10);
  
  // Debug info - log current index and model count
  console.log(`Update card: index=${index}, total models=${filteredModels.length}`);
}

// Add function to update the card counter
function updateCardCounter(currentIndex, totalCards) {
  // Create counter element if it doesn't exist
  if (!document.getElementById('cardCounter')) {
    const counterEl = document.createElement('div');
    counterEl.id = 'cardCounter';
    counterEl.className = 'card-counter';
    document.querySelector('.card-container').insertAdjacentElement('afterend', counterEl);
  }
  
  // Update counter text
  const counterEl = document.getElementById('cardCounter');
  counterEl.textContent = `Card ${currentIndex + 1} of ${totalCards}`;
}

window.nextCard = function() {
  const filtered = getFilteredModels();
  if (filtered.length === 0) return;
  
  window.currentIndex = (window.currentIndex + 1) % filtered.length;
  updateCard(window.currentIndex);
}

window.prevCard = function() {
  const filtered = getFilteredModels();
  if (filtered.length === 0) return;
  
  window.currentIndex = (window.currentIndex - 1 + filtered.length) % filtered.length;
  updateCard(window.currentIndex);
}

window.shuffleCard = function() {
  const filtered = getFilteredModels();
  if (filtered.length <= 1) return;
  
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * filtered.length);
  } while (newIndex === window.currentIndex);
  
  window.currentIndex = newIndex;
  updateCard(window.currentIndex);
}

function flipCard() {
  const card = document.getElementById("card");
  card.classList.toggle("flipped");
}  

function initializeCardFlipping() {
  // Remove any existing listeners first to avoid duplication
  card.removeEventListener('click', flipCard);
  // Add the click handler - use actual function reference not a string
  card.addEventListener('click', flipCard);
  console.log("Card flipping initialized");
}

function loadModels() {
  const local = JSON.parse(localStorage.getItem("mentalModels") || "[]");
  return [...DEFAULT_MODELS, ...local];
}

function saveModel(name, explanation, tags) {
  const newModel = {
    name,
    explanation,
    tags: tags.split(",").map(t => t.trim()).filter(t => t)
  };
  
  const local = JSON.parse(localStorage.getItem("mentalModels") || "[]");
  local.push(newModel);
  localStorage.setItem("mentalModels", JSON.stringify(local));
  window.mentalModels.push(newModel);
  updateTagOptions();
  
  // Show success message with animation
  const successMsg = document.createElement("div");
  successMsg.textContent = "New mental model saved!";
  successMsg.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim()};
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: fadeIn 0.3s, fadeOut 0.3s 2s forwards;
  `;
  document.body.appendChild(successMsg);
  
  setTimeout(() => {
    successMsg.remove();
  }, 2500);
}

window.getFilteredModels = function() {
  const selectedTag = tagFilter.value;
  const filtered = selectedTag === "all"
    ? window.mentalModels
    : window.mentalModels.filter(m => m.tags.includes(selectedTag));
  
  console.log(`Filtered models: ${filtered.length} models for tag '${selectedTag}'`);
  console.log(filtered.map(m => m.name).join(', '));
  return filtered;
}

function updateTagOptions() {
  const allTags = new Set(window.mentalModels.flatMap(m => m.tags));
  tagFilter.innerHTML = `<option value="all">All</option>`;
  
  // Sort tags alphabetically
  [...allTags].sort().forEach(tag => {
    tagFilter.innerHTML += `<option value="${tag}">${tag}</option>`;
  });
}

tagFilter.addEventListener("change", () => {
  window.currentIndex = 0;
  updateCard(window.currentIndex);
});

document.getElementById("addModelForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = e.target.name.value;
  const explanation = e.target.explanation.value;
  const tags = e.target.tags.value;
  
  if (name && explanation && tags) {
    saveModel(name, explanation, tags);
    e.target.reset();
    updateCard(window.currentIndex);
  }
});

// Dark Mode Toggle
const toggleBtn = document.getElementById("darkModeToggle");

function applyDarkModeSetting() {
  const darkMode = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark", darkMode);
}

toggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark);
});

// Export functionality
window.downloadCards = function(type) {
  const local = JSON.parse(localStorage.getItem("mentalModels") || "[]");
  const allCards = [...DEFAULT_MODELS, ...local];

  let data = "";
  let filename = "";

  if (type === "json") {
    data = JSON.stringify(allCards, null, 2);
    filename = "mental-models.json";
  } else {
    data = allCards
      .map(m => `## ${m.name}\n\n${m.explanation}\n\nTags: ${m.tags.join(", ")}`)
      .join("\n\n---\n\n");
    filename = "mental-models.md";
  }

  const blob = new Blob([data], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
  
  // Add a download confirmation
  const dlMsg = document.createElement("div");
  dlMsg.textContent = `${filename} downloaded`;
  dlMsg.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim()};
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: fadeIn 0.3s, fadeOut 0.3s 2s forwards;
  `;
  document.body.appendChild(dlMsg);
  
  setTimeout(() => {
    dlMsg.remove();
  }, 2500);
}

// Add animations to the CSS
const style = document.createElement('style');
style.textContent = `
@keyframes cardPulse {
  0% { transform: scale(0.98); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes buttonPress {
  0% { transform: translateY(0); }
  50% { transform: translateY(2px); }
  100% { transform: translateY(0); }
}
`;
document.head.appendChild(style);

// Function to fix iOS button interactions
function fixIOSButtonInteractions() {
  // Add iOS specific style for animations
  const iosFix = document.createElement('style');
  iosFix.textContent = `
    @supports (-webkit-touch-callout: none) {
      .primary-controls button, .secondary-controls button, .knowledge-btn {
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Animation classes */
      .button-press-animation {
        animation: buttonPress 0.3s ease;
      }
    }
  `;
  document.head.appendChild(iosFix);
  
  // Set document properties 
  document.documentElement.style.setProperty('--accent-color', '#4c6ef5');
  
  // Fix for all buttons including knowledge level buttons
  const handleButtons = (buttons, isKnowledgeBtn = false) => {
    buttons.forEach(btn => {
      // Determine the original background color based on button type
      let origBg;
      
      if (isKnowledgeBtn) {
        // Get original color from the button's class
        const level = btn.getAttribute('data-level');
        origBg = getComputedStyle(document.documentElement)
          .getPropertyValue(`--level-${level}-color`).trim();
      } else {
        const isPrimary = btn.closest('.primary-controls') !== null;
        origBg = isPrimary ? 
          getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() : 
          getComputedStyle(document.documentElement).getPropertyValue('--btn-bg').trim();
      }
      
      // Store the original color as a data attribute
      btn.setAttribute('data-orig-bg', origBg);
      
      // Event listeners for iOS touch events
      btn.addEventListener('touchstart', function() {
        const darkerColor = adjustColor(origBg, -20); // Make color darker
        this.style.backgroundColor = darkerColor;
      });
      
      btn.addEventListener('touchend', function() {
        // Restore original color
        this.style.backgroundColor = this.getAttribute('data-orig-bg');
      });
      
      btn.addEventListener('touchcancel', function() {
        // Restore original color
        this.style.backgroundColor = this.getAttribute('data-orig-bg');
      });
      
      // Also keep the mouse events for hybrid devices
      btn.addEventListener('mousedown', function() {
        const darkerColor = adjustColor(origBg, -20); // Make color darker
        this.style.backgroundColor = darkerColor;
      });
      
      btn.addEventListener('mouseup', function() {
        // Restore original color
        this.style.backgroundColor = this.getAttribute('data-orig-bg');
      });
      
      btn.addEventListener('mouseleave', function() {
        // Restore original color
        this.style.backgroundColor = this.getAttribute('data-orig-bg');
      });
    });
  };
  
  // Apply to regular buttons
  handleButtons(document.querySelectorAll('button:not(.knowledge-btn)'));
  
  // Set up an observer to handle knowledge buttons when they're added to the DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check added nodes for knowledge buttons
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            const knowledgeBtns = node.querySelectorAll ? 
              node.querySelectorAll('.knowledge-btn') : [];
            
            if (knowledgeBtns.length > 0) {
              handleButtons(knowledgeBtns, true);
            }
          }
        });
      }
    });
  });
  
  // Start observing the document for added nodes
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Check if knowledge buttons are already in the DOM
  const existingKnowledgeBtns = document.querySelectorAll('.knowledge-btn');
  if (existingKnowledgeBtns.length > 0) {
    handleButtons(existingKnowledgeBtns, true);
  }
  
  // Fix card flipping specifically for iOS
  const cardElement = document.getElementById('card');
  
  // Remove the inline onclick handler that might be causing issues
  cardElement.removeAttribute('onclick');
  
  const inner = cardElement.querySelector('.card-inner');
  inner.classList.toggle("ios-fix");
}

// Helper function to adjust a color by a percentage
function adjustColor(color, percent) {
  // Handle hex colors
  if (color.startsWith('#')) {
    let r = parseInt(color.substr(1, 2), 16);
    let g = parseInt(color.substr(3, 2), 16);
    let b = parseInt(color.substr(5, 2), 16);
    
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // Handle rgb colors
  if (color.startsWith('rgb')) {
    const parts = color.match(/\d+/g);
    if (parts && parts.length >= 3) {
      const r = Math.max(0, Math.min(255, parseInt(parts[0]) + percent));
      const g = Math.max(0, Math.min(255, parseInt(parts[1]) + percent));
      const b = Math.max(0, Math.min(255, parseInt(parts[2]) + percent));
      
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  
  // If color format not recognized, return original
  return color;
}

// Initialize function
function initialize() {
  console.log("Initializing app...");
  console.log(`Loaded ${window.mentalModels.length} mental models`);
  
  applyDarkModeSetting();
  updateTagOptions();
  initializeCardFlipping();
  
  // Initialize learning progress tracking only once
  if (typeof initLearningProgress === 'function' && !window.learningProgressInitialized) {
    initLearningProgress();
    window.learningProgressInitialized = true;
  }
  
  // Force reset the current index
  window.currentIndex = 0;
  updateCard(window.currentIndex);
  
  // Special iOS Safari fix
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    console.log("iOS device detected, applying special fixes");
    fixIOSButtonInteractions();
  }
}

// Call initialize on load
window.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded");
  initialize();
});

// Also call initialize now in case DOM is already loaded
initialize();