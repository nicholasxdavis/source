const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/cypher-alpha:free';
const FREE_PLAN_LIMIT = 20;

class SourcereApp {
  constructor() {
    this.user = null;
    this.session = null;
    this.abortController = null;
    this.currentChatId = null;
    this.todayMessages = 0;
    this.userPlan = 'free';
    this.currentModel = DEFAULT_MODEL;
    this.hasActiveSubscription = false;
    this.knowledge = '';
    
    this.authManager = new AuthManager(this);
    this.uiManager = new UIManager(this);
    
    this.initialize();
  }

  initialize() {
    this.authManager.initializeAuth();
    this.initializeEventListeners();
    this.loadChats();
  }

  updateUI() {
    this.uiManager.updateUI();
  }

  initializeEventListeners() {
    // Account management
    document.getElementById('accountBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.authManager.toggleAccountPopup();
    });

    document.getElementById('upgradeSidebarBtn')?.addEventListener('click', () => {
      this.handleUpgradeButton();
    });

    document.getElementById('closePricingModalBtn')?.addEventListener('click', () => {
      this.uiManager.hidePricingModal();
    });

    document.getElementById('closeKnowledgeModalBtn')?.addEventListener('click', () => {
      this.uiManager.hideKnowledgeModal();
    });

    document.getElementById('saveKnowledgeBtn')?.addEventListener('click', () => {
      this.saveKnowledge();
    });

    document.getElementById('knowledgeBtn')?.addEventListener('click', () => {
      this.uiManager.showKnowledgeModal();
    });

    document.getElementById('modelSelector')?.addEventListener('change', (e) => {
      this.currentModel = e.target.value;
    });

    // Generation
    document.getElementById('generateBtn')?.addEventListener('click', () => {
      this.generateResourceGuide();
    });

