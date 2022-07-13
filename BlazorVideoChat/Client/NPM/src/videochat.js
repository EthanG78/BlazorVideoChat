import {
    CallClient,
    VideoStreamRenderer,
    LocalVideoStream
} from "@azure/communication-calling";

import {
    AzureCommunicationTokenCredential
} from '@azure/communication-common';


// I HATE JAVASCRIPT YAYAYAYAYA

// Host variables...
let hostCallClient;
let hostCallAgent;
let hostDevices;
let hostLocalVideo;
let hostRemoteVideo
let hostLocalRender;
let hostLocalStream;
let hostRemoteRender;
let hostCall;

window.hostVideoChat = {
    init: async (USER_ACCESS_TOKEN, localVidDOM, remoteVideoDOM) => {
        hostLocalVideo = localVidDOM;
        hostRemoteVideo = remoteVideoDOM;

        hostCallClient = new CallClient();
        const tokenCredential = new AzureCommunicationTokenCredential(USER_ACCESS_TOKEN);
        hostCallAgent = await hostCallClient.createCallAgent(tokenCredential);
        hostDevices = await hostCallClient.getDeviceManager();
    },

    startcall: async (userToCall) => {
        const videoDevices = await hostDevices.getCameras();
        const videoDeviceInfo = videoDevices[0];

        hostLocalStream = new LocalVideoStream(videoDeviceInfo);
        let callOptions = { videoOptions: { localVideoStreams: [hostLocalStream] } };

        hostLocalRender = new VideoStreamRenderer(hostLocalStream);
        const view = await hostLocalRender.createView();
        hostLocalVideo.appendChild(view.target);

        hostCall = hostCallAgent.startCall(
            [{ communicationUserId: userToCall }],
            callOptions
        );

        // This will only ever be 1 on 1's, so we might be able to change some things
        subscribeToRemoteParticipantInCall(hostCall, hostRemoteRender, hostRemoteVideo);
    },

    stopcall: async () => {
        // dispose of the renderers
        hostLocalRender.dispose();
        hostRemoteRender.dispose();

        // end the current call
        await hostCall.hangUp();
    },
}


// TODO: REWORK THIS STUFF
async function remoteVideoView(remoteVideoStream, remoteRenderer, remoteVideo) {
    remoteRenderer = new VideoStreamRenderer(remoteVideoStream);
    const view = await remoteRenderer.createView();
    remoteVideo.appendChild(view.target);
}

function handleVideoStream(remoteVideoStream, remoteRenderer, remoteVideo) {
    remoteVideoStream.on('isAvailableChanged', async () => {
        if (remoteVideoStream.isAvailable) {
            remoteVideoView(remoteVideoStream, remoteRenderer, remoteVideo);
        } else {
            remoteRenderer.dispose();
        }
    });

    if (remoteVideoStream.isAvailable) {
        remoteVideoView(remoteVideoStream, remoteRenderer, remoteVideo);
    }
}

function subscribeToParticipantVideoStreams(remoteParticipant, remoteRenderer, remoteVideo) {
    remoteParticipant.on('videoStreamsUpdated', e => {

        e.added.forEach(v => {
            handleVideoStream(v, remoteRenderer, remoteVideo);
        })
    });

    remoteParticipant.videoStreams.forEach(v => {
        handleVideoStream(v, remoteRenderer, remoteVideo);
    });
}

function subscribeToRemoteParticipantInCall(callInstance, remoteRenderer, remoteVideo) {
    callInstance.on('remoteParticipantsUpdated', e => {

        e.added.forEach(p => {
            subscribeToParticipantVideoStreams(p, remoteRenderer, remoteVideo);
        })
    });

    callInstance.remoteParticipants.forEach(p => {
        subscribeToParticipantVideoStreams(p, remoteRenderer, remoteVideo);
    })
}