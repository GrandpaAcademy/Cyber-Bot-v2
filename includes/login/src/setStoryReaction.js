/**
 * ===========================================================
 * 🧑‍💻 Author: Sheikh Tamim (ST | Sheikh Tamim)
 * 🔰 Owner & Developer
 * 🌐 GitHub: https://github.com/sheikhtamimlover
 * 📸 Instagram: https://instagram.com/sheikh.tamim_lover
 * -----------------------------------------------------------
 * 🕊️ Respect the creator & give proper credits if reused.
 * ===========================================================
 */
'use strict';

var utils = require('../utils.js');
var log = require('npmlog');

module.exports = function(defaultFuncs, api, ctx) {
  /** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Instagram: @sheikh.tamim_lover */
  return function setStoryReaction(storyID, react, callback) {
    var resolveFunc = function () { };
    var rejectFunc = function () { };
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (typeof react == 'function') {
      callback = react;
      react = '❤️'; // Default heart reaction
    }
    
    if (!callback) {
      callback = function (err, data) {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    if (!storyID) {
      return callback({ error: "storyID is required" });
    }

    var reactionMap = {
      1: '👍',
      2: '❤️', 
      3: '🤗',
      4: '😆',
      5: '😮',
      6: '😢',
      7: '😡',
      'like': '👍',
      'love': '❤️',
      'heart': '❤️',
      'haha': '😆',
      'wow': '😮',
      'sad': '😢',
      'angry': '😡'
    };

    var reaction = reactionMap[react] || react || '❤️';

    var form = {
      av: ctx.userID,
      __aaid: 0,
      __user: ctx.userID,
      __a: 1,
      __req: utils.getSignatureID(),
      __hs: ctx.fb_dtsg_ag,
      dpr: 1,
      __ccg: "EXCELLENT",
      __rev: ctx.req_ID,
      __s: utils.getSignatureID(),
      __hsi: ctx.hsi,
      __comet_req: 15,
      fb_dtsg: ctx.fb_dtsg,
      jazoest: ctx.ttstamp,
      lsd: ctx.fb_dtsg,
      __spin_r: ctx.req_ID,
      __spin_b: "trunk",
      __spin_t: Date.now(),
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "useStoriesSendReplyMutation",
      variables: JSON.stringify({
        input: {
          attribution_id_v2: `StoriesCometSuspenseRoot.react,comet.stories.viewer,unexpected,${Date.now()},356653,,;CometHomeRoot.react,comet.home,tap_tabbar,${Date.now()},109945,4748854339,,`,
          lightweight_reaction_actions: {
            offsets: [0],
            reaction: reaction
          },
          message: reaction,
          story_id: storyID,
          story_reply_type: "LIGHT_WEIGHT",
          actor_id: ctx.userID,
          client_mutation_id: String(Math.floor(Math.random() * 16) + 1)
        }
      }),
      server_timestamps: true,
      doc_id: "9697491553691692"
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (resData.error) throw resData;
        
        // Parse successful response
        if (resData.data && resData.data.direct_message_reply) {
          const replyData = resData.data.direct_message_reply;
          return callback(null, {
            success: true,
            client_mutation_id: replyData.client_mutation_id,
            story_id: replyData.story?.id || storyID,
            reaction: reaction,
            story_reactions: replyData.story?.story_card_info?.story_card_reactions?.edges || [],
            timestamp: Date.now()
          });
        }
        
        return callback(null, {
          success: true,
          reaction: reaction,
          story_id: storyID,
          timestamp: Date.now()
        });
      })
      .catch(function (err) {
        log.error("setStoryReaction", err);
        return callback(err);
      });

    return returnPromise;
  };
};
/** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Please give credits if reused. */