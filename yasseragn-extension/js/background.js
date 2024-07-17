async function get(name) {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.get({ [name]: [] }, function (result) {
      resolve(result[name]);
    });
  });
}

async function set(name, value) {
  new Promise(function (resolve, reject) {
    chrome.storage.local.set({ [name]: value }, function () {
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
  new Promise(async function (resolve, reject) {
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
  return await new Promise(async function (resolve, reject) {
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
  // params = { url: "http://aadl3inscription2024.dz/", active: true };
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
    let isActive = await get("active")
    if(isActive === false){
      self.stopRefresh()
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

async function sendTelegramMessage(botToken, chatId, message, photoUrl = null) {
    if (photoUrl) {
        const photoUrlTelegram = `https://api.telegram.org/bot${botToken}/sendPhoto`;
        const photoData = {
            chat_id: chatId,
            photo: photoUrl,
            caption: message,
            parse_mode: 'Markdown'
        };
        try {
            const response = await fetch(photoUrlTelegram, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(photoData)
            });

            const result = await response.json();
            if (response.ok) {
                console.log('Photo sent successfully:', result);
            } else {
                console.error('Failed to send photo:', result);
            }
        } catch (error) {
            console.error('Error sending photo:', error);
        }
    } else {
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
}

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    let workingTab = await get("workingTab");
    if (tabId == workingTab && changeInfo.status == "complete") {
        clearInterval(countProc);
        let hasLoaded = await checkContent(tabId);
        if (!hasLoaded) {
            chrome.action.setBadgeText({ text: "إعادة" });
            setTimeout(async function () {
                refreshTab(tabId);
                startCounter();
            }, 1000);
        } else {
            set("workingTab", -1);
            createOffscreen();
            chrome.notifications.create({
                type: "basic",
                title: "AADL3 Auto Refresh",
                message: "صفحة التسجيل جاهزة للإستعمال",
                iconUrl: "../img/favicon.png",
            });
            await set("active", false);
            chrome.action.setBadgeText({ text: "" });
            chrome.tabs.update(workingTab, { active: true }, async function (tab) {
                // إرسال الرسالة الأولى
                await checkConditionAndNotify();

                // إرسال رسالة لملف content.js للضغط على زر "موافق"
                await sendToTab("clickAgreeButton", tab.id, {});

                // تحقق من وجود كلمة "تهانينا لكم" وأخذ لقطة شاشة إذا وجدت
                let result = await sendToTab("checkCongratulations", tab.id, {});
                if (result.found) {
                    let screenshotUrl = result.screenshotUrl;
                    let message = "*🚨AADL3 ALERT🚨* \n🔔تم تسجيلكم بنجاح🔔\nتهانينا لكم\nBY @yasseragnoff \n[انظم الى موقعنا الرسمي](https://www.yasseragn.com)";
                    sendTelegramMessage(data.botToken, data.chatId, message, screenshotUrl);
                }
            });
        }
    }
});

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.action === "takeScreenshot") {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
            sendResponse({ screenshotUrl: dataUrl });
        });
        return true; // Required to indicate async response
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var _action = request.action;
    switch (_action) {
        case "refresh":
            createTab();
            break;

        case "stopRefresh":
            stopRefresh();
            break;

        case "clearCookies":
            stopRefresh();
            break;

        case "getTabId":
            sendResponse({ tab: sender.tab.id });
            break;
    }
    // return true  must be specified when returning an async response
    return true;
});

// Function to send the first message when the page is ready
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
