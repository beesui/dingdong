var Promise = require("bluebird");
var AlexaUtterances = require("alexa-utterances");
var SSML = require("./to-ssml");
var dingdong = {};
var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('dingdong');

dingdong.response = function() {
  this.resolved = false;

  this.response = {
    "versionid": '1.0',
    "is_end": true,
    "sequence": '',
    "timestamp": moment().valueOf()
  };

  this.need_slot = function(str) {
    this.response.need_slot = str;
    debug('need_slot', this.response.need_slot);
    return this;
  };

  this.say = function(str) {

    if (typeof this.response.directive == "undefined") {
      this.response.directive = {
        "directive_items": [{
          "type": "1",
          "content": str
        }]
      };
    } else {
      // append str to the current outputSpeech, stripping the out speak tag
      this.response.directive.push({
        "type": "1",
        "content": str
      });
    }
    debug('say', this.response.directive);
    return this;
  };
  this.clear = function( /*str*/ ) {
    this.response.directive = {
      "directive_items": [{
        "type": "1",
        "content": ''
      }]
    };
    if(this.response.need_slot) {
      delete this.response.need_slot;
      if(this.response.need_slot) this.response.need_slot = '';
    }
    debug('clear');
    return this;
  };
  this.card = function(oCard) {
    if (2 == arguments.length) { //backwards compat
      oCard = {
        type: '1',
        title: arguments[0],
        text: arguments[1]
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
    debug('card', oCard);
    return this;
  };
  this.shouldEndSession = function(bool) {
    this.response.is_end = bool;
    debug('shouldEndSession', this.response.is_end);
    return this;
  };
  this.session = function(key, val) {
    if (typeof val == "undefined") {
      return this.response.sessionAttributes[key];
    } else {
      if(!this.response.sessionAttributes) this.response.sessionAttributes = {};
      this.response.sessionAttributes[key] = val;
    }
    debug('res.session', key, val);
    return this;
  };
  this.clearSession = function(key) {
    debug('clearSession', key);
    if (typeof key == "string" && typeof this.response.sessionAttributes[key] != "undefined") {
      delete this.response.sessionAttributes[key];
    } else {
      this.response.sessionAttributes = {};
    }
    return this;
  };

};

dingdong.request = function(json) {
  debug('dingdong.request json', JSON.stringify(json));
  this.data = json;
  this.slot = function(slotName, defaultValue) {
    try {
      return this.data.slots[slotName];
    } catch (e) {
      console.error("missing intent in request: " + slotName, e);
      return defaultValue;
    }
  };
  this.request_status = this.data.status;
  this.sessionDetails = _.get(this.data, 'session');
  this.versionid = this.data.versionid;
  this.sequence = this.data.sequence;
  this.timestamp = this.data.timestamp;
  this.input_text = this.data.input_text;
  this.user_id = this.data.user.user_id;
  this.userAttributes = _.get(this.data, 'user.attributes');
  this.applicationId = this.data.application_info.application_id;
  this.applicationName = this.data.application_info.application_name;
  this.sessionId = this.data.session.session_id;
  this.sessionAttributes = _.get(this.data, 'session.attributes');
  this.isSessionNew = (true === this.data.session.is_new);

  if(this.request_status === 'END') {
    this.ended_reason = this.data.ended_reason;
  }
  else if (this.request_status === 'NOTICE') {
    this.notice_type = this.data.notice_type;
  }

  this.session = function(key) {
    debug('req.session', key);
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
    "NO_INTENT_FOUND": "抱歉，无法识别您说的内容，请您再尝试一遍！",
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
      response.response.sequence = request.sequence;
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
        var requestType = request.request_status;
        debug('request', 'requestType', requestType);
        if (typeof self.pre == "function") {
          self.pre(request, response, requestType);
        }
        if (!response.resolved) {
          if ("INTENT" === requestType) {
            var intent = Object.keys(request_json.slots)[0];
            if(intent === 'bizname' && Object.keys(request_json.slots).length > 1) {
              intent = Object.keys(request_json.slots)[1];
            }
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