    document.getElementById('topicInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.generateResourceGuide();
      }
    });

    // Side panel and new chat
    document.getElementById('newChatBtn')?.addEventListener('click', () => {
      this.createNewChat();
    });

    document.getElementById('newChatBtnCollapsed')?.addEventListener('click', () => {
      this.createNewChat();
    });

    // Event delegation for dynamic elements
    document.addEventListener('click', (e) => {
      if (e.target.id === 'stopGenerationBtn') {
        this.abortGeneration();
      }
      
      if (e.target.classList.contains('save-guide-btn') || e.target.closest('.save-guide-btn')) {
        const card = e.target.closest('.guide-card');
        if (card) {
          const topic = card.dataset.topic;
          const content = card.querySelector('.message-content')?.innerHTML;
          if (topic && content) {
            this.saveGuide(topic, content);
          }
        }
      }
      
      if (e.target.classList.contains('delete-chat-btn')) {
        const chatItem = e.target.closest('.chat-item');
        if (chatItem) {
          const chatId = chatItem.dataset.chatId;
          this.deleteChat(chatId);
        }
      }
      
      if (e.target.classList.contains('rename-chat-btn')) {
        const chatItem = e.target.closest('.chat-item');
        if (chatItem) {
          const chatId = chatItem.dataset.chatId;
          const currentTitle = chatItem.querySelector('.chat-title')?.textContent;
          this.renameChat(chatId, currentTitle);
        }
      }

      if (e.target.classList.contains('download-btn') || e.target.closest('.download-btn')) {
        const card = e.target.closest('.guide-card');
        if (card) {
          this.downloadAsPDF(card);
        }
      }

      if (e.target.classList.contains('copy-btn') || e.target.closest('.copy-btn')) {
        const card = e.target.closest('.guide-card');
        if (card) {
          this.copyToClipboard(card);
        }
      }

      if (e.target.classList.contains('regen-btn') || e.target.closest('.regen-btn')) {
        const card = e.target.closest('.guide-card');
        if (card) {
          const topic = card.dataset.topic;
          this.regenerateGuide(topic);
        }
      }
    });
  }

  // Chat methods
  getChats() {
    try {
      const chatsJson = localStorage.getItem('sourcere_chats');
      return chatsJson ? JSON.parse(chatsJson) : [];
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    }
  }

  saveChats(chats) {
    localStorage.setItem('sourcere_chats', JSON.stringify(chats));
  }

  createNewChat() {
    const newChatId = Date.now().toString();
    this.currentChatId = newChatId;
    
    const chats = this.getChats();
    chats.unshift({
      id: newChatId,
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      messages: []
    });
    
    this.saveChats(chats);
    this.loadChats();
    this.clearResults();
    
    const topicInput = document.getElementById('topicInput');
    if (topicInput) topicInput.value = '';
    
    this.uiManager.closeSidePanel();
  }

  loadChat(chatId) {
    const chats = this.getChats();
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) return;
    
    this.currentChatId = chatId;
    this.clearResults();
    
    const emptyState = document.getElementById('emptyState');
    const resultsSection = document.getElementById('resultsSection');
    
    if (chat.messages?.length > 0) {
      if (emptyState) emptyState.classList.add('hidden');
      if (resultsSection) resultsSection.classList.remove('hidden');
      
      chat.messages.forEach(message => {
        this.displayMessage(message.role, message.content);
      });
      
      setTimeout(() => {
        const mainElement = document.querySelector('main');
        if (mainElement) mainElement.scrollTop = mainElement.scrollHeight;
      }, 100);
    } else {
      if (emptyState) emptyState.classList.remove('hidden');
      if (resultsSection) resultsSection.classList.add('hidden');
    }
    
    this.loadChats();
    this.uiManager.closeSidePanel();
  }

  saveCurrentChat(topic, content) {
    if (!this.currentChatId) return;
    
    const chats = this.getChats();
    const chatIndex = chats.findIndex(c => c.id === this.currentChatId);
    
    if (chatIndex === -1) return;
    
    if (chats[chatIndex].title === 'New Chat') {
      chats[chatIndex].title = topic || 'Untitled Chat';
    }
    
    if (!chats[chatIndex].messages) {
      chats[chatIndex].messages = [];
    }
    
    chats[chatIndex].messages.push({
      role: 'assistant',
      content: content,
      createdAt: new Date().toISOString()
    });
    
    this.saveChats(chats);
    this.loadChats();
  }

  deleteChat(chatId) {
    const chats = this.getChats();
    const updatedChats = chats.filter(c => c.id !== chatId);
    
    if (chatId === this.currentChatId) {
      this.currentChatId = null;
      this.clearResults();
    }
    
    this.saveChats(updatedChats);
    this.loadChats();
    this.showNotification('Chat deleted');
  }

  renameChat(chatId, newTitle) {
    if (!newTitle || newTitle.trim() === '') return;
    
    const chats = this.getChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);
    
    if (chatIndex === -1) return;
    
    chats[chatIndex].title = newTitle.trim();
    this.saveChats(chats);
    this.loadChats();
    this.showNotification('Chat renamed');
  }

  // Generation methods
  async generateResourceGuide() {
    const topicInput = document.getElementById('topicInput');
    if (!topicInput) {
      console.error('Topic input not found');
      return;
    }
    
    const topic = topicInput.value.trim();
    if (!topic) {
      this.authManager.showError('Please enter a topic');
      return;
    }

    const emptyState = document.getElementById('emptyState');
    const resultsSection = document.getElementById('resultsSection');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!emptyState || !resultsSection || !loadingIndicator || !resultsContainer) {
      console.error('Required DOM elements not found');
      return;
    }

    if (this.userPlan === 'free' && !this.hasActiveSubscription && this.todayMessages >= FREE_PLAN_LIMIT) {
      this.authManager.showError(`You've reached your daily limit of ${FREE_PLAN_LIMIT} messages. Upgrade to Pro for unlimited access.`);
      this.uiManager.showPricingModal();
      return;
    }

    if (!this.currentChatId) {
      this.createNewChat();
    }

    emptyState.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    loadingIndicator.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    this.authManager.clearError();

    try {
      const response = await this.generateWithAI(topic);
      this.saveCurrentChat(topic, response);
      
      if (this.user && !this.hasActiveSubscription) {
        this.todayMessages++;
        this.updateUsageUI();
        
        await supabase
          .from('messages')
          .insert([{
            user_id: this.user.id,
            content: topic,
            created_at: new Date().toISOString()
          }]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.authManager.showError(error.message || 'Failed to generate resource guide');
      }
    } finally {
      loadingIndicator.classList.add('hidden');
    }
  }

  async regenerateGuide(topic) {
    if (this.userPlan === 'free' && !this.hasActiveSubscription && this.todayMessages >= FREE_PLAN_LIMIT) {
      this.authManager.showError(`You've reached your daily limit of ${FREE_PLAN_LIMIT} messages. Upgrade to Pro for unlimited access.`);
      this.uiManager.showPricingModal();
      return;
    }

    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!loadingIndicator || !resultsContainer) return;
    
    loadingIndicator.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    this.authManager.clearError();

    try {
      const response = await this.generateWithAI(topic);
      this.saveCurrentChat(topic, response);
      
      if (this.user && !this.hasActiveSubscription) {
        this.todayMessages++;
        this.updateUsageUI();
        
        await supabase
          .from('messages')
          .insert([{
            user_id: this.user.id,
            content: topic,
            created_at: new Date().toISOString()
          }]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.authManager.showError(error.message || 'Failed to generate resource guide');
      }
    } finally {
      loadingIndicator.classList.add('hidden');
    }
  }

  async generateWithAI(topic) {
    this.abortController = new AbortController();
    
    const prompt = `Generate a STEP-BY-STEP ACTION GUIDE for establishing a "${topic}" business/company".  
    - Create 5-7 custom steps SPECIFIC to this exact topic.  
    - Each step must be a practical, actionable task.  
    - Include 3-5 hyperlinked resources per step (tools, websites, platforms).  

    FORMAT RULES:  
    1. Steps MUST be in [brackets] like this:  
       [Step 1: Custom Step Name]  
       - Resource Name - https://example.com  
       - Resource Name - https://example.com  

    2. NEVER reuse steps from other topics (e.g., no "Legal" for NBA players).  
    3. Resources must be DIRECTLY actionable for the step.  

    EXAMPLE FOR "HOW TO BECOME A FILMMAKER":  
    [Step 1: Learn Cinematography Basics]  
    - StudioBinder (Shot Lists) - https://www.studiobinder.com/  
    - ShotDeck (Visual References) - https://shotdeck.com/  
    - Filmmaker IQ (Courses) - https://filmmakeriq.com/  

    [Step 2: Acquire Basic Equipment]  
    - B&H Photo (Camera Gear) - https://www.bhphotovideo.com/  
    - DaVinci Resolve (Free Editing) - https://www.blackmagicdesign.com/  
    - Epidemic Sound (Royalty-Free Music) - https://www.epidemicsound.com/  

    NOW GENERATE FOR: "${topic}"`;

    const resultCard = this.createStreamingResultCard(topic);
    if (!resultCard) throw new Error('Failed to create result card');
    
    let fullResponse = '';
    
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'Sourcere'
        },
        body: JSON.stringify({
          model: this.currentModel,
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert research assistant that generates dynamic step-by-step guides. Create ONLY the requested format with bracketed steps and hyperlinked resources. NEVER add explanations, notes, or deviate from the format.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 1500,
          stream: true
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) throw new Error('Failed to connect to AI service');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data:') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.substring(5));
              if (data.choices?.[0]?.delta?.content) {
                fullResponse += data.choices[0].delta.content;
                this.updateStreamingContent(fullResponse, resultCard);
              }
            } catch (e) {
              console.log('Non-fatal stream parse error:', e);
            }
          }
        }
      }
      
      // Final cleanup of response
      fullResponse = fullResponse.replace(/\n{3,}/g, '\n\n').trim();
      this.finalizeStreamingCard(fullResponse, resultCard, topic);
      return fullResponse;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        const contentDiv = resultCard.querySelector('.message-content');
        if (contentDiv) {
          contentDiv.innerHTML += '<p class="text-yellow-400 mt-2">Generation stopped</p>';
        }
        return;
      }
      throw new Error(`AI generation failed: ${error.message}`);
    } finally {
      this.abortController = null;
    }
  }

  createStreamingResultCard(topic) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) {
      console.error('Results container not found');
      return null;
    }
    
    const resultCard = document.createElement('div');
    resultCard.className = 'guide-card bg-[#222222] rounded-xl overflow-hidden border border-[#444]';
    resultCard.dataset.topic = topic;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message p-5';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content prose prose-invert max-w-none';
    contentDiv.innerHTML = '<span id="streamingCursor" class="animate-pulse">|</span>';
    
    messageDiv.appendChild(contentDiv);
    resultCard.appendChild(messageDiv);
    resultsContainer.appendChild(resultCard);
    
    const stopDiv = document.createElement('div');
    stopDiv.className = 'flex justify-center p-3 bg-[#222222] border-t border-[#444]';
    
    const stopBtn = document.createElement('button');
    stopBtn.id = 'stopGenerationBtn';
    stopBtn.className = 'flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm';
    stopBtn.innerHTML = '<i class="fas fa-stop"></i> <span>Stop Generating</span>';
    stopDiv.appendChild(stopBtn);
    
    resultCard.appendChild(stopDiv);
    
    setTimeout(() => {
      const mainElement = document.querySelector('main');
      if (mainElement) mainElement.scrollTop = mainElement.scrollHeight;
    }, 100);
    
    return resultCard;
  }

  updateStreamingContent(content, resultCard) {
    if (!resultCard) return;
    
    const contentDiv = resultCard.querySelector('.message-content');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = this.formatContentForStreaming(content) + 
                        '<span id="streamingCursor" class="animate-pulse">|</span>';
    contentDiv.scrollTop = contentDiv.scrollHeight;
  }

  formatContentForStreaming(content) {
    let formattedContent = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>');
    
    formattedContent = formattedContent
      .replace(/\n/g, '<br>')
      .replace(/<br>\s*<br>/g, '<br><br>');
    
    return formattedContent;
  }

  finalizeStreamingCard(content, resultCard, topic) {
    if (!resultCard) return;
    
    const contentDiv = resultCard.querySelector('.message-content');
    if (!contentDiv) return;
    
    contentDiv.querySelector('#streamingCursor')?.remove();
    resultCard.querySelector('#stopGenerationBtn')?.remove();
    
    let formattedContent = content
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>')
      .replace(/\n/g, '<br>')
      .replace(/<br>\s*<br>/g, '<br><br>');
    
    contentDiv.innerHTML = formattedContent;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'chat-actions';
    
    if (this.user) {
      const saveBtn = document.createElement('button');
      saveBtn.className = 'action-btn save-guide-btn';
      saveBtn.title = 'Save';
      saveBtn.innerHTML = '<i class="far fa-save"></i>';
      actionsDiv.appendChild(saveBtn);
    }
    
    const regenBtn = document.createElement('button');
    regenBtn.className = 'action-btn regen-btn';
    regenBtn.title = 'Regenerate';
    regenBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    actionsDiv.appendChild(regenBtn);
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn copy-btn';
    copyBtn.title = 'Copy';
    copyBtn.innerHTML = '<i class="far fa-copy"></i>';
    actionsDiv.appendChild(copyBtn);
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'action-btn download-btn';
    downloadBtn.title = 'Download PDF';
    downloadBtn.innerHTML = '<i class="far fa-file-pdf"></i>';
    actionsDiv.appendChild(downloadBtn);
    
    resultCard.appendChild(actionsDiv);
    
    setTimeout(() => {
      const mainElement = document.querySelector('main');
      if (mainElement) mainElement.scrollTop = mainElement.scrollHeight;
    }, 100);
  }

  displayMessage(role, content) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'bg-[#222222]' : 'bg-[#222222]'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content prose prose-invert max-w-none';
    
    let formattedContent = content
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>')
      .replace(/\n/g, '<br>')
      .replace(/<br>\s*<br>/g, '<br><br>');
    
    contentDiv.innerHTML = formattedContent;
    messageDiv.appendChild(contentDiv);
    resultsContainer.appendChild(messageDiv);
    
    if (role === 'assistant') {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'chat-actions';
      
      if (this.user) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'action-btn save-guide-btn';
        saveBtn.title = 'Save';
        saveBtn.innerHTML = '<i class="far fa-save"></i>';
        actionsDiv.appendChild(saveBtn);
      }
      
      const regenBtn = document.createElement('button');
      regenBtn.className = 'action-btn regen-btn';
      regenBtn.title = 'Regenerate';
      regenBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
      actionsDiv.appendChild(regenBtn);
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'action-btn copy-btn';
      copyBtn.title = 'Copy';
      copyBtn.innerHTML = '<i class="far fa-copy"></i>';
      actionsDiv.appendChild(copyBtn);
      
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'action-btn download-btn';
      downloadBtn.title = 'Download PDF';
      downloadBtn.innerHTML = '<i class="far fa-file-pdf"></i>';
      actionsDiv.appendChild(downloadBtn);
      
      messageDiv.appendChild(actionsDiv);
    }
  }

  clearResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsSection = document.getElementById('resultsSection');
    const emptyState = document.getElementById('emptyState');
    
    if (resultsContainer) resultsContainer.innerHTML = '';
    if (resultsSection) resultsSection.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
  }

  abortGeneration() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  async saveGuide(topic, content) {
    if (!this.user) {
      this.showNotification('Please sign in to save guides', 'error');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('saved_guides')
        .insert([{ 
          user_id: this.user.id, 
          topic, 
          content,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      this.showNotification('Guide saved successfully!');
    } catch (error) {
      console.error('Error saving guide:', error);
      this.showNotification('Failed to save guide', 'error');
    }
  }

  async downloadAsPDF(card) {
    if (!card) return;
    
    try {
      const printDiv = document.createElement('div');
      printDiv.className = 'p-6 bg-[#1A1A1A] text-white';
      
      const title = document.createElement('h1');
      title.className = 'text-2xl font-bold mb-4 gradient-text';
      title.textContent = card.dataset.topic || 'Resource Guide';
      printDiv.appendChild(title);
      
      const content = card.querySelector('.message-content')?.cloneNode(true);
      if (!content) {
        throw new Error('No content found to download');
      }
      
      const links = content.querySelectorAll('a');
      links.forEach(link => {
        link.style.color = '#0078FF';
        link.style.textDecoration = 'underline';
      });
      
      printDiv.appendChild(content);
      
      const footer = document.createElement('div');
      footer.className = 'mt-6 pt-4 border-t border-[#444] text-sm text-[#B0B0B0]';
      footer.innerHTML = '<p>Generated by Sourcere - AI-Powered Resource Guides</p>';
      printDiv.appendChild(footer);
      
      const opt = {
        margin: 10,
        filename: `${card.dataset.topic || 'resource-guide'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#1A1A1A' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      const loading = this.showNotification('Generating PDF...');
      
      await html2pdf().set(opt).from(printDiv).save();
      
      loading.remove();
      this.showNotification('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.showNotification('Failed to generate PDF', 'error');
    }
  }

  async copyToClipboard(card) {
    if (!card) return;
    
    try {
      const content = card.querySelector('.message-content')?.textContent;
      if (!content) {
        throw new Error('No content found to copy');
      }
      
      await navigator.clipboard.writeText(content);
      
      this.showNotification('Copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showNotification('Failed to copy', 'error');
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 ${type === 'success' ? 'bg-primary-400' : 'bg-red-300'} text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 z-50 animate-fade-in`;
    
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check' : 'fas fa-exclamation-circle';
    notification.appendChild(icon);
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    notification.appendChild(messageSpan);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('animate-fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    return notification;
  }

  async loadUsage() {
    // Initialize default values
    this.hasActiveSubscription = false;
    this.userPlan = 'free';
    this.todayMessages = 0;

    if (!this.user) {
      console.log('No user logged in - defaulting to free');
      this.updateUsageUI();
      return;
    }

    try {
      console.group(`User Status Check: ${this.user.email}`);
      console.log('Authenticated User ID:', this.user.id);

      // 1. Check for valid subscriptions (both active and pending)
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('id, status, created_at')
        .eq('user_id', this.user.id)
        .in('status', ['active', 'pending']);

      if (subError) {
        console.error('Subscription query error:', subError);
        throw subError;
      }

      console.log('Found subscriptions:', {
        count: subscriptions ? subscriptions.length : 0,
        statuses: subscriptions ? subscriptions.map(s => s.status) : []
      });

      // 2. Determine account status
      const hasValidSubscription = subscriptions && subscriptions.length > 0;
      this.hasActiveSubscription = hasValidSubscription;
      this.userPlan = hasValidSubscription ? 'pro' : 'free';

      if (hasValidSubscription) {
        console.log('PRO User detected with status:', subscriptions[0].status);
        this.todayMessages = 0; // Unlimited for PRO users
      } else {
        // 3. Count messages only for free users
        const today = new Date().toISOString().split('T')[0];
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', this.user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);

        if (countError) {
          console.error('Message count error:', countError);
          throw countError;
        }

        this.todayMessages = count || 0;
        console.log(`Free user message count: ${this.todayMessages}/${FREE_PLAN_LIMIT}`);
      }

    } catch (error) {
      console.error('Usage check failed:', {
        error: error.message,
        userId: this.user ? this.user.id : 'none',
        time: new Date().toISOString()
      });

      // Fallback to free plan on error
      this.hasActiveSubscription = false;
      this.userPlan = 'free';
      this.todayMessages = 0;
    } finally {
      this.updateUsageUI();
      console.log('Final determination:', {
        isPro: this.hasActiveSubscription,
        plan: this.userPlan,
        messagesUsed: this.todayMessages
      });
    }
  }

  updateUsageUI() {
    const usageCount = document.getElementById('usageCount');
    const usageBar = document.getElementById('usageBar');
    
    if (!usageCount || !usageBar) return;
    
    if (this.userPlan === 'free' && !this.hasActiveSubscription) {
      const percentage = Math.min((this.todayMessages / FREE_PLAN_LIMIT) * 100, 100);
      usageCount.textContent = `${this.todayMessages}/${FREE_PLAN_LIMIT}`;
      usageBar.style.width = `${percentage}%`;
      
      // Update bar color based on usage
      if (percentage > 80) {
        usageBar.classList.remove('bg-primary-500');
        usageBar.classList.add('bg-red-500');
      } else {
        usageBar.classList.add('bg-primary-500');
        usageBar.classList.remove('bg-red-500');
      }
    } else {
      usageCount.textContent = 'Unlimited';
      usageBar.style.width = '100%';
      usageBar.classList.add('bg-primary-400');
      usageBar.classList.remove('bg-primary-500', 'bg-red-500');
    }
  }

  handleUpgradeButton() {
    if (!this.user) {
      this.authManager.toggleAccountPopup();
    } else {
      this.uiManager.showPricingModal();
    }
  }

  saveKnowledge() {
    const knowledgeText = document.getElementById('knowledgeText');
    if (!knowledgeText) return;
    
    this.knowledge = knowledgeText.value.trim();
    this.uiManager.hideKnowledgeModal();
    this.showNotification('Knowledge saved');
  }

  loadChats() {
    const chats = this.getChats();
    const chatList = document.getElementById('chatList');
    if (!chatList) return;

    chatList.innerHTML = '';

    if (chats.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'p-4 text-center text-[#a0a0a0] text-sm';
      emptyState.textContent = 'No guides yet. Start a new conversation!';
      chatList.appendChild(emptyState);
      return;
    }

    chats.forEach((chat, index) => {
      const isLastFour = index >= chats.length - 4;
      
      const chatItem = document.createElement('div');
      chatItem.className = `chat-item flex items-center justify-between p-2 mx-1 rounded-lg cursor-pointer transition-colors ${chat.id === this.currentChatId ? 'active bg-[#2A2A2A]' : 'hover:bg-[#252525]'}`;
      chatItem.dataset.chatId = chat.id;
      
      const chatContent = document.createElement('div');
      chatContent.className = 'flex items-center space-x-2 overflow-hidden flex-1 min-w-0';
      
      const chatIcon = document.createElement('div');
      chatIcon.className = 'text-[#a0a0a0] text-xs';
      chatIcon.innerHTML = '<i class="far fa-comment"></i>';
      
      const chatTitle = document.createElement('span');
      chatTitle.className = 'chat-title truncate text-xs flex-1';
      chatTitle.textContent = chat.title || 'New Guide';
      
      chatContent.appendChild(chatIcon);
      chatContent.appendChild(chatTitle);
      
      const chatActions = document.createElement('div');
      chatActions.className = 'relative flex items-center';
      
      const menuButton = document.createElement('button');
      menuButton.className = 'chat-menu-btn text-[#a0a0a0] hover:text-white p-1 rounded-full hover:bg-[#333] transition-colors';
      menuButton.innerHTML = '<i class="fas fa-ellipsis-v text-xs"></i>';
      
      const actionsMenu = document.createElement('div');
      actionsMenu.className = 'chat-actions-menu hidden absolute right-0 bg-[#2A2A2A] rounded-lg shadow-lg z-10 border border-[#333] min-w-[120px]';
      
      // Apply different positioning based on whether it's last four
      if (isLastFour) {
        actionsMenu.classList.add('top-[-40px]', 'mb-1');
        // Ensure the menu stays above when opened
        actionsMenu.style.transform = 'translateY(-100%)';
      } else {
        actionsMenu.classList.add('top-6');
      }
      
      const renameBtn = document.createElement('button');
      renameBtn.className = 'rename-chat-btn flex items-center w-full p-2 text-xs hover:bg-[#333] rounded-t-lg';
      renameBtn.innerHTML = '<i class="fas fa-pencil-alt mr-2 text-xs"></i> Rename';
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-chat-btn flex items-center w-full p-2 text-xs hover:bg-[#333] text-red-400 rounded-b-lg';
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt mr-2 text-xs"></i> Delete';
      
      actionsMenu.appendChild(renameBtn);
      actionsMenu.appendChild(deleteBtn);
      
      chatActions.appendChild(menuButton);
      chatActions.appendChild(actionsMenu);
      
      chatItem.appendChild(chatContent);
      chatItem.appendChild(chatActions);
      
      // Click handler remains the same
      chatItem.addEventListener('click', (e) => {
        if (!e.target.closest('.chat-menu-btn') && !e.target.closest('.chat-actions-menu')) {
          this.loadChat(chat.id);
        }
      });
      
      menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close all other menus first
        document.querySelectorAll('.chat-actions-menu').forEach(menu => {
          menu.classList.remove('active');
        });
        // Open this menu
        actionsMenu.classList.add('active');
        
        // For last four items, ensure proper positioning
        if (isLastFour) {
          const rect = chatActions.getBoundingClientRect();
          const spaceAbove = rect.top;
          const menuHeight = actionsMenu.offsetHeight;
          
          if (spaceAbove < menuHeight) {
            // If not enough space above, adjust to show below
            actionsMenu.classList.remove('bottom-full', 'mb-1');
            actionsMenu.classList.add('top-6');
          } else {
            // Otherwise show above
            actionsMenu.classList.add('bottom-full', 'mb-1');
            actionsMenu.classList.remove('top-6');
          }
        }
      });
      
      // Rest of your event listeners...
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.chat-actions-menu') && !e.target.closest('.chat-menu-btn')) {
          actionsMenu.classList.remove('active');
        }
      });
      
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newTitle = prompt('Enter new guide title:', chat.title || 'New Guide');
        if (newTitle && newTitle.trim() !== '') {
          this.renameChat(chat.id, newTitle.trim());
        }
        actionsMenu.classList.remove('active');
      });
      
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this guide?')) {
          this.deleteChat(chat.id);
        }
        actionsMenu.classList.remove('active');
      });
      
      chatList.appendChild(chatItem);
    });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SourcereApp();
});