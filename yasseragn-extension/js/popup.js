document.getElementById("startButton").addEventListener("click", async () => {
  sendToBackground("refresh");
  await set("active", true);
  refreshButtons();
});

document.getElementById("stopButton").addEventListener("click", async () => {
  sendToBackground("stopRefresh");
  await set("active", false);
  refreshButtons();
});

async function refreshButtons() {
  let isActive = await get("active");
  if (isActive === true) {
    $("#startButton").addClass("hide");
    $("#stopButton").removeClass("hide");
  } else {
    $("#startButton").removeClass("hide");
    $("#stopButton").addClass("hide");
  }
}
async function loadForm(){
  let form = await get("form")
  for(let input of form){
    let label = input.label
    let val = input.value
    $(".form-input[name='"+label+"']").val(val)
  }
  let automaticMode = await get("automaticMode")
  console.log(automaticMode);
  if(automaticMode !== true && automaticMode !== false) {
    await set("automaticMode", true)
    automaticMode = true;
  }
  $(".automatic-application[value='"+automaticMode+"']").prop("checked", true)
}
$(".form-input").on("keyup change", async function(){
  console.log("changed");
  let form = [];
  $(".form-input").each(function(){
    let name = $(this).attr("name")
    let val = $(this).val()
    form.push({
      label: name,
      value: val
    });
  })
  console.log(form);
  await set("form", form)
  loadForm()
})
$(".automatic-application").change(function(){
  let automaticMode = $(".automatic-application:checked").val() == "true";
  console.log(automaticMode);
  set("automaticMode", automaticMode)
})
async function start() {
  loadForm()
  refreshButtons();
}
start();
document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save');
    const deleteButton = document.getElementById('delete');
    const botTokenInput = document.getElementById('botToken');
    const chatIdInput = document.getElementById('chatId');
    const enableTelegramCheckbox = document.getElementById('enableTelegram');
    const notification = document.getElementById('notification');

    // Load stored settings
    chrome.storage.sync.get(['botToken', 'chatId', 'enableTelegram', 'notificationClosed'], function(data) {
        if (data.botToken) {
            botTokenInput.value = data.botToken;
        }
        if (data.chatId) {
            chatIdInput.value = data.chatId;
        }
        enableTelegramCheckbox.checked = data.enableTelegram || false;
        if (!data.notificationClosed) {
            notification.style.display = 'block';
        }
    });

    // Save settings
    saveButton.addEventListener('click', function() {
        const botToken = botTokenInput.value;
        const chatId = chatIdInput.value;
        const enableTelegram = enableTelegramCheckbox.checked;

        chrome.storage.sync.set({ botToken, chatId, enableTelegram }, function() {
            console.log('Settings saved');
        });
    });

    // Delete settings
    deleteButton.addEventListener('click', function() {
        chrome.storage.sync.remove(['botToken', 'chatId', 'enableTelegram'], function() {
            botTokenInput.value = '';
            chatIdInput.value = '';
            enableTelegramCheckbox.checked = false;
            console.log('Settings deleted');
        });
    });
});
