// By @sheikhtamimlover0
"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
    /** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Instagram: @sheikh.tamim_lover */
    return function setThreadTheme(threadID, themeData, callback) {
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

        if (!threadID) {
            return callback({ error: "threadID is required" });
        }

        async function updateThreadTheme() {
            try {
                const timestamp = Date.now();
                
                // Step 1: Load theme bootloader modules
                const moduleParams = new URLSearchParams({
                    modules: "LSUpdateThreadTheme,LSUpdateThreadCustomEmoji,LSUpdateThreadThemePayloadCacheKey",
                    __aaid: 0,
                    __user: ctx.userID,
                    __a: 1,
                    __req: utils.getSignatureID(),
                    __hs: "20352.HYP:comet_pkg.2.1...0",
                    dpr: 1,
                    __ccg: "EXCELLENT",
                    __rev: "1027396270",
                    __s: utils.getSignatureID(),
                    __hsi: "7552524636527201016",
                    __comet_req: 15,
                    fb_dtsg_ag: ctx.fb_dtsg,
                    jazoest: ctx.ttstamp,
                    __spin_r: "1027396270",
                    __spin_b: "trunk",
                    __spin_t: timestamp,
                    __crn: "comet.fbweb.MWInboxHomeRoute"
                });

                await defaultFuncs
                    .get("https://www.facebook.com/ajax/bootloader-endpoint/?" + moduleParams.toString(), ctx.jar)
                    .then(utils.parseAndCheckLogin(ctx, defaultFuncs));

                // Step 2: Get available themes first
                let availableThemes = [];
                try {
                    const themeForm = {
                        av: ctx.userID,
                        __aaid: 0,
                        __user: ctx.userID,
                        __a: 1,
                        __req: utils.getSignatureID(),
                        __hs: "20352.HYP:comet_pkg.2.1...0",
                        dpr: 1,
                        __ccg: "EXCELLENT",
                        __rev: "1027396270",
                        __s: utils.getSignatureID(),
                        __hsi: "7552524636527201016",
                        __comet_req: 15,
                        fb_dtsg: ctx.fb_dtsg,
                        jazoest: ctx.ttstamp,
                        lsd: ctx.fb_dtsg,
                        __spin_r: "1027396270",
                        __spin_b: "trunk",
                        __spin_t: timestamp,
                        __crn: "comet.fbweb.MWInboxHomeRoute",
                        qpl_active_flow_ids: "25308101",
                        fb_api_caller_class: "RelayModern",
                        fb_api_req_friendly_name: "MWPThreadThemeQuery_AllThemesQuery",
                        variables: JSON.stringify({
                            "version": "default"
                        }),
                        server_timestamps: true,
                        doc_id: "24474714052117636"
                    };

                    const themeResult = await defaultFuncs
                        .post("https://www.facebook.com/api/graphql/", ctx.jar, themeForm)
                        .then(utils.parseAndCheckLogin(ctx, defaultFuncs));

                    if (themeResult && themeResult.data && themeResult.data.messenger_thread_themes) {
                        availableThemes = themeResult.data.messenger_thread_themes;
                    }
                } catch (e) {
                    log.warn("setThreadTheme", "Could not fetch available themes, proceeding with theme update");
                }

                // Step 3: Determine theme ID based on input
                let themeId = null;
                let customEmoji = "👍";
                
                if (typeof themeData === "string") {
                    // If it's a string, try to find matching theme
                    if (themeData.match(/^[0-9]+$/)) {
                        // Numeric theme ID
                        themeId = themeData;
                    } else {
                        // Search by theme name/description
                        const foundTheme = availableThemes.find(theme => 
                            theme.accessibility_label && 
                            theme.accessibility_label.toLowerCase().includes(themeData.toLowerCase())
                        );
                        if (foundTheme) {
                            themeId = foundTheme.id;
                        } else {
                            // Fallback color mapping
                            const colorMap = {
                                blue: "196241301102133",
                                purple: "370940413392601", 
                                green: "169463077092846",
                                pink: "230032715012014",
                                orange: "175615189761153",
                                red: "2136751179887052",
                                yellow: "2058653964378557",
                                teal: "417639218648241",
                                black: "539927563794799",
                                white: "2873642392710980",
                                default: "196241301102133"
                            };
                            themeId = colorMap[themeData.toLowerCase()] || colorMap.default;
                        }
                    }
                } else if (typeof themeData === "object" && themeData !== null) {
                    themeId = themeData.themeId || themeData.theme_id || themeData.id;
                    customEmoji = themeData.emoji || themeData.customEmoji || "👍";
                }

                if (!themeId) {
                    themeId = "196241301102133"; // Default blue theme
                }

                // Step 4: Use direct bootloader approach for theme update
                try {
                    // First try with the legacy changeThreadColor approach
                    const legacyForm = {
                        dpr: 1,
                        queries: JSON.stringify({
                            o0: {
                                doc_id: "1727493033983591",
                                query_params: {
                                    data: {
                                        actor_id: ctx.userID,
                                        client_mutation_id: "0",
                                        source: "SETTINGS",
                                        theme_id: themeId,
                                        thread_id: threadID,
                                    },
                                },
                            },
                        }),
                    };

                    const legacyResult = await defaultFuncs
                        .post("https://www.facebook.com/api/graphqlbatch/", ctx.jar, legacyForm)
                        .then(utils.parseAndCheckLogin(ctx, defaultFuncs));

                    if (legacyResult && !legacyResult[0]?.o0?.errors) {
                        return callback(null, {
                            threadID: threadID,
                            themeId: themeId,
                            customEmoji: customEmoji,
                            timestamp: timestamp,
                            success: true,
                            method: "legacy",
                            availableThemes: availableThemes.length > 0 ? availableThemes.map(t => ({
                                id: t.id,
                                name: t.accessibility_label,
                                description: t.description
                            })) : null
                        });
                    }
                } catch (legacyErr) {
                    log.warn("setThreadTheme", "Legacy method failed, trying alternative approach");
                }

                // Step 5: Try alternative GraphQL mutation with updated doc_id
                const alternativeForm = {
                    av: ctx.userID,
                    __aaid: 0,
                    __user: ctx.userID,
                    __a: 1,
                    __req: utils.getSignatureID(),
                    __hs: "20352.HYP:comet_pkg.2.1...0",
                    dpr: 1,
                    __ccg: "EXCELLENT",
                    __rev: "1027396270",
                    __s: utils.getSignatureID(),
                    __hsi: "7552524636527201016",
                    __comet_req: 15,
                    fb_dtsg: ctx.fb_dtsg,
                    jazoest: ctx.ttstamp,
                    lsd: ctx.fb_dtsg,
                    __spin_r: "1027396270",
                    __spin_b: "trunk",
                    __spin_t: timestamp,
                    __crn: "comet.fbweb.MWInboxHomeRoute",
                    fb_api_caller_class: "RelayModern",
                    fb_api_req_friendly_name: "MessengerThreadThemeUpdateMutation",
                    variables: JSON.stringify({
                        "input": {
                            "actor_id": ctx.userID,
                            "client_mutation_id": Math.floor(Math.random() * 10000).toString(),
                            "source": "SETTINGS",
                            "thread_id": threadID.toString(),
                            "theme_id": themeId.toString(),
                            "custom_emoji": customEmoji
                        }
                    }),
                    server_timestamps: true,
                    doc_id: "9734829906576883" // Updated doc_id based on working API
                };

                const result = await defaultFuncs
                    .post("https://www.facebook.com/api/graphql/", ctx.jar, alternativeForm)
                    .then(utils.parseAndCheckLogin(ctx, defaultFuncs));

                if (result && result.errors && result.errors.length > 0) {
                    throw new Error("GraphQL Error: " + JSON.stringify(result.errors));
                }

                // Check if the mutation was successful
                if (result && result.data && result.data.messenger_thread_theme_update) {
                    const updateResult = result.data.messenger_thread_theme_update;
                    if (updateResult.errors && updateResult.errors.length > 0) {
                        throw new Error("Theme Update Error: " + JSON.stringify(updateResult.errors));
                    }
                }

                return callback(null, {
                    threadID: threadID,
                    themeId: themeId,
                    customEmoji: customEmoji,
                    timestamp: timestamp,
                    success: true,
                    method: "graphql",
                    availableThemes: availableThemes.length > 0 ? availableThemes.map(t => ({
                        id: t.id,
                        name: t.accessibility_label,
                        description: t.description
                    })) : null
                });

            } catch (err) {
                log.error("setThreadTheme", err);
                return callback(err);
            }
        }

        updateThreadTheme();
        return returnPromise;
    };
};
/** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Please give credits if reused. */
