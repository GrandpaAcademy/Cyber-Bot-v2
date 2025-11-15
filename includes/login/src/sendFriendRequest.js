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
    return function sendFriendRequest(userID, callback) {
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

        if (!userID) {
            return callback({ error: "User ID is required" });
        }

        var form = {
            av: ctx.userID,
            __aaid: 0,
            __user: ctx.userID,
            __a: 1,
            __req: utils.getSignatureID(),
            __hs: "20353.HYP:comet_pkg.2.1...0",
            dpr: 1,
            __ccg: "EXCELLENT",
            __rev: "1027405870",
            __s: utils.getSignatureID(),
            __hsi: "7552782279085106329",
            __comet_req: 15,
            fb_dtsg: ctx.fb_dtsg,
            jazoest: ctx.ttstamp,
            lsd: ctx.fb_dtsg,
            __spin_r: "1027405870",
            __spin_b: "trunk",
            __spin_t: Date.now(),
            __crn: "comet.fbweb.CometFriendingRoute",
            fb_api_caller_class: "RelayModern",
            fb_api_req_friendly_name: "FriendingCometFriendRequestSendMutation",
            variables: JSON.stringify({
                input: {
                    click_correlation_id: Date.now().toString(),
                    click_proof_validation_result: '{"validated":true}',
                    friend_requestee_ids: [userID.toString()],
                    friending_channel: "FRIENDS_HOME_MAIN",
                    warn_ack_for_ids: [],
                    actor_id: ctx.userID,
                    client_mutation_id: Math.floor(Math.random() * 10).toString()
                },
                scale: 1
            }),
            server_timestamps: true,
            doc_id: "24614631718227645"
        };

        defaultFuncs
            .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
            .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
            .then(function (resData) {
                if (resData.error) {
                    throw resData;
                }

                if (resData.data && resData.data.friend_request_send) {
                    var responseData = resData.data.friend_request_send;
                    if (responseData.friend_requestees && responseData.friend_requestees.length > 0) {
                        var requestee = responseData.friend_requestees[0];
                        var result = {
                            userID: requestee.id,
                            friendshipStatus: requestee.friendship_status,
                            success: requestee.friendship_status === "OUTGOING_REQUEST"
                        };

                        if (requestee.profile_action) {
                            result.actionTitle = requestee.profile_action.title ? requestee.profile_action.title.text : "";
                        }

                        return callback(null, result);
                    } else {
                        return callback({ error: "No friend request data received" });
                    }
                } else {
                    return callback({ error: "Invalid response format" });
                }
            })
            .catch(function (err) {
                log.error("sendFriendRequest", err);
                return callback(err);
            });

        return returnPromise;
    };
};
/** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Please give credits if reused. */