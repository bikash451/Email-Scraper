let scrapeEmails = document.getElementById('scrapeEmails');
let allEmails = []; // Store all emails for filtering

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const emailList = document.getElementById('emailList');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterEmails(searchTerm);
    });
}

function filterEmails(searchTerm) {
    const emailList = document.getElementById('emailList');
    emailList.innerHTML = '';
    
    if (allEmails.length === 0) {
        return;
    }
    
    const filteredEmails = allEmails.filter(email => 
        email.toLowerCase().includes(searchTerm)
    );
    
    if (filteredEmails.length > 0) {
        filteredEmails.forEach(email => {
            const listItem = document.createElement('li');
            
            // Highlight matching text
            if (searchTerm) {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                const highlightedEmail = email.replace(regex, '<mark>$1</mark>');
                listItem.innerHTML = highlightedEmail;
            } else {
                listItem.textContent = email;
            }
            
            listItem.className = 'email-item';
            emailList.appendChild(listItem);
        });
    } else if (searchTerm) {
        const listItem = document.createElement('li');
        listItem.textContent = `No emails found matching "${searchTerm}"`;
        listItem.className = 'no-emails';
        emailList.appendChild(listItem);
    }
}

// Message listener to receive emails from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.emails) {
        allEmails = request.emails; // Store emails globally
        const searchInput = document.getElementById('searchInput');
        
        // Clear search input
        searchInput.value = '';
        
        // Display all emails initially
        filterEmails('');
        
        if (allEmails.length === 0) {
            const emailList = document.getElementById('emailList');
            const listItem = document.createElement('li');
            listItem.textContent = 'No emails found on this page.';
            listItem.className = 'no-emails';
            emailList.appendChild(listItem);
        }
    }
});

scrapeEmails.addEventListener("click", async() => {
    let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: scrapeEmailsFromPage,
    });
});

function scrapeEmailsFromPage() {
    const emailRegEx = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Get all text content from the page
    let pageText = document.body.innerText || document.body.textContent || '';
    
    // Clean the text: remove extra whitespace and non-printable characters
    pageText = pageText.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
    
    let emails = pageText.match(emailRegEx);
    
    let uniqueEmails = [];
    
    if (emails && emails.length > 0) {
        // Remove duplicates and clean each email
        uniqueEmails = [...new Set(emails)].map(email => email.trim());
    }
    
    // Send the actual emails array
    chrome.runtime.sendMessage({emails: uniqueEmails});
}

// Initialize search when popup loads
document.addEventListener('DOMContentLoaded', setupSearch);