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
"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
    /** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Instagram: @sheikh.tamim_lover */
  return function getThreadTheme(themeID, callback) {
    let resolveFunc, rejectFunc;
    const returnPromise = new Promise((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = function (err, data) {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    if (!themeID) {
      return callback({ error: "themeID is required" });
    }

    const form = {
      av: ctx.userID,
      __user: ctx.userID,
      __a: 1,
      __req: utils.getSignatureID(),
      fb_dtsg: ctx.fb_dtsg,
      jazoest: ctx.ttstamp,
      lsd: ctx.fb_dtsg,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "MWPThreadThemeProviderQuery",
      variables: JSON.stringify({
        id: themeID.toString() // <-- THEME ID instead of threadID
      }),
      server_timestamps: true,
      doc_id: "9734829906576883"
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (resData.errors) throw resData.errors;

        if (resData.data && resData.data.messenger_thread_theme) {
          const themeData = resData.data.messenger_thread_theme;
          return callback(null, {
            id: themeData.id,
            name: themeData.accessibility_label,
            description: themeData.description,
            colors: themeData.gradient_colors || [themeData.fallback_color],
            backgroundImage: themeData.background_asset
              ? themeData.background_asset.image.uri
              : null
          });
        } else {
          throw new Error("No theme data found");
        }
      })
      .catch(function (err) {
        log.error("getThreadTheme", err);
        return callback(err);
      });

    return returnPromise;
  };
};
/** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Please give credits if reused. */