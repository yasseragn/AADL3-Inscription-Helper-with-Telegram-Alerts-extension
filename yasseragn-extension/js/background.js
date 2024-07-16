async function get(name) {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.get({ [name]: [] }, function (result) {
      resolve(result[name]);
    });
  });
}

async function set(name, value) {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.set({ [name]: value }, function () {
      console.log(`Setting ${name}: `, value); // إضافة طباعة للمخرجات
      resolve();
    });
  });
}
async function sendToTab(action, tabId, data) {
  let response = await new Promise(function (resolve, reject) {
    data.action = action;
    chrome.tabs.sendMessage(tabId, data, function (result) {
      resolve(result);
    });
  });
  return response;
}

async function createOffscreen() {
  if (await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.closeDocument();
  }
  const html = chrome.runtime.getURL("html/offscreen.html");
  await chrome.offscreen.createDocument({
    url: html,
    reasons: ["AUDIO_PLAYBACK"],
    justification: "testing", // details for using the API
  });
}

async function sendToActiveTab(action, data = {}) {
  return new Promise(async function (resolve, reject) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      data.action = action;
      chrome.tabs.sendMessage(activeTab.id, data, function () {
        resolve();
      });
    });
  });
}

async function getActiveTab() {
  return new Promise(async function (resolve, reject) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      resolve(activeTab);
    });
  });
}

function refreshTab(tabId) {
  chrome.tabs.reload(tabId);
}

function refreshActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
}

function createTab() {
  params = { url: "https://aadl3inscription2024.dz/", active: true };
  chrome.tabs.create(params, async function (tab) {
    await set("workingTab", tab.id);
  });
  startCounter();
}

async function stopRefresh() {
  clearInterval(countProc);
  chrome.action.setBadgeText({ text: "" });
  await set("workingTab", -1);
  await set("active", false)
}

function startCounter() {
  let self = this;
  counter = 1;
  countProc = setInterval(async() => {
    let isActive = await get("active");
    if(isActive === false){
      self.stopRefresh();
    }
    chrome.action.setBadgeText({ text: "" + counter });
    counter++;
  }, 1000);
}

var counter = 1;
var countProc;

async function checkContent(tabId) {
  let response = await sendToTab("checkContent", tabId, {});
  return response;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  var _action = request.action;
  switch (_action) {
    case "refresh":
      createTab();
      break;

    case "stopRefresh":
      stopRefresh();
      break;

    case "getTabId":
      sendResponse({ tab: sender.tab.id });
      break;
  }
  return true;
});

// Function to send Telegram message
async function sendTelegramMessage(botToken, chatId, message) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const data = {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            console.log('Message sent successfully:', result);
        } else {
            console.error('Failed to send message:', result);
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Function to check some condition and send a message
async function checkConditionAndNotify() {
    chrome.storage.sync.get(['botToken', 'chatId', 'enableTelegram'], async function(data) {
        if (data.enableTelegram && data.botToken && data.chatId) {
            let message = "*🚨AADL3 ALERT🚨* \n🔔INSCRIPTION AVAILABLE!🔔\nصفحة التسجيل جاهزة:\n";

            let form = await get("form");
            for (let input of form) {
                switch (input.label) {
                    case "A17":
                        let wilayaNumber = parseInt(input.value) - 1;
                        message += `ولاية الاقامة: ${wilayaNumber}\n`;
                        break;
                    case "A22":
                        message += `رقم التعريف الوطني: ${input.value}\n`;
                        break;
                    case "A27":
                        message += `رقم الضمان الاجتماعي: ${input.value}\n`;
                        break;
                    case "A13":
                        message += `رقم الهاتف: ${input.value}\n`;
                        break;
                }
            }

            message += "BY @yasseragnoff \n[انظم الى موقعنا الرسمي](https://www.yasseragn.com)";
            sendTelegramMessage(data.botToken, data.chatId, message);
        } else {
            console.log('Telegram notifications are disabled or missing data.');
        }
    });
}

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    let workingTab = await get("workingTab");
    if (tabId == workingTab && changeInfo.status == "complete") {
        clearInterval(countProc);
        let hasLoaded = await checkContent(tabId);
        if (!hasLoaded) {
            setTimeout(async function () {
                refreshTab(tabId);
                startCounter();
            }, 1000);
        } else {
            set("workingTab", -1);
            createOffscreen();
            chrome.notifications.create({
                type: "basic",
                title: "YASSERAGN AADL3 Auto Refresh & Telegram ALERT",
                message: "صفحة التسجيل جاهزة للإستعمال, وافق على الشروط ",
                iconUrl: "../img/favicon.png",
            });
            await set("active", false);
            chrome.action.setBadgeText({ text: "" });
            chrome.tabs.update(workingTab, { active: true }, async function (tab) {
                // Send the message only when the page is ready
                await checkConditionAndNotify();
            });
        }
    }
});
