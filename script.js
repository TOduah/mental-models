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
  
  let mentalModels = loadModels();
  let currentIndex = 0;
  
  const card = document.getElementById("card");
  const front = document.getElementById("cardFront");
  const back = document.getElementById("cardBack");
  const tagFilter = document.getElementById("tagFilter");
  const prevButton = document.getElementById("prevButton");
  const nextButton = document.getElementById("nextButton");
  
  // iOS color fix functions
  function fixIOSButtonColors() {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Apply iOS-specific button fixes
      document.querySelectorAll('.primary-controls button').forEach(btn => {
        btn.addEventListener('touchstart', () => {
          btn.style.backgroundColor = btn.getAttribute('data-active-color') || '#3c5bd8';
        }, { passive: true });
        
        btn.addEventListener('touchend', () => {
          setTimeout(() => {
            // Get the computed CSS variable value instead of using the variable syntax directly
            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
            btn.style.backgroundColor = accentColor;
          }, 50);
        }, { passive: true });
      });
    }
  }
  
  function renderExplanation(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>");
  }
  
  function updateCard(index) {
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
    card.classList.remove("flipped");
    
    // Add a subtle animation
    card.style.animation = "none";
    setTimeout(() => {
      card.style.animation = "cardPulse 0.5s ease";
    }, 10);
  }
  
  function nextCard() {
    // Force button color reset in iOS
    resetButtonStyle(nextButton, getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim());
    
    const filtered = getFilteredModels();
    if (filtered.length === 0) return;
    
    currentIndex = (currentIndex + 1) % filtered.length;
    updateCard(currentIndex);
    
    // Reset the button style completely to fix "stuck" appearance
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setTimeout(() => {
        nextButton.style.transform = "none";
        nextButton.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
      }, 100);
    }
  }
  
  function prevCard() {
    // Force button color reset in iOS
    resetButtonStyle(prevButton, getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim());
    
    const filtered = getFilteredModels();
    if (filtered.length === 0) return;
    
    currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
    updateCard(currentIndex);
    
    // Reset the button style completely to fix "stuck" appearance
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setTimeout(() => {
        prevButton.style.transform = "none";
        prevButton.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
      }, 100);
    }
  }
  
  // Function to force button style reset for iOS
  function resetButtonStyle(button, color) {
    // Force button color reset for iOS
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // First set a different color to force a repaint
      button.style.backgroundColor = button.getAttribute('data-active-color') || '#3c5bd8';
      
      // Then revert back to the original color
      setTimeout(() => {
        button.style.backgroundColor = color;
        
        // Also reset transform and shadow properties to fix "stuck" button appearance
        button.style.transform = "none";
        button.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
      }, 10);
    }
  }
  
  function shuffleCard() {
    const filtered = getFilteredModels();
    if (filtered.length <= 1) return;
    
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * filtered.length);
    } while (newIndex === currentIndex);
    
    currentIndex = newIndex;
    updateCard(currentIndex);
    
    // Reset all button styles after any interaction
    resetAllButtonStyles();
  }
  
  // New helper function to reset all button styles
  function resetAllButtonStyles() {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      document.querySelectorAll('button').forEach(btn => {
        setTimeout(() => {
          const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
          if (btn.classList.contains('primary-button')) {
            btn.style.backgroundColor = accentColor;
          } else {
            const btnBg = getComputedStyle(document.documentElement).getPropertyValue('--btn-bg').trim();
            btn.style.backgroundColor = btnBg;
          }
          btn.style.transform = "none";
          btn.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
        }, 100);
      });
    }
  }
  
  function flipCard() {
    card.classList.toggle("flipped");
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
    mentalModels.push(newModel);
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
    
    // Reset all button styles after form submission
    resetAllButtonStyles();
  }
  
  function getFilteredModels() {
    const selectedTag = tagFilter.value;
    return selectedTag === "all"
      ? mentalModels
      : mentalModels.filter(m => m.tags.includes(selectedTag));
  }
  
  function updateTagOptions() {
    const allTags = new Set(mentalModels.flatMap(m => m.tags));
    tagFilter.innerHTML = `<option value="all">All</option>`;
    
    // Sort tags alphabetically
    [...allTags].sort().forEach(tag => {
      tagFilter.innerHTML += `<option value="${tag}">${tag}</option>`;
    });
  }
  
  tagFilter.addEventListener("change", () => {
    currentIndex = 0;
    updateCard(currentIndex);
    // Reset button styles when filter changes
    resetAllButtonStyles();
  });
  
  document.getElementById("addModelForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = e.target.name.value;
    const explanation = e.target.explanation.value;
    const tags = e.target.tags.value;
    
    if (name && explanation && tags) {
      saveModel(name, explanation, tags);
      e.target.reset();
      updateCard(currentIndex);
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
    // Reset button styles when toggling dark mode
    resetAllButtonStyles();
  });
  
  // Additional iOS button fixes - store original colors for reference
  function initializeIOSFixes() {
    // Set data attributes for iOS color reference
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Add event listeners to force color refresh on touchend
      document.querySelectorAll('button').forEach(btn => {
        // Get computed style
        const style = getComputedStyle(btn);
        const bgColor = style.backgroundColor;
        
        // Store original color
        btn.setAttribute('data-original-color', bgColor);
        
        // Set active color (slightly darker)
        if (btn.classList.contains('primary-controls')) {
          btn.setAttribute('data-active-color', '#3c5bd8'); // Darker blue
        } else {
          btn.setAttribute('data-active-color', '#d0d0d0'); // Darker gray
        }
        
        // Add special iOS handlers
        btn.addEventListener('touchend', function() {
          // Small delay to ensure the color reset happens after iOS releases the button
          setTimeout(() => {
            if (this.classList.contains('primary-button')) {
              const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
              this.style.backgroundColor = accentColor;
            } else {
              const btnBg = getComputedStyle(document.documentElement).getPropertyValue('--btn-bg').trim();
              this.style.backgroundColor = btnBg;
            }
            // Reset transform and shadow explicitly
            this.style.transform = "none";
            this.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
          }, 50);
        }, { passive: true });
      });
  
      // Apply CSS fixes for iOS - Add specific rules to force button reset
      const styleFixForIOS = document.createElement('style');
      styleFixForIOS.textContent = `
        /* iOS-specific overrides */
        @supports (-webkit-touch-callout: none) {
          .primary-controls button {
            background-color: var(--accent-color) !important;
            transition: background-color 0.2s ease;
          }
          
          .primary-controls button:active {
            background-color: #3c5bd8 !important;
            transform: translateY(1px);
          }
          
          /* Force reset after tap */
          .primary-controls button::after {
            content: "";
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }
        }
      `;
      document.head.appendChild(styleFixForIOS);
      
      // Add touch listeners to the body to help reset stuck buttons
      document.body.addEventListener('touchstart', function(e) {
        if (!e.target.closest('button')) {
          resetAllButtonStyles();
        }
      }, { passive: true });
    }
  }
  
  // Export functionality
  function downloadCards(type) {
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
    
    // Reset button styles after download
    resetAllButtonStyles();
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
  `;
  document.head.appendChild(style);
  
  // Initialize on page load
  function initialize() {
    applyDarkModeSetting();
    updateTagOptions();
    updateCard(currentIndex);
    
    // Special iOS Safari fix
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Add iOS specific style fixes for button reset
      const iosFix = document.createElement('style');
      iosFix.textContent = `
        /* Force iOS button reset */
        @supports (-webkit-touch-callout: none) {
          button {
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
            transition: background-color 0.2s ease !important;
          }
          
          /* Override hover effects to prevent stuck state */
          .primary-controls button:hover,
          .secondary-controls button:hover {
            transform: none !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
          }
        }
      `;
      document.head.appendChild(iosFix);
      
      // Set document properties 
      document.documentElement.style.setProperty('--accent-color', '#4c6ef5');
      
      // Force repaint buttons on iOS Safari
      const btnStyle = document.createElement('style');
      btnStyle.textContent = `
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          .primary-controls button {
            background-color: #4c6ef5 !important;
          }
          .primary-controls button:active {
            background-color: #3c5bd8 !important;
          }
        }
      `;
      document.head.appendChild(btnStyle);
    }
    
    // Initialize iOS fixes last
    initializeIOSFixes();
  }
  
  // Call initialize on load
  document.addEventListener('DOMContentLoaded', initialize);
  initialize(); // Also call it now in case DOM is already loaded