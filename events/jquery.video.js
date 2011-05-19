/**
* $video jQuery plugin (v.1.0)
*
* Created by A navalla suíza (http://anavallasuiza.com)
*
* $video is released under the GNU Affero GPL version 3.
* More information at http://www.gnu.org/licenses/agpl-3.0.html
*/

(function($) {
	//$vChannels repository
	window.$vChannels = function () {};

	window.$video = function (video) {
		this.video = video;
		this.channels = {};

		this.timeline_points = {};
		this.timeline_sorted_points = [];
		this.timeline_sorted_points_tmp = [];

		$(this.video)
			.bind('play seeked', $.proxy(this.executeTimeline, this))
			.bind('ended', $.proxy(this.clearChannel, this));
		
		var that = this;
		var afterSeek_timeout;
		var execute_afterSeek = function () {
			$(that.video).trigger('afterSeek');
		}

		$(this.video).bind('seeked', function () {
			clearTimeout(afterSeek_timeout);
			afterSeek_timeout = setTimeout(execute_afterSeek, 1000);
		});
	}

	/**
	* function play (fn, [one])
	* function play ()
	*
	* Plays video or bind a function to play event
	*/
	$video.prototype.play = function (fn, one) {
		if ($.isFunction(fn)) {
			if (one) {
				$(this.video).one('play', fn);
			} else {
				$(this.video).bind('play', fn);
			}
		} else {
			this.video.play();
		}

		return this;
	}

	/**
	* function pause (fn, [one])
	* function pause ()
	*
	* Pauses video or bind a function to pause event
	*/
	$video.prototype.pause = function (fn, one) {
		if ($.isFunction(fn)) {
			if (one) {
				$(this.video).one('pause', fn);
			} else {
				$(this.video).bind('pause', fn);
			}
		} else {
			this.video.pause();
		}

		return this;
	}

	/**
	* function playPause (fn, [one])
	* function playPause ()
	*
	* Play the video if it's paused or pause if it's playing video or bind a function to playPause event
	*/
	$video.prototype.playPause = function (fn, one) {
		if ($.isFunction(fn)) {
			if (one) {
				$(this.video).one('playPause', fn);
			} else {
				$(this.video).bind('playPause', fn);
			}
		} else {
			if (this.video.paused) {
				this.play();
			} else {
				this.pause();
			}

			$(this.video).trigger('playPause');
		}

		return this;
	}

	/**
	* function stop (fn, [one])
	* function stop ()
	*
	* Stops video (pause and go to start) or bind a function to stop event
	*/
	$video.prototype.stop = function (fn, one) {
		if ($.isFunction(fn)) {
			if (one) {
				$(this.video).one('stop', fn);
			} else {
				$(this.video).bind('stop', fn);
			}
		} else {
			this.pause();
			this.seek(0);

			$(this.video).trigger('stop');
		}
		
		return this;
	}
	
	/**
	* function end (fn, [one])
	* function end ()
	*
	* Goes to the end of the video or bind a function to end event
	*/
	$video.prototype.end = function (fn, one) {
		if ($.isFunction(fn)) {
			if (one) {
				$(this.video).one('ended', fn);
			} else {
				$(this.video).bind('ended', fn);
			}
		} else {
			this.seek(this.video.duration);
			$(this.video).trigger('ended')
		}

		return this;
	}
	
	/**
	* function seek (fn, [one])
	* function seek (time)
	*
	* Seek for specific point of video or bind a function to seek event
	*/
	$video.prototype.seek = function (fn, one) {
		if ($.isFunction(fn)) {
			if (one) {
				$(this.video).one('seeked', fn);
			} else {
				$(this.video).bind('seeked', fn);
			}
		} else {
			this.video.currentTime = fn;
			$(this.video).trigger('seeked');
		}

		return this;
	}
	
	
	/**
	* function afterSeek (fn, [one])
	* function afterSeek (time)
	*
	* Seek for specific point of video or bind a function to afterSeek event
	*/
	$video.prototype.afterSeek = function (fn, one) {
		if ($.isFunction(fn)) {
			if (one) {
				$(this.video).one('afterSeek', fn);
			} else {
				$(this.video).bind('afterSeek', fn);
			}
		} else {
			$(this.video).trigger('afterSeek');
		}

		return this;
	}
	
	/**
	* function timeline (channel, mark)
	* function timeline (mark)
	*
	* Insert a mark in video timeline (related with channel or independent)
	*/
	$video.prototype.timeline = function (channel, mark) {
		this.ready(function () {
			if (channel == undefined) {
				console.error(this.video.id + ': There is nothing to add to timeline');
				return this;
			}

			var _mark, _channel;

			if (typeof(channel) == 'string') {
				_mark = mark;
				_channel = channel;
			} else {
				_mark = channel;
				_channel = '';
			}

			if (!$.isArray(_mark)) {
				_mark = [_mark];
			}

			var l = _mark.length;

			for (var i = 0; i < l; i++) {
				var ms = _mark[i].ms;

				if (_channel) {
					_mark[i].channel = _channel;
				}

				ms = this.miliseconds(ms);

				if (this.timeline_points[ms] == undefined) {
					this.timeline_points[ms] = [];
				}

				this.timeline_points[ms].push(_mark[i]);
				this.timeline_sorted_points.push(ms);
			}

			this.timeline_sorted_points = this.timeline_sorted_points.sort(function (a, b) {
				return a - b;
			});

			this.executeTimeline();
		});

		return this;
	}

	/**
	* function executeTimeline ()
	*
	* Execute the timeline functions and channels
	*/
	$video.prototype.executeTimeline = function () {
		if (this.video.paused || !this.timeline_sorted_points.length) {
			return;
		}

		//Get tmp_timeline (from now to the end)
		var that = this;
		var ms = that.miliseconds();

		that.timeline_sorted_points_tmp = $.merge([], that.timeline_sorted_points);

		while (that.timeline_sorted_points_tmp[0] < ms) {
			that.timeline_sorted_points_tmp.shift();
		}

		if (!that.timeline_sorted_points_tmp.length) {
			return;
		}

		//Function to execute on timeOut
		var timeout_fn = function () {
			if (that.video.paused) {
				return;
			}
			
			//Get functions to execute
			var ms = that.miliseconds();
			var fns = [];

			while (that.timeline_sorted_points_tmp[0] < ms) {
				$.merge(fns, that.timeline_points[that.timeline_sorted_points_tmp[0]]);

				that.timeline_sorted_points_tmp.shift();
			}

			if (fns.length) {
				for (s in fns) {
					//Independent functions
					if ($.isFunction(fns[s].fn)) {
						fns[s].fn(that);
					}

					//Channels
					if (fns[s].channel != undefined) {
						var channel = fns[s].channel;

						if (that.channels[channel] != undefined && that.channels[channel].active == true) {
							that.channels[channel].fn(fns[s].data);
						}
					}
				}
			}

			//Create other timeout
			if (that.timeline_sorted_points_tmp.length && !that.video.paused) {
				var new_ms = (that.timeline_sorted_points_tmp[0] - that.miliseconds()) + 50;

				if (new_ms < 50) {
					new_ms = 50;
				}

				setTimeout(timeout_fn, new_ms);
			}
		}

		timeout_fn();
	}


	/**
	* function addChannel (channel, [settings], [active])
	*
	* Add a channel to this video
	*/
	$video.prototype.addChannel = function (channel, settings, active) {
		if (window.$vChannels[channel] == undefined) {
			console.error(this.video.id + ': The channel ' + channel + ' is not available');
			return this;
		}

		this.channels[channel] = new window.$vChannels[channel](this, settings);
		this.channels[channel].active = (active || active == undefined) ? true : false;
		
		return this;
	}

	/**
	* function removeChannel (channel)
	*
	* Removes a channel from this video
	*/
	$video.prototype.removeChannel = function (channel) {
		delete this.channels[channel.name];
		
		return this;
	}

	/**
	* function clearChannel ([channel])
	*
	* Execute the clear function of a channel or every channels
	*/
	$video.prototype.clearChannel = function (channel) {
		if (!this.channels) {
			return this;
		}

		if (typeof channel == 'string') {
			if (this.channels[channel] != undefined && $.isFunction(this.channels[channel].clear)) {
				this.channels[channel].clear(this);
			}
		} else {
			for (var c in this.channels) {
				if (this.channels[c] != undefined && $.isFunction(this.channels[c].clear)) {
					this.channels[c].clear(this);
				}
			}
		}
		
		return this;
	}
	
	/**
	* function channelSettings (channel, attr, value)
	* function channelSettings (channel, attr)
	*
	* Get/set a channel setting
	*/
	$video.prototype.channelSettings = function (channel, attr, value) {
		if (value != undefined) {
			this.channels[channel].settings[attr] = value;
			
			return this;
		}

		return this.channels[channel].settings[attr];
	}

	/**
	* function miliseconds (point)
	*
	* Return the current time of the video in miliseconds or a specific point
	*/
	$video.prototype.miliseconds = function (point) {
		if (point == undefined) {
			return parseInt(this.video.currentTime * 1000);
		}

		if ((point+'').indexOf('%') == -1) {
			return parseInt(point);
		}

		point = parseInt(point);

		if (isNaN(point)) {
			return 0;
		}

		return Math.round((this.totalMiliseconds()/100)*point);
	}


	/**
	* function totalMiliseconds ()
	*
	* Return the video duration in miliseconds
	*/
	$video.prototype.totalMiliseconds = function () {
		return parseInt(this.video.duration * 1000);
	}

	/**
	* function ready (fn)
	*
	* Execute a function when video is ready (video.duration is set)
	*/
	$video.prototype.ready = function (fn) {
		if (!isNaN(this.video.duration)) {
			$.proxy(fn, this)();
		} else {
			var that = this;
			var ready_duration = function () {
				if (!isNaN(that.video.duration)) {
					clearInterval(interval_ready_duration);
					$.proxy(fn, that)();
				}
			}

			var interval_ready_duration = setInterval($.proxy(ready_duration, that), 13);
		}

		return this;
	}

	/**
	* function $.video (selector)
	*
	* Creates and return a $video object
	*/
	$.video = function (selector) {
		return new $video($(selector).get(0));
	}
})(jQuery);