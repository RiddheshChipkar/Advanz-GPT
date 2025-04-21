$(document).ready(function () {
    // DOM elements
    const textarea = $('#chatInput');
    const sendButton = $('#sendButton');
    const clearButton = $('#clearChatButton');      // Clear chat history
    const chatMessages = $('#chatMessages');

    // State variables
    const systemMessage = {
        role: "system",
        content: "You are a helpful AI assistant. Provide clear, concise answers and format technical responses with proper markdown formatting for code snippets, lists, and paragraphs."
    };
    // Initial AI greeting HTML (to display and preserve on clear)
    const initialAiHtml = `
         <div class="message message-ai">
             <div class="avatar avatar-ai">
                  <span class="iconify" data-icon="hugeicons:chat-gpt" data-inline="false"></span>
             </div>
             <div class="message-content">
                 <div class="message-bubble ai-bubble">
                     <p>Hello! I'm your AI assistant. How can I help you today?</p>
                     <p>Here are some things you can ask me:</p>
                     <ul>
                         <li>Explain technical concepts</li>
                         <li>Help with coding problems</li>
                         <li>Generate creative ideas</li>
                         <li>Answer general knowledge questions</li>
                     </ul>
                 </div>
                 <div class="message-info">
                     <span>AI Assistant</span>
                     <span>·</span>
                     <span>Just now</span>
                 </div>
             </div>
         </div>
         
                    <!-- Quick suggestions -->
                    <div class="suggestions">
                         <div class="suggestion-chip">Summarize the latest trends in Pharma</div>
                        <div class="suggestion-chip">Explain the benefits of Mindfulness</div>
                        <div class="suggestion-chip">Recent Pharma News</div>
                    </div>
     `;
    let conversationHistory = [systemMessage];

    // Show initial greeting
    chatMessages.html(initialAiHtml);

    // Auto-resize textarea
    textarea.on('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Send message on Enter (but allow Shift+Enter for new lines)
    textarea.on('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Send message on button click
    sendButton.on('click', sendMessage);

    // Clear chat history on clear button click
    clearButton.on('click', function () {
        // Reset conversation history to only the system message
        conversationHistory = [systemMessage];
        // Replace chat container with initial AI greeting
        chatMessages.html(initialAiHtml);

        $('.suggestion-chip').on('click', function () {
            const suggestion = $(this).text();
            textarea.val(suggestion);
            textarea.trigger('input');
            textarea.focus();
        });

    });

    // Click handler for suggestion chips
    $('.suggestion-chip').on('click', function () {
        const suggestion = $(this).text();
        textarea.val(suggestion);
        textarea.trigger('input');
        textarea.focus();
    });

    // Function to send a message
    async function sendMessage() {
        const message = textarea.val().trim();
        if (message === '') return;

        // Add user message to chat
        addMessageToChat('user', message);
        conversationHistory.push({ role: "user", content: message });

        // Clear input
        textarea.val('');
        textarea.css('height', '44px');

        // Disable send button while waiting for response
        sendButton.prop('disabled', true);

        // Show typing indicator
        showTypingIndicator();

        try {
            // Get AI response
            const aiResponse = await getAIResponse(conversationHistory);

            // Add AI response to chat
            addMessageToChat('ai', aiResponse);
            conversationHistory.push({ role: "assistant", content: aiResponse });
        } catch (error) {
            console.error("Error getting AI response:", error);
            addMessageToChat('ai', "Sorry, I encountered an error. Please try again later. Error: " + error.message);
        } finally {
            // Remove typing indicator and re-enable send button
            removeTypingIndicator();
            sendButton.prop('disabled', false);
        }
    }


    // Function to get AI response from Azure OpenAI
    async function getAIResponse(messages) {
        const completeEndpointUrl = "https://jss-azure-open-ai.openai.azure.com/openai/deployments/jss-gpt-4o/chat/completions?api-version=2025-01-01-preview";

        // Replace with your actual API key
        const apiKey = "4eafeaa3a6fc42268aac27bb229b8091";

        const response = await fetch(completeEndpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({
                messages: messages,
                max_tokens: 4096,
                temperature: 0,
                top_p: 0.95
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // Function to add a message to the chat
    function addMessageToChat(sender, content) {
        const messageClass = sender === 'ai' ? 'message-ai' : 'message-user';
        const avatarClass = sender === 'ai' ? 'avatar-ai' : 'avatar-user';
        const bubbleClass = sender === 'ai' ? 'ai-bubble' : 'user-bubble';
        const senderName = sender === 'ai' ? 'AI Assistant' : 'You';
        const avatarIcon = sender === 'ai' ? 'hugeicons:chat-gpt' : 'line-md:account';

        const messageHtml = `
            <div class="message ${messageClass}">
                <div class="avatar ${avatarClass}">
                    <span class="iconify" data-icon="${avatarIcon}" data-inline="false"></span>
                </div>
                <div class="message-content">
                    <div class="message-bubble ${bubbleClass}">${formatResponse(content)}</div>
                    <div class="message-info">
                        <span>${senderName}</span>
                        <span>·</span>
                        <span>Just now</span>
                    </div>
                </div>
            </div>
        `;

        chatMessages.append(messageHtml);
        scrollToBottom();
    }

    // Function to show typing indicator
    function showTypingIndicator() {
        const typingHtml = `
            <div class="message message-ai" id="typingIndicator">
                <div class="avatar avatar-ai">
                    <span class="iconify" data-icon="hugeicons:chat-gpt" data-inline="false"></span>
                </div>
                <div class="message-content">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;

        chatMessages.append(typingHtml);
        scrollToBottom();
    }

    // Function to remove typing indicator
    function removeTypingIndicator() {
        $('#typingIndicator').remove();
    }

    // Function to scroll to bottom of chat
    function scrollToBottom() {
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }

    // Function to format AI response (markdown to HTML)
    // Function to format AI response (markdown to HTML)
    // Function to format AI response (markdown to HTML)
    function formatResponse(text) {
        // First, handle code blocks to prevent processing markdown inside them
        const codeBlocks = [];
        text = text.replace(/```[\s\S]*?```/g, function (match) {
            codeBlocks.push(match);
            return `CODEBLOCK_${codeBlocks.length - 1}_`;
        });

        // Convert markdown to HTML
        text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');

        // Handle unordered lists
        text = text.replace(/^\s*[-*]\s(.*$)/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)+/g, function (match) {
            return `<ul>${match}</ul>`;
        });

        // Handle ordered lists - NEW IMPROVED VERSION
        text = text.replace(/^(\s*\d+\.\s)(.*)$/gm, function (match, prefix, content) {
            // Preserve the original number from the markdown
            const number = prefix.trim().replace('.', '');
            return `<li value="${number}">${content}</li>`;
        });

        // Wrap consecutive list items in ol/ul tags
        text = text.replace(/(<li[^>]*>.*<\/li>\s*)+/g, function (match) {
            if (match.includes('value="')) {
                return `<ol>${match}</ol>`;
            } else {
                return `<ul>${match}</ul>`;
            }
        });

        // Handle paragraphs
        text = text.split('\n\n').map(paragraph => {
            if (!paragraph.match(/^<(ul|ol|li|h\d|pre|code)/)) {
                return `<p>${paragraph}</p>`;
            }
            return paragraph;
        }).join('');

        // Restore code blocks
        text = text.replace(/CODEBLOCK_(\d+)_/g, function (match, index) {
            const codeBlock = codeBlocks[parseInt(index)];
            // Format code blocks properly
            const langMatch = codeBlock.match(/```(\w*)/);
            const lang = langMatch ? langMatch[1] : '';
            const code = codeBlock.replace(/```[\w]*\n/, '').replace(/\n```$/, '');
            return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
        });

        return text;
    }

    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Toggle sidebar minimization
    $('#minimize').on('change', function () {
        $('.sidebar').toggleClass('minimized', this.checked);
    });
});
