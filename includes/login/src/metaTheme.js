// By @sheikhtamimlover0
"use strict";

const utils = require("../utils");
const log = require("npmlog");
/** © Sheikh Tamim - Please give proper credits if you copy or reuse this code. */
module.exports = function (defaultFuncs, api, ctx) {
    return function metaTheme(prompt, options, callback) {
        var resolveFunc = function () { };
        var rejectFunc = function () { };
        var returnPromise = new Promise(function (resolve, reject) {
            resolveFunc = resolve;
            rejectFunc = reject;
        });

        // Handle optional parameters
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        
        if (!callback) {
            callback = function (err, data) {
                if (err) return rejectFunc(err);
                resolveFunc(data);
            };
        }

        if (!prompt || typeof prompt !== 'string') {
            return callback({ error: "Prompt is required and must be a string" });
        }

        // Parse options
        const numThemes = options.numThemes || 1;
        const imageUrl = options.imageUrl || null;

        const inputData = {
            client_mutation_id: Math.floor(Math.random() * 10).toString(),
            actor_id: ctx.userID,
            bypass_cache: true,
            caller: "MESSENGER",
            num_themes: Math.min(numThemes, 5), // Limit to max 5 themes
            prompt: prompt
        };

        // Add image URL if provided
        if (imageUrl) {
            inputData.image_url = imageUrl;
        }

        const form = {
            av: ctx.userID,
            __aaid: 0,
            __user: ctx.userID,
            __a: 1,
            __req: utils.getSignatureID(),
            __hs: "20358.HYP:comet_pkg.2.1...0",
            dpr: 1,
            __ccg: "EXCELLENT",
            __rev: "1027673511",
            __s: utils.getSignatureID(),
            __hsi: "7554561631547849479",
            __comet_req: 15,
            fb_dtsg: ctx.fb_dtsg,
            jazoest: ctx.ttstamp,
            lsd: ctx.fb_dtsg,
            __spin_r: "1027673511",
            __spin_b: "trunk",
            __spin_t: Date.now(),
            __crn: "comet.fbweb.MWInboxHomeRoute",
            qpl_active_flow_ids: "25309433,521485406",
            fb_api_caller_class: "RelayModern",
            fb_api_req_friendly_name: "useGenerateAIThemeMutation",
            variables: JSON.stringify({ input: inputData }),
            server_timestamps: true,
            doc_id: "23873748445608673",
            fb_api_analytics_tags: JSON.stringify(["qpl_active_flow_ids=25309433,521485406"])
        };

        defaultFuncs
            .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
            .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
            .then(function (resData) {
                if (resData.errors) {
                    throw resData.errors;
                }
                
                if (resData.data && resData.data.xfb_generate_ai_themes_from_prompt) {
                    const themeData = resData.data.xfb_generate_ai_themes_from_prompt;
                    if (themeData.success && themeData.themes && themeData.themes.length > 0) {
                        const themes = themeData.themes.map((theme, index) => ({
                            success: true,
                            themeId: theme.id,
                            name: theme.accessibility_label,
                            description: theme.description,
                            serialNumber: index + 1,
                            colors: {
                                composerBackground: theme.composer_background_color,
                                backgroundGradient: theme.background_gradient_colors,
                                titleBarButton: theme.title_bar_button_tint_color,
                                inboundMessageGradient: theme.inbound_message_gradient_colors,
                                titleBarText: theme.title_bar_text_color,
                                composerTint: theme.composer_tint_color,
                                messageText: theme.message_text_color,
                                primaryButton: theme.primary_button_background_color,
                                titleBarBackground: theme.title_bar_background_color,
                                fallback: theme.fallback_color,
                                gradient: theme.gradient_colors
                            },
                            backgroundImage: theme.background_asset ? theme.background_asset.image.uri : null,
                            iconImage: theme.icon_asset ? theme.icon_asset.image.uri : null,
                            images: {
                                background: theme.background_asset ? theme.background_asset.image.uri : null,
                                icon: theme.icon_asset ? theme.icon_asset.image.uri : null
                            },
                            alternativeThemes: theme.alternative_themes ? theme.alternative_themes.map(alt => ({
                                id: alt.id,
                                name: alt.accessibility_label,
                                backgroundImage: alt.background_asset ? alt.background_asset.image.uri : null,
                                iconImage: alt.icon_asset ? alt.icon_asset.image.uri : null
                            })) : []
                        }));

                        const result = {
                            success: true,
                            count: themes.length,
                            themes: themes,
                            // For backward compatibility, include first theme data at root level
                            ...themes[0]
                        };
                        return callback(null, result);
                    } else {
                        throw new Error("No themes generated for the given prompt");
                    }
                } else {
                    throw new Error("Invalid response from AI theme generation");
                }
            })
            .catch(function (err) {
                log.error("metaTheme", err);
                
                // Check for specific error conditions
                let errorMessage = "An error occurred while generating themes";
                
                if (err.message && err.message.includes("not authorized")) {
                    errorMessage = "Your account is not authorized to generate AI themes. This feature may not be available for your account type.";
                } else if (err.message && err.message.includes("rate limit")) {
                    errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
                } else if (err.message && err.message.includes("Invalid")) {
                    errorMessage = "Invalid request parameters. Please check your input.";
                } else if (err.statusCode === 403) {
                    errorMessage = "Access denied. Your account may not support Meta AI theme generation.";
                } else if (err.statusCode === 429) {
                    errorMessage = "Too many requests. Please wait before trying again.";
                }
                
                return callback({ 
                    error: errorMessage,
                    originalError: err.message || err,
                    statusCode: err.statusCode || null
                });
            });

        return returnPromise;
    };
};

/** © Sheikh Tamim - Please give proper credits if you copy or reuse this code. */
