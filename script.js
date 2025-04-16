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
    
    // Debug info - log current index and model count
    console.log(`Update card: index=${index}, total models=${filteredModels.length}`);
  }
  
  function nextCard() {
    const filtered = getFilteredModels();
    if (filtered.length === 0) return;
    
    currentIndex = (currentIndex + 1) % filtered.length;
    updateCard(currentIndex);
  }
  
  function prevCard() {
    const filtered = getFilteredModels();
    if (filtered.length === 0) return;
    
    currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
    updateCard(currentIndex);
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
  }
  
  function flipCard() {
    // Force iOS to recognize the change
    setTimeout(function() {
      card.classList.toggle("flipped");
      console.log("Card flipped");
    }, 0);
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
  }
  
  function getFilteredModels() {
    const selectedTag = tagFilter.value;
    const filtered = selectedTag === "all"
      ? mentalModels
      : mentalModels.filter(m => m.tags.includes(selectedTag));
    
    console.log(`Filtered models: ${filtered.length} models for tag '${selectedTag}'`);
    console.log(filtered.map(m => m.name).join(', '));
    return filtered;
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
  });
  
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
        .primary-controls button, .secondary-controls button {
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
    
    // Simple approach for buttons - use simpler events
    document.querySelectorAll('button').forEach(btn => {
      const isPrimary = btn.closest('.primary-controls') !== null;
      
      // Save original background colors
      const origBg = isPrimary ? 
        getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() : 
        getComputedStyle(document.documentElement).getPropertyValue('--btn-bg').trim();
      
      btn.addEventListener('mousedown', function() {
        this.style.backgroundColor = isPrimary ? '#3c5bd8' : '#d0d0d0';
      });
      
      btn.addEventListener('mouseup', function() {
        this.style.backgroundColor = origBg;
      });
      
      btn.addEventListener('mouseleave', function() {
        this.style.backgroundColor = origBg;
      });
    });
    
    // Fix card flipping specifically for iOS
    const cardElement = document.getElementById('card');
    
    // Remove the inline onclick handler that might be causing issues
    cardElement.removeAttribute('onclick');
    
    // Add a simple click event listener directly
    cardElement.addEventListener('click', function(e) {
      flipCard();
    });
  }
  
  // Initialize function
  function initialize() {
    console.log("Initializing app...");
    console.log(`Loaded ${mentalModels.length} mental models`);
    
    applyDarkModeSetting();
    updateTagOptions();
    initializeCardFlipping();
    
    // Force reset the current index
    currentIndex = 0;
    updateCard(currentIndex);
    
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