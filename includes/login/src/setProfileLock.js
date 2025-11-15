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
	return function setProfileLock(enable, callback) {
		let resolveFunc = function () { };
		let rejectFunc = function () { };
		const returnPromise = new Promise(function (resolve, reject) {
			resolveFunc = resolve;
			rejectFunc = reject;
		});

		if (!callback) {
			callback = function (err, data) {
				if (err) {
					return rejectFunc(err);
				}
				resolveFunc(data);
			};
		}

		if (typeof enable !== "boolean") {
			return callback(new Error("enable must be a boolean value"));
		}

		const form = {
			av: ctx.userID,
			__aaid: 0,
			__user: ctx.userID,
			__a: 1,
			__req: utils.getGUID(),
			__hs: ctx.fb_dtsg_ag,
			dpr: 1,
			__ccg: "EXCELLENT",
			__rev: ctx.req_ID,
			__s: utils.getGUID(),
			__hsi: ctx.hsi,
			__comet_req: 15,
			fb_dtsg: ctx.fb_dtsg,
			jazoest: utils.getJazoest(ctx.fb_dtsg),
			lsd: ctx.fb_dtsg,
			__spin_r: ctx.req_ID,
			__spin_b: "trunk",
			__spin_t: Date.now(),
			__crn: "comet.fbweb.CometProfileTimelineListViewRoute",
			fb_api_caller_class: "RelayModern",
			fb_api_req_friendly_name: "WemPrivateSharingMutation",
			server_timestamps: true,
			variables: JSON.stringify({
				enable: !enable
			}),
			doc_id: "9144138075685633"
		};

		defaultFuncs
			.post("https://www.facebook.com/api/graphql/", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.error) {
					throw resData;
				}

				const result = resData?.data?.toggle_wem_private_sharing_control_enabled;
				
				if (!result) {
					throw new Error("Cannot toggle profile lock status");
				}

				return callback(null, {
					private_sharing_enabled: result.private_sharing_enabled,
					is_ppg_converter: result.is_ppg_converter,
					is_ppg_user: result.is_ppg_user,
					last_toggle_time: result.private_sharing_last_toggle_time,
					owner_id: result.owner_id
				});
			})
			.catch(function (err) {
				log.error("setProfileLock", err);
				return callback(err);
			});

		return returnPromise;
	};
};
/** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Please give credits if reused. */