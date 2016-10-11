var Promise = require("bluebird");
var AlexaUtterances = require("alexa-utterances");
var SSML = require("./to-ssml");
var dingdong = {};
var _ = require('lodash');
var moment = require('moment');

dingdong.response = function() {
  this.resolved = false;
  // "responses": {
  //   "200": {
  //     "description": "OK",
  //     "schema": {
  //       "type": "object",
  //       "properties": {
  //         "version": {
  //           "type": "string",
  //           "example": "1.0",
  //           "description": "版本号，回传平台调用时传递的值"
  //         },
  //         "is_end": {
  //           "type": "boolean",
  //           "description": "由开发者服务决定本次会话是否结束，如果标识为结束（true）平台会清除本次会话在平台保持的会如果标识为不结束（false）平台继续为用户保持当前会话数据。",
  //           "example": true
  //         },
  //         "seq": {
  //           "type": "string",
  //           "example": "123123123",
  //           "description": "交互流水号，回传平台调用时传递的值"
  //         },
  //         "ts": {
  //           "type": "integer",
  //           "example": 8728881267736576,
  //           "description": "开发者服务应答平台的请求时间，格式为：当前时间的毫秒值",
  //           "format": "int64"
  //         },
  //         "need_slot": {
  //           "type": "string",
  //           "example": "switch",
  //           "description": "需要的槽值：如不为空则平台会主动为开发者收集此槽值服务，如用户输入的说法不符合槽值提取规为未识别重复收集。如为空，则表明不需要平台关注槽值的识别，全部透传到第三方服务进行判断。"
  //         },
  //         "device_show": {
  //           "type": "object",
  //           "properties": {
  //             "items": {
  //               "type": "array",
  //               "items": {
  //                 "type": "object",
  //                 "description": "设备",
  //                 "properties": {
  //                   "type": {
  //                     "type": "string",
  //                     "description": "类型：1.TTS 2.AUDIO",
  //                     "example": "1"
  //                   },
  //                   "content": {
  //                     "type": "string",
  //                     "description": "TTS播报内容；AUDIO链接。",
  //                     "example": "hello"
  //                   }
  //                 },
  //                 "additionalProperties": true
  //               }
  //             }
  //           },
  //           "description": "开发者需要音箱设备播报的内容。注：音箱会依据开发者给出的顺序播报。"
  //         },
  //         "device_action": {
  //           "type": "object",
  //           "properties": {
  //             "items": {
  //               "type": "array",
  //               "items": {
  //                 "type": "object",
  //                 "description": "设备行为",
  //                 "properties": {
  //                   "invoke": {
  //                     "type": "string",
  //                     "description": "要调用的方法名",
  //                     "example": "switch"
  //                   },
  //                   "params": {
  //                     "type": "string",
  //                     "description": "方法参数，JSON格式",
  //                     "example": "on"
  //                   }
  //                 }
  //               }
  //             }
  //           },
  //           "description": "开发者需要调用音箱设备的预置行为，比如：灯效。注：音箱会依据开发者给出的顺序执行。"
  //         },
  //         "app_show": {
  //           "type": "object",
  //           "description": "开发者需要平台推送到音箱设备关联的手机App展现的内容，其中可以包含：文本、文本+图片、链接等",
  //           "properties": {
  //             "title": {
  //               "type": "string",
  //               "description": "开发者需要平台推送到音箱关联的手机App上展现的标题内容。注：不能超过20个字",
  //               "example": "hello"
  //             },
  //             "type": {
  //               "type": "string",
  //               "description": "App展现内容类型：1. 纯文字 2. 文字+图片 3. 外部链接",
  //               "example": "1"
  //             },
  //             "content": {
  //               "type": "string",
  //               "description": "type为1时使用",
  //               "example": "hello"
  //             },
  //             "rich_contents": {
  //               "type": "array",
  //               "items": {
  //                 "type": "object",
  //                 "description": "推送到手机App上展现详细内容",
  //                 "properties": {
  //                   "type": {
  //                     "type": "string",
  //                     "description": "类型：1. 文字 2. 图片",
  //                     "example": "1"
  //                   },
  //                   "content": {
  //                     "type": "string",
  //                     "description": "类型为1时：文字内容；类型为2时：图片链接，链接长度不可以超过512个字符",
  //                     "example": "hello"
  //                   }
  //                 }
  //               },
  //               "description": "type为2时使用，注：App会根据开发者返回的顺序展示"
  //             },
  //             "url": {
  //               "type": "string",
  //               "description": "type为3时使用",
  //               "example": "null"
  //             }
  //           }
  //         },
  //         "device_reprompt": {
  //           "type": "object",
  //           "description": "开发者需要用户无应答或输入有误的情况下，音箱重复播报的内容。",
  //           "properties": {
  //             "items": {
  //               "type": "array",
  //               "items": {
  //                 "type": "object",
  //                 "description": "设备行为",
  //                 "properties": {
  //                   "invoke": {
  //                     "type": "string",
  //                     "description": "要调用的方法名",
  //                     "example": "switch"
  //                   },
  //                   "params": {
  //                     "type": "string",
  //                     "description": "方法参数，JSON格式",
  //                     "example": "on"
  //                   }
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       },
  //       "required": [
  //         "version",
  //         "is_end",
  //         "ts",
  //         "seq"
  //       ],
  //       "description": "请求返回内容"
  //     }
  //   }
  // }
  this.response = {
    "version": '1.0',
    "is_end": true,
    "seq": '',
    "ts": moment().valueOf()
  };
  this.say = function(str) {

    if (typeof this.response.device_show == "undefined") {
      this.response.device_show = {
        "items": [{
          "type": "1",
          "content": str
        }]
      };
    } else {
      // append str to the current outputSpeech, stripping the out speak tag
      this.response.device_show.push({
        "type": "1",
        "content": str
      });
    }
    return this;
  };
  this.clear = function( /*str*/ ) {
    this.response.device_show = {
      "items": [{
        "type": "1",
        "content": ''
      }]
    };
    return this;
  };
  this.reprompt = function(str) {
    if (typeof this.response.device_reprompt == "undefined") {
      this.response.device_reprompt = {
        "items": [{
          "type": "1",
          "content": str
        }]
      };
    } else {
      // append str to the current outputSpeech, stripping the out speak tag
      this.response.device_reprompt.push({
        "type": "1",
        "content": str
      });
    }
    return this;
  };
  this.card = function(oCard) {
    if (2 == arguments.length) { //backwards compat
      oCard = {
        type: '1',
        title: arguments[0],
        content: arguments[1]
      };
    }

    var requiredAttrs = [],
      clenseAttrs = [];

    switch (oCard.type) {
      case 'Simple':
        oCard.type = '1';
        break;
      case 'Standard':
        oCard.type = '2';
        requiredAttrs.push('text');
        clenseAttrs.push('text');
        if (('image' in oCard) && (!('smallImageUrl' in oCard['image']) && !('largeImageUrl' in oCard['image']))) {
          console.error('If card.image is defined, must specify at least smallImageUrl or largeImageUrl');
          return this;
        }
        break;
      case 'Link':
        oCard.type = '3';
        requiredAttrs.push('text');
        clenseAttrs.push('text');
        if (('image' in oCard) && (!('smallImageUrl' in oCard['image']) && !('largeImageUrl' in oCard['image']))) {
          console.error('If card.image is defined, must specify at least smallImageUrl or largeImageUrl');
          return this;
        }
        break;
      default:
        break;
    }

    var hasAllReq = requiredAttrs.every(function(idx) {
      if (!(idx in oCard)) {
        console.error('Card object is missing required attr "' + idx + '"');
        return false;
      }
      return true;
    });

    if (!hasAllReq) {
      return this;
    }

    // remove all SSML to keep the card clean
    clenseAttrs.forEach(function(idx) {
      oCard[idx] = SSML.cleanse(oCard[idx]);
    });

    this.response.app_show = oCard;

    return this;
  };
  this.linkAccount = function() {
    this.response.card = {
      "type": "LinkAccount"
    };
    return this;
  };
  this.shouldEndSession = function(bool, reprompt) {
    this.response.is_end = bool;
    if (reprompt) {
      this.reprompt(reprompt);
    }
    return this;
  };
  this.session = function(key, val) {
    if (typeof val == "undefined") {
      return this.response.sessionAttributes[key];
    } else {
      // if(!this.response.sessionAttributes) this.response.sessionAttributes = {};
      // this.response.sessionAttributes[key] = val;
    }
    return this;
  };
  this.clearSession = function(key) {
    if (typeof key == "string" && typeof this.response.sessionAttributes[key] != "undefined") {
      delete this.response.sessionAttributes[key];
    } else {
      this.response.sessionAttributes = {};
    }
    return this;
  };

};

