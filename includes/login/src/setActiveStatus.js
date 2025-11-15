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

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
    /** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Instagram: @sheikh.tamim_lover */
    return function setActiveStatus(isActive, callback) {
        var resolveFunc = function () { };
        var rejectFunc = function () { };
        var returnPromise = new Promise(function (resolve, reject) {
            resolveFunc = resolve;
            rejectFunc = reject;
        });

        if (!callback) {
            callback = function (err, data) {
                if (err) return rejectFunc(err);
                resolveFunc(data);
            };
        }

        if (typeof isActive !== "boolean") {
            return callback({ error: "isActive must be a boolean value" });
        }

        const form = {
            av: ctx.userID,
            __aaid: 0,
            __user: ctx.userID,
            __a: 1,
            __req: utils.getSignatureID(),
            __hs: "20351.HYP:comet_pkg.2.1...0",
            dpr: 1,
            __ccg: "EXCELLENT",
            __rev: "1027388793",
            __s: utils.getSignatureID(),
            __hsi: "7552256848274926554",
            __comet_req: 15,
            fb_dtsg: ctx.fb_dtsg,
            jazoest: ctx.ttstamp,
            lsd: ctx.fb_dtsg,
            __spin_r: "1027388793",
            __spin_b: "trunk",
            __spin_t: Date.now(),
            fb_api_caller_class: "RelayModern",
            fb_api_req_friendly_name: "UpdatePresenceSettingsMutation",
            variables: JSON.stringify({
                input: {
                    online_policy: "ALLOWLIST",
                    web_allowlist: [],
                    web_visibility: isActive,
                    actor_id: ctx.userID.toString(),
                    client_mutation_id: "1"
                }
            }),
            server_timestamps: true,
            doc_id: "9444355898946246"
        };

        defaultFuncs
            .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
            .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
            .then(function (resData) {
                if (resData.error) {
                    throw resData;
                }

                return callback(null, {
                    success: true,
                    activeStatus: isActive,
                    response: resData
                });
            })
            .catch(function (err) {
                log.error("setActiveStatus", err);
                return callback(err);
            });

        return returnPromise;
    };
};
/** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Please give credits if reused. */