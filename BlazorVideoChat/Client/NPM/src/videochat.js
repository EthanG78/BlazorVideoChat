import {
    CallClient,
    VideoStreamRenderer,
    LocalVideoStream
} from "@azure/communication-calling";

import {
    AzureCommunicationTokenCredential
} from '@azure/communication-common';


// I HATE JAVASCRIPT YAYAYAYAYA

// Variables used by hosts making calls;
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

        let hostCallClient = new CallClient();
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

// Variables used by clients attending a call
let clientCallAgent;
let clientDevices;
let clientLocalVideo;
let clientRemoteVideo
let clientLocalRender;
let clientLocalStream;
let clientRemoteRender;
let clientCall;

window.clientVideoChat = {
    init: async (USER_ACCESS_TOKEN, localVidDOM, remoteVideoDOM) => {
        clientLocalVideo = localVidDOM;
        clientRemoteVideo = remoteVideoDOM;

        let clientCallClient = new CallClient();
        const tokenCredential = new AzureCommunicationTokenCredential(USER_ACCESS_TOKEN);
        clientCallAgent = await clientCallClient.createCallAgent(tokenCredential);
        clientDevices = await clientCallClient.getDeviceManager();

        // Receive an incoming call
        // To handle incoming calls you need to listen to the `incomingCall` event of `callAgent`. 
        // Once there is an incoming call, you need to enumerate local cameras and construct
        // a `LocalVideoStream` instance to send a video stream to the other participant. 
        // You also need to subscribe to`remoteParticipants` to handle remote video streams.You can
        // accept or reject the call through the `incomingCall` instance. 
        clientCallAgent.on('incomingCall', async e => {
            const videoDevices = await clientDevices.getCameras();
            const videoDeviceInfo = videoDevices[0];

            clientLocalStream = new LocalVideoStream(videoDeviceInfo);

            clientLocalRender = new VideoStreamRenderer(clientLocalStream);
            const view = await clientLocalRender.createView();
            clientLocalVideo.appendChild(view.target);

            const addedCall = await e.incomingCall.accept({ videoOptions: { localVideoStreams: [clientLocalStream] } });
            clientCall = addedCall;
            subscribeToRemoteParticipantInCall(clientCall, clientRemoteRender, clientRemoteVideo);
        });

        // Subscribe to call updates
        // You need to subscribe to the event when the remote participant ends the call to 
        // dispose of video renderers and toggle button states.
        clientCallAgent.on('callsUpdated', e => {
            e.removed.forEach(removedCall => {
                // dispose of video renders
                clientLocalRender.dispose();
                clientRemoteRender.dispose();
            })
        })
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