dingdong.request = function(json) {
  this.data = json;
  this.slot = function(slotName, defaultValue) {
    try {
      return this.data.slots[slotName];
    } catch (e) {
      console.error("missing intent in request: " + slotName, e);
      return defaultValue;
    }
  };
  this.type = function() {
    try {
      return this.data.status;
    } catch (e) {
      console.error("missing type", e);
      return null;
    }
  };
  this.sessionDetails = {
    "new": this.data.session.is_new,
    "sessionId": this.data.session.sid,
    "attributes": _.get(this.data, 'session.params')
  };
  this.version = this.data.version;
  this.seq = this.data.seq;
  this.content = this.data.content;
  this.userId = this.data.user.user_id;
  this.userAttributes = _.get(this.data, 'user.params');
  this.applicationId = this.data.biz_info.biz_id;
  this.applicationName = this.data.biz_info.biz_name;
  this.sessionId = this.data.session.sid;
  this.sessionAttributes = _.get(this.data, 'session.params');
  this.isSessionNew = (true === this.data.session.is_new);
  this.session = function(key) {
    try {
      return this.data.session.attributes[key];
    } catch (e) {
      console.error("key not found on session attributes: " + key, e);
      return;
    }
  };
};

dingdong.apps = {};

dingdong.app = function(name, endpoint) {
  var self = this;
  this.name = name;
  this.messages = {
    // When an intent was passed in that the application was not configured to handle
    "NO_INTENT_FOUND": "Sorry, the application didn't know what to do with that intent",
    // When the app was used with 'open' or 'launch' but no launch handler was defined
    "NO_LAUNCH_FUNCTION": "Try telling the application what to do instead of opening it",
    // When a request type was not recognized
    "INVALID_REQUEST_TYPE": "Error: not a valid request",
    // If some other exception happens
    "GENERIC_ERROR": "Sorry, the application encountered an error"
  };

  // Persist session variables from every request into every response?
  this.persistentSession = true;

  // use a minimal set of utterances or the full cartesian product?
  this.exhaustiveUtterances = false;

  // A catch-all error handler - do nothing by default
  this.error = null;

  // pre/post hooks to be run on every request
  this.pre = function( /*request, response, type*/ ) {};
  this.post = function( /*request, response, type*/ ) {};

  this.endpoint = endpoint;
  // A mapping of keywords to arrays of possible values, for expansion of sample utterances
  this.dictionary = {};
  this.intents = {};
  this.intent = function(intentName, schema, func) {
    if (typeof schema == "function") {
      func = schema;
      schema = null;
    }
    self.intents[intentName] = {
      "name": intentName,
      "function": func
    };
    if (schema) {
      self.intents[intentName].schema = schema;
    }
  };
  this.launchFunc = null;
  this.launch = function(func) {
    self.launchFunc = func;
  };
  this.sessionEndedFunc = null;
  this.sessionEnded = function(func) {
    self.sessionEndedFunc = func;
  };
  this.noticeFunc = null;
  this.notice = function(func) {
    self.noticeFunc = func;
  };
  this.request = function(request_json) {
    return new Promise(function(resolve, reject) {
      var request = new dingdong.request(request_json);
      var response = new dingdong.response();
      response.response.seq = request.seq;
      var postExecuted = false;
      // Attach Promise resolve/reject functions to the response object
      response.send = function(exception) {
        if (typeof self.post == "function" && !postExecuted) {
          postExecuted = true;
          self.post(request, response, requestType, exception);
        }
        if (!response.resolved) {
          response.resolved = true;
          resolve(response.response);
        }
      };
      response.fail = function(msg, exception) {
        if (typeof self.post == "function" && !postExecuted) {
          postExecuted = true;
          self.post(request, response, requestType, exception);
        }
        if (!response.resolved) {
          response.resolved = true;
          reject(msg);
        }
      };
      try {
        var key;
        // Copy all the session attributes from the request into the response so they persist.
        // The Alexa API doesn't think session variables should persist for the entire
        // duration of the session, but I do.
        if (request.sessionAttributes && self.persistentSession) {
          for (key in request.sessionAttributes) {
            response.session(key, request.sessionAttributes[key]);
          }
        }
        var requestType = request.type();
        if (typeof self.pre == "function") {
          self.pre(request, response, requestType);
        }
        if (!response.resolved) {
          if ("INTENT" === requestType) {
            var intent = Object.keys(request_json.slots)[0];
            if (typeof self.intents[intent] != "undefined" && typeof self.intents[intent]["function"] == "function") {
              if (false !== self.intents[intent]["function"](request, response)) {
                response.send();
              }
            } else {
              throw "NO_INTENT_FOUND";
            }
          } else if ("LAUNCH" === requestType) {
            if (typeof self.launchFunc == "function") {
              if (false !== self.launchFunc(request, response)) {
                response.send();
              }
            } else {
              throw "NO_LAUNCH_FUNCTION";
            }
          } else if ("END" === requestType) {
            if (typeof self.sessionEndedFunc == "function") {
              if (false !== self.sessionEndedFunc(request, response)) {
                response.send();
              }
            }
          } else if ("NOTICE" === requestType) {
            if (typeof self.noticeFunc == "function") {
              if (false !== self.noticeFunc(request, response)) {
                response.send();
              }
            }
          } else {
            throw "INVALID_REQUEST_TYPE";
          }
        }
      } catch (e) {
        if (typeof self.error == "function") {
          self.error(e, request, response);
        } else if (typeof e == "string" && self.messages[e]) {
          response.say(self.messages[e]);
          response.send(e);
        }
        if (!response.resolved) {
          response.fail("Unhandled exception" + e.message, e);
        }
      }
    });
  };

  // Extract the schema and generate a schema JSON object
  this.schema = function() {
    var schema = {
        "intents": []
      },
      intentName, intent, key;
    for (intentName in self.intents) {
      intent = self.intents[intentName];
      var intentSchema = {
        "intent": intent.name,
        "slots": []
      };
      if (intent.schema) {
        if (intent.schema.slots) {
          for (key in intent.schema.slots) {
            intentSchema.slots.push({
              "name": key,
              "type": intent.schema.slots[key]
            });
          }
        }
      }
      schema.intents.push(intentSchema);
    }
    return JSON.stringify(schema, null, 3);
  };

  // Generate a list of sample utterances
  this.utterances = function() {
    var intentName,
      intent,
      out = "";
    for (intentName in self.intents) {
      intent = self.intents[intentName];
      if (intent.schema && intent.schema.utterances) {
        intent.schema.utterances.forEach(function(sample) {
          var list = AlexaUtterances(sample,
            intent.schema.slots,
            self.dictionary,
            self.exhaustiveUtterances);
          list.forEach(function(utterance) {
            out += intent.name + "\t" + (utterance.replace(/\s+/g, " ")).trim() + "\n";
          });
        });
      }
    }
    return out;
  };

  // A built-in handler for AWS Lambda
  this.handler = function(event, context) {
    self.request(event)
      .then(function(response) {
        context.succeed(response);
      })
      .catch(function(response) {
        context.fail(response);
      });
  };

  // For backwards compatibility
  this.lambda = function() {
    return self.handler;
  };

  // A utility method to bootstrap dingdong endpoints into express automatically
  this.express = function(express, path, enableDebug) {
    var endpoint = (path || "/") + (self.endpoint || self.name);
    express.post(endpoint, function(req, res) {
      self.request(req.body).then(function(response) {
        res.json(response);
      }, function() {
        res.status(500).send("Server Error");
      });
    });
    if (typeof enableDebug != "boolean") {
      enableDebug = true;
    }
    if (enableDebug) {
      express.get(endpoint, function(req, res) {
        res.render("test", {
          "json": self,
          "schema": self.schema(),
          "utterances": self.utterances()
        });
      });
    }
  };

  // Add the app to the global list of named apps
  if (name) {
    dingdong.apps[name] = self;
  }

  return this;
};

module.exports = dingdong;
