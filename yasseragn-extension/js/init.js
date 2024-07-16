async function sendToBackground(action, data = {}) {
  return new Promise(function (resolve, reject) {
    var params = data;
    params.action = action;
    chrome.runtime.sendMessage(params, function (response) {
      resolve(response);
    });
  });
}

$.fn.domInsert = function (callback = 0) {
  var listen = (function () {
    var MutationObserver =
      window.MutationObserver || window.WebKitMutationObserver;
    return function (obj, callback) {
      if (!obj || !obj.nodeType === 1) return;
      if (MutationObserver) {
        var obs = new MutationObserver(function (mutations, observer) {
          callback(mutations);
        });
        obs.observe(obj, { childList: true, subtree: true });
      } else if (window.addEventListener) {
        obj.addEventListener("DOMNodeInserted", callback, false);
      }
    };
  })();
  listElm = $(this)[0];
  listen(listElm, function (m) {
    var addedNodes = [];
    m.forEach(
      (record) =>
        record.addedNodes.length & addedNodes.push(...record.addedNodes)
    );
    if (callback != 0) callback(addedNodes);
  });
};
function fireEvent(element, event) {
  if (document.createEventObject) {
    var evt = document.createEventObject();
    return element.fireEvent("on" + event, evt);
  } else {
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent(event, true, true);
    return !element.dispatchEvent(evt);
  }
}
async function set(name, value) {
  new Promise(function (resolve, reject) {
    chrome.storage.local.set({ [name]: value }, function (test) {
      console.log(test);
      resolve();
    });
  });
}
async function get(name) {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.get({ [name]: [] }, function (result) {
      resolve(result[name]);
    });
  });
}
function toggleExtension(newStatus) {
  set("status", newStatus);
  get("status", function (status) {
    console.log("now it's " + status);
  });
}

urlParam = function (name, url = "") {
  if (url == "") url = document.location.href;
  var results = new RegExp("[?&]" + name + "=([^&#]*)").exec(url);
  if (results == null) {
    return null;
  } else {
    return decodeURI(results[1]) || 0;
  }
};
var Appear_process = [];

$.fn.appear = function (callback, params = {}) {
  if (typeof params.continious === "undefined") params.continious = false;
  if (typeof params.mark === "undefined") params.mark = true;
  // APPEAR ONLY WORKS ON JQUERY 2
  var selector = this.selector;
  var process_id = Math.floor(Math.random() * 100000) + 1;
  Appear_process[process_id] = setInterval(function () {
    let $elements;
    if (params.mark) {
      $elements = $(selector).filter(":not(.has_appeared)");
    } else {
      $elements = $(selector);
    }
    if ($elements.length > 0) {
      $elements.addClass("p" + process_id);
      if (params.mark) $(selector).addClass("has_appeared");
      var element = $(".p" + process_id); //the appearing element is now identified by a unique class ex: p123456
      callback(element);
      clearInterval(Appear_process[process_id]);
      if (params.continious) {
        $(selector).appear(callback, continious);
      }
    }
  }, 50);
};

var Disappear_process = [];
$.fn.disappear = function (callback, continious = false, timeLimit = false) {
  // disappear ONLY WORKS ON JQUERY 2
  var selector = this.selector;
  var process_id = Math.floor(Math.random() * 100000) + 1;
  Disappear_process[process_id] = setInterval(function () {
    if ($(selector).length < 1) {
      $(selector).addClass("p" + process_id);
      var element = $(".p" + process_id); //the appearing element is now identified by a unique class ex: p123456
      callback(element);
      clearInterval(Disappear_process[process_id]);
      if (continious) {
        $(selector).disappear(callback, continious);
      }
    }
  }, 50);
  if (timeLimit !== false) {
    clearInterval(Disappear_process[process_id]);
    callback();
  }
};

