/**
 * KYPER Interactive Simulator Engine
 * Showcases the real-world intelligence:
 * 1. "Tu vs Tum vs Aap" Cultural Intelligence
 * 2. Elder/Boss Respect Override
 * 3. Emergency / Sadness Empathy Shield
 * 4. Bank OTP Silent Filter
 * 5. Uncensored Savage Gaali mode
 */

const SIM_SCENARIOS = {
  papa: {
    sender: "Papa 👨‍🦳",
    app: "WhatsApp",
    incoming: "Ghar kab tak aa rahe ho beta? Dinner ready hai.",
    contextType: "ELDER",
    replies: {
      savage: {
        text: "Haanji Papa nikal gaya bas raste me hu, 15-20 min me pahuch raha hu. Aap khana kha lijiye.",
        override: "👑 SANSKAR OVERRIDE: Elder detected ('Papa'). Roast suppressed! Natural respectful tone enforced."
      },
      respect: {
        text: "Haanji Papa bas 15 minute me aa raha hu, aap log khana shuru kar lijiye.",
        override: "👑 RESPECT DYNAMIC: Natural, polite Indian son conversation."
      },
      flirty: {
        text: "Haanji Papa nikal gaya hu, 15 min me ghar pahuch raha hu, aap khana kha lijiye.",
        override: "👑 SANSKAR OVERRIDE: Romantic tones suppressed for parents."
      },
      chill: {
        text: "Haanji Papa nikal gya raste me hu, 15-20 min me aa rha hu.",
        override: "👑 CASUAL RESPECT: Natural short Hinglish texting with Papa."
      }
    }
  },
  boss: {
    sender: "Mr. Sharma (Boss) 💼",
    app: "Telegram",
    incoming: "Kal ki client presentation ready hai kya? Please share the updated deck ASAP.",
    contextType: "SENIOR_PROFESSIONAL",
    replies: {
      savage: {
        text: "Good evening Sir, yes the deck is finalized. Just running the final telemetry numbers and sharing it on your email in 10 mins.",
        override: "👑 SANSKAR OVERRIDE: Professional senior detected ('Boss/Sir'). Roast mode suppressed! Formal tone enforced."
      },
      respect: {
        text: "Ji Sir, presentation deck ready hai. Bas final formatting review karke aapko mail kar raha hu abhi.",
        override: "💼 FORMAL DYNAMIC: Clean, punctual corporate response."
      },
      flirty: {
        text: "Yes Sir, review complete ho gaya hai. Sharing the updated slide deck on your desk in 10 minutes.",
        override: "👑 SANSKAR OVERRIDE: Professional workplace boundary enforced."
      },
      chill: {
        text: "Sir deck almost ready h, final export krke 10 min me share kr rha hu mail pr.",
        override: "⚡ MILD CASUAL: Direct & crisp business status."
      }
    }
  },
  dost: {
    sender: "Aman (Bhai) 😈",
    app: "WhatsApp",
    incoming: "Abe chutiye kahan mar gaya? Kab se wait kar raha hu, nikal jaldi gedi pe chalna h!",
    contextType: "PEER_FRIEND",
    replies: {
      savage: {
        text: "Abe saale gaadi ki chabhi mil nahi rahi thi. 5 min shanti rakh lavde, bike nikaal li hai aa raha hu udd ke!",
        override: "🤬 HARDCORE GAALI MODE: Uncensored peer roast active. Zero asterisk filters!"
      },
      respect: {
        text: "Arey bhai bas 5 minute de, chabhi dhoond raha tha. Nikal raha hu turant.",
        override: "👑 RESPECT: Polite friendly response."
      },
      flirty: {
        text: "Itni bechaini mere bina? Bas 5 min me aa raha hu tere saamne, chain rakh thoda.",
        override: "❤️ PLAYFUL BRO: Fun teasing dynamic."
      },
      chill: {
        text: "Bhai bs 5 min de yr chabhi dhoond rha hu, nikal rha hu abi turant.",
        override: "✍️ STYLE CLONER: Short words applied ('bs', 'yr', 'rha', 'abi')."
      }
    }
  },
  crush: {
    sender: "Aanya (Crush) ❤️",
    app: "Instagram",
    incoming: "Tumhara reply itna late kyu aata hai? Mujhe lagta hai tum mujhe bhoolte ja rahe ho... 🥺",
    contextType: "ROMANTIC_CRUSH",
    replies: {
      savage: {
        text: "Bhoolne ki aukaat meri kahan madam? Bas kaam me phasa tha, par phone screen par naam to sabse pehle tumhara hi check kiya ❤️",
        override: "😏 CHARMING WIT: Playful flirty counter-banter with enforced 'Tum' dynamic."
      },
      respect: {
        text: "Arey bilkul nahi! Bas thoda busy ho gaya tha. Bhoolne ka to sawaal hi nahi uthta, tum batao kaisi ho?",
        override: "👑 RESPECTFUL PARTNER: Sweet caring 'Tum' dynamic."
      },
      flirty: {
        text: "Tumhe bhoolna? Itna risk to mai sapne me bhi na lu. Bas tumhare hi baare me soch raha tha, tumse baat kiye bina din thodi banta hai ❤️",
        override: "❤️ ROMANTIC MAXIMUM: Smooth, affectionate conversational charm with 'Tum'."
      },
      chill: {
        text: "Arey bilkul ni yr, bs thoda kaam me phasa tha. Bhoola ni hu bilkul, btt krte h na.",
        override: "✍️ STYLE CLONER: Sweet casual Hinglish."
      }
    }
  },
  emergency: {
    sender: "Vikas (Brother) 🚨",
    app: "WhatsApp",
    incoming: "Bhai urgent hai, Rohit ka bike accident ho gaya ring road pe! Immediate hospital aaja please!",
    contextType: "EMERGENCY_CRISIS",
    replies: {
      savage: {
        text: "Bhai kya hua?! Kaunse hospital me ho? Location bhej turant, mai bike nikaal ke seedha wahin pahuch raha hu!",
        override: "🛡️ EMPATHY SHIELD TRIGGERED: 'accident' keyword detected! Savage & joke mode instantly aborted. Crisis assistance active."
      },
      respect: {
        text: "Bhai please exact hospital ka naam aur location bhej, mai turant nikal raha hu. Himmat rakh sab theek hoga.",
        override: "🛡️ EMPATHY SHIELD: Immediate urgent assistance."
      },
      flirty: {
        text: "Bhai location bhej jaldi, mai bike leke nikal chuka hu! Kaunsa hospital hai batao?",
        override: "🛡️ EMPATHY SHIELD: Humor suppressed in crisis."
      },
      chill: {
        text: "Bhai kaunse hospital me h? Location bhej turant mai abi nikal rha hu!",
        override: "🛡️ EMPATHY SHIELD: Emergency priority response."
      }
    }
  },
  bank: {
    sender: "VM-HDFCBK 🏦",
    app: "SMS",
    incoming: "Your A/C XX8902 is debited by INR 35,000.00 on 19-Nov-26 via UPI. If not done by you, call 1800-2222. OTP is 729104.",
    contextType: "BANK_FINANCIAL_SENSITIVE",
    replies: {
      savage: {
        text: "🔇 [SHIELD ACTIVE]: No response sent. Bank OTP / transaction alerts are protected and never auto-replied to.",
        override: "🔒 BANK OTP SHIELD: Detected financial keywords ('debited', 'INR', 'OTP'). KYPER silently discards the message to prevent security breaches."
      },
      respect: {
        text: "🔇 [SHIELD ACTIVE]: No response sent. Bank OTP / transaction alerts are protected and never auto-replied to.",
        override: "🔒 BANK OTP SHIELD: Protection active across all modes."
      },
      flirty: {
        text: "🔇 [SHIELD ACTIVE]: No response sent. Bank OTP / transaction alerts are protected and never auto-replied to.",
        override: "🔒 BANK OTP SHIELD: Protection active."
      },
      chill: {
        text: "🔇 [SHIELD ACTIVE]: No response sent. Bank OTP / transaction alerts are protected and never auto-replied to.",
        override: "🔒 BANK OTP SHIELD: Protection active."
      }
    }
  }
};

