
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case "checkContent":
          let content = $("body").html()
        sendResponse(content.length > 0)
        break;
    }
    return true;
  });
  inscription = new InscriptionPage()
  inscription.init()
