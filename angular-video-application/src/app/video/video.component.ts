import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import {DataService} from '../data.service';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { fips } from 'crypto';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css']
})
export class VideoComponent implements OnInit,  AfterViewInit {
  fileData: string;
  @ViewChild('videoDiv') video: ElementRef; 
  @Input() fileName: String;
  
  constructor(private dataService: DataService, iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.fileData = this.dataService.fileData;
    // this.loadScript('../assets/js/VideoFrame.js');
  }

  ngAfterViewInit(): void {
    initPlayer(this.video.nativeElement);
  }
}




var storeTimeInput = ""; //input timecode global variable
var frameNumber = 0; //frameNumber as global 
var hours = 0; //hours as global
var minutes = 0; //minutes as global 
var seconds = 0;
// initPlayer initializes and calls all functions to create player functionality
// takes in an HTML Div as a parameter that represents the container for the whole player
function initPlayer(videoDiv: HTMLDivElement) {
	class timeCodeObject {
		hours: number
		minutes: number
		seconds: number
		frames: number
		advance: boolean

		constructor(hours, minutes, seconds, frames, advance) {
			this.hours = hours;
			this.minutes = minutes;
			this.seconds = seconds;
			this.frames = frames;
			this.advance = advance;
		}
	}

	var videoContainer = videoDiv.childNodes[0];
	var video = <HTMLVideoElement> videoDiv.childNodes[0].childNodes[0];	
	var fps = 0;
	var mainContainer = videoDiv.childNodes[0].childNodes[1];
    var controlBar = videoDiv.childNodes[0].childNodes[1].childNodes[1];
    //progress bar
    var progressBar = videoDiv.childNodes[0].childNodes[1].childNodes[0].childNodes[0];
    var seek = videoDiv.childNodes[0].childNodes[1].childNodes[0].childNodes[1];
    var seekToolTip = videoDiv.childNodes[0].childNodes[1].childNodes[0].childNodes[2];
	var fullScreenBtn = controlBar.childNodes[controlBar.childNodes.length - 1];
	var playbackSpeed =  controlBar.childNodes[controlBar.childNodes.length - 2];

    //volume control
    var volumeButton = controlBar.childNodes[2].childNodes[0];
    var volumeHigh = controlBar.childNodes[2].childNodes[0].childNodes[0];
    var volumeLow = controlBar.childNodes[2].childNodes[0].childNodes[1];
    var volumeMute = controlBar.childNodes[2].childNodes[0].childNodes[2];
	var volume = controlBar.childNodes[2].childNodes[1].childNodes[0];
	
	//frame buttons
	var rfButton = controlBar.childNodes[4].childNodes[0];
	var ffButton = controlBar.childNodes[4].childNodes[1];

	var timeCode = new timeCodeObject(0,0,0,0, false);
	console.log(timeCode);
	
	   //get video FPS
	   window.video = video;
	   window.videoElemStream = video.captureStream();
		videoElemStream.onactive = (x) => {
        window.videoElemTrack = videoElemStream.getVideoTracks()[0];
        window.videoElemTrackSettings = videoElemTrack.getSettings();
		// fps = videoElemTrackSettings.frameRate;
		fps = 29.97;
		// video.fps = fps;
		video.fps = 29.97;
	};
	

	fps = 29.97;
	ffButton.addEventListener('click', function() {
		advanceFrame(video, fps, controlBar, timeCode);
	});

	rfButton.addEventListener('click', function() {
		rewindFrame(video, fps, controlBar);
	});

	var timeCodeElement = controlBar.childNodes[3];
	var timeClicked = false;	
	timeCodeElement.addEventListener('click', function() {
		onTimeClickCallBack(video, timeClicked, timeCodeElement, fps);
	});

    volume.addEventListener('input', function() {
        updateVolume(video, volume);
    });

	video.addEventListener('volumechange', function() {
        updateVolumeIcon(video, volumeLow, volumeHigh, volumeMute);
    });

    video.addEventListener('mouseenter', function() {
        showControls(mainContainer);
    });
    video.addEventListener('mouseleave', function() {
        hideControls(video, mainContainer);
    });
    mainContainer.addEventListener('mouseenter', function() {
        showControls(mainContainer);
    });
    mainContainer.addEventListener('mouseleave', function() {
        hideControls(video, mainContainer);
    });


    volumeButton.addEventListener('click', function() {
        toggleMute(video, volume);
    });

    fullScreenBtn.addEventListener('click', function() {
        toggleFullScreen(videoContainer, controlBar);
    });

    togglePlayPause(video, controlBar);

    video.onloadedmetadata = function() {
        progressBarFunctions(video, seek, progressBar);
    };

    video.addEventListener('timeupdate', function() {
        updateProgress(video, seek, progressBar);
        // updateProgressBar(video, controlBar);
		//updateTimeCode(video, controlBar, fps);
		updateTimeCode(video, controlBar, fps, timeCode);
	}, false);
	
	var interval = null;
	video.onplay = function() {
		interval = setInterval(function() {
			updateTimeCode(video, controlBar, fps, timeCode)
		}, 1000.0 / fps);
	}

	video.onpause = function() {
		var timeCodeElement = controlBar.childNodes[3];
		console.log(video.currentTime);
		smpteToSeconds(video, timeCodeElement.innerHTML, fps);
		clearInterval(interval); 
	};

    seek.addEventListener('mousemove', function() {
        updateSeekTooltip(video, seek, seekToolTip, fps, timeCode);
    });

    seek.addEventListener('input', function() {
        skipAhead(video, seek, progressBar);
	});
	
	playbackSpeed.addEventListener('click', function() {
		changePlayBackSpeed(video, playbackSpeed);
	});

	document.addEventListener('keyup', function(event) {
		const { key } = event;
		switch(key) {
		case ' ' :
			console.log("working")
			toggle(video, controlBar.childNodes[0], controlBar.childNodes[1]);
			if (video.paused) {
			showControls(mainContainer);
			} else {
			setTimeout(() => {
				hideControls(video, mainContainer);
			}, 2000);
			}
			break;
		case 'm':
			toggleMute(video, volume);
			break;
		case 'f':
			toggleFullScreen(videoContainer, controlBar);
			break;
		case 'ArrowLeft':
			rewindFrame(video, fps);
			break;
		case 'ArrowRight':
			advanceFrame(video, fps);
			break;
		}
	});
}

    // toggles the play and pause of the video
    // takes in video element and controlBar as parameters
    function togglePlayPause(video: HTMLVideoElement, controlBar: ChildNode) {
        var play = < any > controlBar.childNodes[0];
        var pause = < any > controlBar.childNodes[1];
        play.addEventListener("click", () => {
            toggle(video, play, pause);
        });
        pause.addEventListener("click", () => {
            toggle(video, play, pause);
        });

        video.addEventListener('click', function() {
            toggle(video, play, pause);
		});
		

    }

    // toggle the video play/pause
    function toggle(video: any, play: any, pause: any) {
        if (video.paused || video.ended) {
            play.style.display = 'none';
            pause.style.display = 'block';
            video.play();
        } else {
            pause.style.display = 'none';
            play.style.display = 'block';
            video.pause();
        }
    }

    // updateVolume updates the video's volume
    // and disables the muted state if active
    function updateVolume(video, volume) {
        if (video.muted) {
            video.muted = false;
        }

        video.volume = volume.value;
    }

    function updateVolumeIcon(video, volumeLow, volumeHigh, volumeMute) {
        if (video.muted || video.volume === 0) {
            volumeMute.style.display = "block";
            volumeLow.style.display = "none";
            volumeHigh.style.display = "none";
        } else if (video.volume > 0 && video.volume <= 0.5) {
            volumeMute.style.display = "none";
            volumeLow.style.display = "block";
            volumeHigh.style.display = "none";
        } else {
            volumeMute.style.display = "none";
            volumeLow.style.display = "none";
            volumeHigh.style.display = "block";
        }
    }

    function toggleMute(video, volume) {
        video.muted = !video.muted;

        if (video.muted) {
            volume.setAttribute('data-volume', volume.value);
            volume.value = 0;
        } else {
            volume.value = volume.dataset.volume;
        }
    }

    // updateSeekTooltip uses the position of the mouse on the progress bar to
    // roughly work out what point in the video the user will skip to if
    // the progress bar is clicked at that point

    ///////// IGNORE ERRORS JS TO TS ISSUES
    function updateSeekTooltip(video, seek, seekToolTip,fps, timeCode) {
		var skipTo = (event.offsetX / event.target.clientWidth) * parseInt(event.target.getAttribute('max'), 10);
		console.log(skipTo);
        seek.setAttribute('data-seek', skipTo);
        var t = toTimeCode(skipTo, fps);
        if (skipTo <= video.duration && skipTo >= 0) {
            seekToolTip.innerHTML = t;
        }
        var rect = video.getBoundingClientRect();
        seekToolTip.style.left = `${event.pageX - rect.left}px`;
    }

    function skipAhead(video, progressBar, seek) {
        var skipTo = event.target.dataset.seek ? event.target.dataset.seek : event.target.value;
        video.currentTime = skipTo;
        progressBar.value = skipTo;
        seek.value = skipTo;
	}
	

    function updateTimeCode(video, controlBar, fps, timeCode) {
		console.log(fps)
        var timeCodeElement = controlBar.childNodes[3];
		// var time = toTimeCode(video,currentTime, fps, timeCode, false);
		timeCodeElement.innerHTML = toTimeCode(video.currentTime, fps);
	}
	
	function toTimeCode(timeInSeconds, fps) {
		var frameNumber = timeInSeconds.toFixed(6) * fps;
		function wrap(n) { return ((n < 10) ? '0' + n : n); }
		var _hour = ((fps * 60) * 60), _minute = (fps * 60);
		var _hours = (frameNumber / _hour).toFixed(0);
		var _minutes = (Number((frameNumber / _minute).toString().split('.')[0]) % 60);
		var _seconds = (Number((frameNumber / fps).toString().split('.')[0]) % 60);
		var SMPTE = (wrap(_hours) + ':' + wrap(_minutes) + ':' + wrap(_seconds) + ':' + wrap((frameNumber % fps)));
		return SMPTE.substring(0,11);			
	}

	function advanceFrame(video, fps) {
		if (video.currentTime == 0) {
			video.currentTime = video.currentTime + 2 * (1.0 / fps);
			console.log(video.currentTime);
		} else {
			video.currentTime = video.currentTime + (1.0 / fps);
			console.log(video.currentTime);
		}
		// console.log(video.currentTime);
		// return toTimeCode(video, fps, 0, timeCode, false);
	}

	function rewindFrame(video, fps) {
		video.currentTime = video.currentTime - (1.0 / fps);
		console.log(video.currentTime);
	}


    function progressBarFunctions(video, seek, progressBar) {
        var videoDuration = Math.round(video.duration);
        seek.setAttribute('max', videoDuration);
        progressBar.setAttribute('max', videoDuration);
    }

    // updateProgress indicates how far through the video
    // the current playback is by updating the progress bar
    function updateProgress(video, seek, progressBar) {
        seek.value = Math.floor(video.currentTime);
        progressBar.value = Math.floor(video.currentTime);
    }

    function toggleFullScreen(htmlDiv, controlBar) {
        var frameSkipDiv = controlBar.childNodes[4];
        if (document.fullscreenElement) {
            document.exitFullscreen();
            frameSkipDiv.style.paddingLeft = "61.5%"
        } else {
            htmlDiv.requestFullscreen();
            frameSkipDiv.style.paddingLeft = "78.5%"
        }

        document.addEventListener("fullscreenchange", function() {
            if (!document.fullscreenElement) {
                frameSkipDiv.style.paddingLeft = "61.5%"
            }
        });
    }

    // hideControls hides the video controls when not in use
    // if the video is paused, the controls must remain visible
    function hideControls(video, mainContainer) {
        if (video.paused) {
            return;
        }

        mainContainer.style.display = "none";
    }

    // showControls displays the video controls
    function showControls(mainContainer) {
        mainContainer.style.display = "block";
    }


	function onTimeClickCallBack(video, timeClicked, timeCode, fps) {
		if(timeClicked == false) {

			video.pause();
			// timeCode.style.display = "none";
			var input = document.createElement("input");
			timeCode.parentNode.replaceChild(input, timeCode);
			//var submitButton = document.createElement("button");
			input.placeholder = 'HH:MM:SS:FF';
			input.id = "timeInput"
			input.style.fontSize = '15px';
			input.style.height = "fit-content";
			input.style.width="93px";
			input.style.marginLeft = '13px';
			input.style.marginTop = '12px';
			input.style.border = 'none';
			input.style.backgroundColor = "rgba(43, 51, 63, 0)";
			input.style.color = '#D39940'
			timeClicked = true;
			// console.log("This is workging: " + storeTimeInput);
			if(storeTimeInput.length > 0) {
				input.value = storeTimeInput;
			}
		}
	
		input.addEventListener("keyup", function(event) {
			// Number 13 is the "Enter" key on the keyboard
			var timeSkip = input.value;
			var totalSeconds = inputTimeToSeconds(timeSkip, fps);
			if (totalSeconds <= video.duration) {
				if (event.keyCode === 13) {
					// Cancel the default action, if needed
					event.preventDefault();
					video.currentTime = totalSeconds;
					// console.log(input.value);
					storeTimeInput = input.value;
					input.parentNode.replaceChild(timeCode, input);
				} 
				timeClicked = false;
				}
			});
	}
	
	
	function inputTimeToSeconds(time, fps) {
		var totalSeconds = 0;
		var times = time.split(":");
		totalSeconds += parseFloat(times[0]) * 3600.0; //hours
		totalSeconds += parseFloat(times[1]) * 60.0; //minutes
		totalSeconds += parseFloat(times[2]); //seconds
		totalSeconds += parseFloat(times[3]) / 30.0; //depends on frame number
		return totalSeconds + 0.03; //fix rounding issue for now
	}


	//this is so that when you pause in the middle of a frame, it can still do frame accuracy well
	function smpteToSeconds(video, time, fps) {
		var time = time.split(':');
		console.log(time);
		video.currentTime = (((Number(time[0]) * 60) * 60) + (Number(time[1]) * 60) + Number(time[2]) + Number(time[3]) * (1.0 / fps));
	}


	function changePlayBackSpeed(video, playBackSpeed) {
		var speedNum = parseFloat(playBackSpeed.innerHTML.slice(0, -1));
		if (speedNum >= 2) {
			speedNum = 0.25;
		} else if (speedNum == 0.25 || speedNum == 1 || speedNum == 1.25) {
			speedNum += .25;
		} else {
			speedNum += 0.5;
		}
		playBackSpeed.innerHTML = speedNum + 'x';
		video.playbackRate = speedNum;
	}




	
