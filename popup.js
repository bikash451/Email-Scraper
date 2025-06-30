let scrapeEmails = document.getElementById('scrapeEmails');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.emails) {
        let emails = request.emails;
        const emailList = document.getElementById('emailList');
        
        emailList.innerHTML = '';
        
        if (emails.length > 0) {
            emails.forEach(email => {
                const listItem = document.createElement('li');
                listItem.textContent = email;
                listItem.className = 'email-item'; 
                emailList.appendChild(listItem);
            });
        } else {
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