class InscriptionPage {
  constructor() {
    this._inscriptionButton = "#A14";
    this._firstCounter =
      this._inscriptionButton + " .aadl-auto-refresh-counter";
    this._firstRefreshButton =
      this._inscriptionButton + " .aadl-auto-refresh-button";
    this._formIndicator = "#A17";
    this.firstStepFailed = function () {};
    this.step = 0;
    this.firstStepProcess;
  }

  init() {
    let self = this;
    this.onInscriptionButtonAppear(function () {
      console.log("button appeared");
      setTimeout(function () {
        $(self._inscriptionButton).click();
      }, 1000);
    });
    self.onFormAppear(function () {
      console.log("form appeared");
      self.fillForm();
    });
  }

  onFormAppear(callback) {
    let self = this;
    let formAppearInterval = setInterval(() => {
      if ($(self._formIndicator).is(":visible")) {
        clearInterval(formAppearInterval);
        callback();
      }
    }, 500);
  }

  async fillForm() {
    let formValues = await get("form");
    for (let input of formValues) {
      let label = input.label;
      let val = input.value;
      $("input[name='" + label + "'],select[name='" + label + "']")
        .val(val)
        .trigger("change");
    }
    $("#A91_1").prop("checked", true);
    $("#A33").val("xxxxxx");
    let automaticMode = await get("automaticMode");
    if (automaticMode === true) {
      $("#A55").click();
      setTimeout(function () {
        $(".pos97 button").click();
      }, 500);
    }
  }

  getRandomCharBetween10And15() {
    const min = 10;
    const max = 15;
    const randomCharCode = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log("---", String.fromCharCode(randomCharCode));
    return randomCharCode;
  }

  onAjaxError(callback) {
    let self = this;
    console.log(window);
    window.onerror = function (message, source, lineno, colno, error) {
      console.log("error");
      if (source.includes("WDAJAX.js")) {
        console.log("ajax error detected");
        callback();
      }
    };
  }

  async onInscriptionButtonAppear(callback) {
    let self = this;
    await new Promise(function (resolve, reject) {
      $(self._inscriptionButton).appear(function () {
        callback();
        resolve();
      });
    });
  }

  setCounter(counterNumber, count) {
    let self = this;
    switch (counterNumber) {
      case 1:
        $(self._firstCounter).html(count);
        break;
      case 2:
        // $(self._firstCounter).html(count)
        break;
    }
  }

  startCounting(counterNumber) {
    let self = this;
    switch (counterNumber) {
      case 1:
        let counter = 1;
        self.firstStepProcess = setInterval(() => {
          console.log(counter);
          self.setCounter(1, counter);
          if (counter >= 3) {
            clearInterval(self.firstStepProcess);
            self.startCounting(1);
            $(self._inscriptionButton).click();
          }
          counter++;
        }, 1000);
        break;
      case 2:
        // $(self._firstCounter).html(count)
        break;
    }
  }

  onFirstStepFailed(callback) {
    this.firstStepFailed = callback;
  }

  injectFakeInscriptionButton() {
    let self = this;
    let button = self.generateElement("aadl-auto-refresh-button", function () {
      console.log("auto click initiated");
      let counter = 1;
      let counterSpan = self.generateElement("aadl-auto-refresh-counter");
      self.step = 1;
      $(self._inscriptionButton).append(counterSpan);
      $(self._inscriptionButton).click();
      $(self._firstRefreshButton).addClass("disabled");
      self.startCounting(1);
    });
    $(self._inscriptionButton).after(button);
  }

  generateElement(className, clickFunc = false) {
    let self = this;
    let item;
    switch (className) {
      case "aadl-auto-refresh-button":
        item = $("<button>", {
          class: "aadl-auto-refresh-button",
          html: "AADL 3 Auto click",
          type: "button",
          click: function () {
            clickFunc();
          },
        });
        break;
      case "aadl-auto-refresh-counter":
        item = $("<span>", {
          class: "aadl-auto-refresh-counter",
          html: "1",
        });
        break;
    }
    return item;
  }
}
