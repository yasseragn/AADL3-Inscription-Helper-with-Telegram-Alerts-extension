chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case "checkContent":
            let content = $("body").html();
            sendResponse(content.length > 0);
            break;
        case "clickAgreeButton":
            clickAgreeButton();
            sendResponse({ status: "clicked" });
            break;
        case "checkCongratulations":
            checkCongratulations().then(result => sendResponse(result));
            return true; // Required to indicate async response
    }
    return true;
});

inscription = new InscriptionPage();
inscription.init();

function clickAgreeButton() {
    let button = document.querySelector("span.padding.A91") || document.querySelector("button#A138");
    if (button) {
        button.click();
        console.log("Agree button clicked");
    } else {
        console.log("Agree button not found");
    }
}

async function checkCongratulations() {
    let result = { found: false, screenshotUrl: null };
    let bodyText = document.body.innerText;

    if (bodyText.includes("تهانينا لكم")) {
        result.found = true;
        result.screenshotUrl = await takeScreenshot();
    }

    return result;
}

function takeScreenshot() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "takeScreenshot" }, response => {
            if (response && response.screenshotUrl) {
                resolve(response.screenshotUrl);
            } else {
                reject("Failed to take screenshot");
            }
        });
    });
}