let currentScenario = 'papa';
let currentTone = 'savage';
let isTyping = false;

function initSimulator() {
  const scenarioBtns = document.querySelectorAll('[data-scenario]');
  const toneBtns = document.querySelectorAll('[data-tone]');

  scenarioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      scenarioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentScenario = btn.dataset.scenario;
      if (window.soundEngine) window.soundEngine.playClick();
      runSimulation();
    });
  });

  toneBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toneBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTone = btn.dataset.tone;
      if (window.soundEngine) window.soundEngine.playClick();
      runSimulation();
    });
  });

  // Run initial simulation
  runSimulation();
}

function runSimulation() {
  if (isTyping) return;
  const scenario = SIM_SCENARIOS[currentScenario];
  if (!scenario) return;

  const targetReplyData = scenario.replies[currentTone] || scenario.replies.chill;

  // Update Sender Message Box
  const senderNameEl = document.getElementById('simSenderName');
  const appBadgeEl = document.getElementById('simAppBadge');
  const incomingMsgEl = document.getElementById('simIncomingMsg');
  const brainConsoleEl = document.getElementById('simBrainConsole');
  const replyOutputEl = document.getElementById('simReplyOutput');

  if (senderNameEl) senderNameEl.textContent = scenario.sender;
  if (appBadgeEl) appBadgeEl.textContent = scenario.app;
  if (incomingMsgEl) incomingMsgEl.textContent = `"${scenario.incoming}"`;

  if (window.soundEngine) {
    if (currentScenario === 'bank' || currentScenario === 'emergency') {
      window.soundEngine.playShield();
    } else {
      window.soundEngine.playNotification();
    }
  }

  // Telemetry Brain Analysis
  let brainLogs = `[1] Ingestion: Message from ${scenario.sender} (${scenario.app})\n`;
  brainLogs += `[2] Context Classifier: ${scenario.contextType}\n`;
  brainLogs += `[3] Selected Tone: ${currentTone.toUpperCase()}\n`;
  brainLogs += `[4] Rules Engine: ${targetReplyData.override}\n`;
  brainLogs += `[5] Status: Generating response...`;

  if (brainConsoleEl) brainConsoleEl.textContent = brainLogs;

  // Start Typing Effect for Ghost Reply
  isTyping = true;
  if (replyOutputEl) replyOutputEl.innerHTML = '<span class="typing-cursor"></span>';

  const fullText = targetReplyData.text;
  let charIdx = 0;

  const timer = setInterval(() => {
    charIdx += 2;
    if (charIdx > fullText.length) charIdx = fullText.length;

    if (replyOutputEl) {
      replyOutputEl.innerHTML = fullText.substring(0, charIdx) + (charIdx < fullText.length ? '<span class="typing-cursor"></span>' : '');
    }

    if (window.soundEngine && charIdx % 6 === 0) {
      window.soundEngine.playType();
    }

    if (charIdx >= fullText.length) {
      clearInterval(timer);
      isTyping = false;
      if (brainConsoleEl) {
        brainConsoleEl.textContent = brainLogs.replace('Status: Generating response...', 'Status: ⚡ 200 OK • Delivered in 142ms via Cloudflare AI Worker');
      }
    }
  }, 22);
}

document.addEventListener('DOMContentLoaded', initSimulator);
