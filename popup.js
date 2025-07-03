let scrapeEmails = document.getElementById('scrapeEmails');
let allEmails = []; 

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.emails) {
        allEmails = request.emails; 
        const searchInput = document.getElementById('searchInput');
        
        searchInput.value = '';
        
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
    
    let pageText = document.body.innerText || document.body.textContent || '';
    
    pageText = pageText.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
    
    let emails = pageText.match(emailRegEx);
    
    let uniqueEmails = [];
    
    if (emails && emails.length > 0) {
        uniqueEmails = [...new Set(emails)].map(email => email.trim());
    }
    
    chrome.runtime.sendMessage({emails: uniqueEmails});
}

document.addEventListener('DOMContentLoaded', setupSearch);