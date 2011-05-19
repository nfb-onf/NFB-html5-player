/**
* nfbStats channel for $video jQuery plugin (v.1.0)
*
* Created by A navalla suíza (http://anavallasuiza.com)
*
* stats channel is released under the GNU Affero GPL version 3.
* More information at http://www.gnu.org/licenses/agpl-3.0.html
*/

(function($) {
	window.$vChannels.nfbStats = function (video, settings) {
		this.video = video;
		this.settings = settings;
		this.browser.init();

		this.addEvent('startPlaying');
		this.addEvent('fullScreen');
		this.addEvent('percent', 25);
		this.addEvent('percent', 50);
		this.addEvent('percent', 75);
		this.addEvent('seek');
		this.addEvent('end');

		return this;
	}

	window.$vChannels.nfbStats.prototype = {
		//Register a stat event
		addEvent: function (name, data) {
			var fn_name = 'event_' + name;

			if ($.isFunction(this[fn_name])) {
				this[fn_name](data);
			} else {
				console.error('The event ' + fn_name + ' is not valid');
			}
		},

		//Execute a stat event
		sendEvent: function (event) {
			var ajax_settings = {
				url: 'http://iweb1.nfb.ca/api/v2/json/statistic/player_event/' + this.settings.film_slug,
				dataType: 'json',
				data: {
					api_key: this.settings.api_key,
					event: event
				},
				type: 'POST'
			};

			//console.log(ajax_settings);

			$.ajax(ajax_settings);
		},

		//Start playing (only once)
		event_startPlaying: function () {
			var that = this;

			that.video.play(function () {
				that.sendEvent('start playing');
				that.sendEvent('infos: screenResolution=' + that.browser.info.screen_width + '×' + that.browser.info.screen_height + ', dpi=72');
			}, true);
		},

		//When user reaches to any percent of the video
		event_percent: function (percent) {
			var that = this;

			that.video.timeline({
				ms: percent + '%',
				fn: function () {
					that.sendEvent('percentPoint reached:' + percent);
				}
			});
		},

		//When user seeks to any percent of the video
		event_seek: function () {
			var that = this;
			
			that.video.afterSeek(function () {
				var point = that.video.miliseconds();
				var percent = Math.round(that.video.totalMiliseconds() / 4);
				
				if (point < percent) {
					that.sendEvent('seeked to percent:' + 25);
				} else if (point < (percent * 2)) {
					that.sendEvent('seeked to percent:' + 50);
				} else if (point < (percent * 3)) {
					that.sendEvent('seeked to percent:' + 75);
				} else {
					that.sendEvent('seeked to percent:' + 100);
				}
			});
		},

		//When user watch the end of the video
		event_end: function () {
			var that = this;

			that.video.end(function () {
				that.sendEvent('percentPoint reached:' + 100);
			});
		},
		
		event_fullScreen: function () {
			var that = this;
			
			$(this.video.video).bind('onEnterFullScreen', function () {
				that.sendEvent('fullscreenToggled: on');
			});
			
			$(this.video.video).bind('onExitFullScreen', function () {
				that.sendEvent('fullscreenToggled: off');
			});
		},

		browser: {
			info: {},
			init: function () {
				this.info = {
					browser: this.searchString(this.dataBrowser) || "An unknown browser",
					version: this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "unknown",
					OS: this.searchString(this.dataOS) || "unknown",
					screen_width: screen.width,
					screen_height: screen.height
				}
			},
			searchString: function (data) {
				for (var i=0;i<data.length;i++)	{
					var dataString = data[i].string;
					var dataProp = data[i].prop;
					this.versionSearchString = data[i].versionSearch || data[i].identity;
					if (dataString) {
						if (dataString.indexOf(data[i].subString) != -1)
							return data[i].identity;
					}
					else if (dataProp)
						return data[i].identity;
				}
			},
			searchVersion: function (dataString) {
				var index = dataString.indexOf(this.versionSearchString);
				if (index == -1) return;
				return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
			},
			dataBrowser: [
				{
					string: navigator.userAgent,
					subString: "Chrome",
					identity: "Chrome"
				},
				{ 	string: navigator.userAgent,
					subString: "OmniWeb",
					versionSearch: "OmniWeb/",
					identity: "OmniWeb"
				},
				{
					string: navigator.vendor,
					subString: "Apple",
					identity: "Safari",
					versionSearch: "Version"
				},
				{
					prop: window.opera,
					identity: "Opera"
				},
				{
					string: navigator.vendor,
					subString: "iCab",
					identity: "iCab"
				},
				{
					string: navigator.vendor,
					subString: "KDE",
					identity: "Konqueror"
				},
				{
					string: navigator.userAgent,
					subString: "Firefox",
					identity: "Firefox"
				},
				{
					string: navigator.vendor,
					subString: "Camino",
					identity: "Camino"
				},
				{
					string: navigator.userAgent,
					subString: "Netscape",
					identity: "Netscape"
				},
				{
					string: navigator.userAgent,
					subString: "MSIE",
					identity: "Explorer",
					versionSearch: "MSIE"
				},
				{
					string: navigator.userAgent,
					subString: "Gecko",
					identity: "Mozilla",
					versionSearch: "rv"
				}
			],
			dataOS : [
				{
					string: navigator.platform,
					subString: "Win",
					identity: "Windows"
				},
				{
					string: navigator.platform,
					subString: "Mac",
					identity: "Mac"
				},
				{
					string: navigator.userAgent,
					subString: "iPhone",
					identity: "iPhone/iPod"
			    },
				{
					string: navigator.platform,
					subString: "Linux",
					identity: "Linux"
				}
			]
		}
	}
})(jQuery);