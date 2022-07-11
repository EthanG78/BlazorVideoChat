import {
    CallClient,
    CallAgent,
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
let hostLocalRender;
let hostLocalStream;
let hostRemoteRender;
let hostCall;

// Client variables
let clientCallClient;
let clientCallAgent;
let clientDevices;

window.hostVideoChat = {
    init: async (USER_ACCESS_TOKEN, localVidDOM) => {
        hostLocalVideo = localVidDOM;

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

        // TODO: Move these UI controls to C# side
        //stopVideoButton.disabled = false;
        //startVideoButton.disabled = true;

        //const userToCall = calleeInput.value;

        hostCall = hostCallAgent.startCall(
            [{ communicationUserId: userToCall }],
            callOptions
        );

        subscribeToRemoteParticipantInCall(hostCall, hostRemoteRender);

        // Move to C#
        //hangUpButton.disabled = false;
        //callButton.disabled = true;
        //calleeInput.disabled = true;
    },

    stopcall: async () => {
        // dispose of the renderers
        hostLocalRender.dispose();
        hostRemoteRender.dispose();

        // end the current call
        await hostCall.hangUp();

        // TODO: Do this in C#
        //hangUpButton.disabled = true;
        //callButton.disabled = false;
        //stopVideoButton.disabled = true;
        //calleeInput.disabled = false;
    },

    startvideo: async () => {
        await hostCall.startVideo(hostLocalStream);

        hostLocalRender = new VideoStreamRenderer(hostLocalStream);
        const view = await hostLocalRender.createView();
        hostLocalVideo.appendChild(view.target);

        // TODO: Do this in C#
        //stopVideoButton.disabled = false;
        //startVideoButton.disabled = true;
        //calleeInput.disabled = true;
    },

    stopvideo: async () => {
        await hostCall.stopVideo(hostLocalStream);

        hostLocalRender.dispose();

        // TODO: Do this in C#
        //startVideoButton.disabled = false;
        //calleeInput.disabled = false;
        //stopVideoButton.disabled = true;
    }
}

/*window.clientVideoChat = {
    init: async (USER_ACCESS_TOKEN) => {

    },

    startvideo: async () => {

    },

    stopvideo: async () => {

    }
}*/

/*window.init = async (USER_ACCESS_TOKEN, calleeInputDOM, callButtonDOM, hangUpButtonDOM, stopVideoButtonDOM, startVideoButtonDOM, localVid) => {
    const callClient = new CallClient();
    const tokenCredential = new AzureCommunicationTokenCredential(USER_ACCESS_TOKEN);
    callAgent = await callClient.createCallAgent(tokenCredential, { displayName: 'optional ACS user name' });

    const calleeInput = calleeInputDOM;
    const callButton = callButtonDOM;
    const hangUpButton = hangUpButtonDOM;
    const stopVideoButton = stopVideoButtonDOM;
    const startVideoButton = startVideoButtonDOM;

    localVideo = localVid;

    // Receive an incoming call
    // To handle incoming calls you need to listen to the `incomingCall` event of `callAgent`. 
    // Once there is an incoming call, you need to enumerate local cameras and construct
    // a `LocalVideoStream` instance to send a video stream to the other participant. 
    // You also need to subscribe to`remoteParticipants` to handle remote video streams.You can
    // accept or reject the call through the `incomingCall` instance. 

    callAgent.on('incomingCall', async e => {

        const videoDevices = await deviceManager.getCameras();
        const videoDeviceInfo = videoDevices[0];

        localVideoStream = new LocalVideoStream(videoDeviceInfo);
        localVideoView();

        stopVideoButton.disabled = false;
        callButton.disabled = true;
        hangUpButton.disabled = false;

        const addedCall = await e.incomingCall.accept({ videoOptions: { localVideoStreams: [localVideoStream] } });
        call = addedCall;
        subscribeToRemoteParticipantInCall(addedCall);
    });

    // Subscribe to call updates
    // You need to subscribe to the event when the remote participant ends the call to 
    // dispose of video renderers and toggle button states.

    callAgent.on('callsUpdated', e => {

        e.removed.forEach(removedCall => {
            // dispose of video renders
            rendererLocal.dispose();
            rendererRemote.dispose();

            // toggle button states
            hangUpButton.disabled = true;
            callButton.disabled = false;
            stopVideoButton.disabled = true;
        })
    })

    deviceManager = await callClient.getDeviceManager();

    callButton.disabled = false;
    calleeInput.disabled = false;


    startVideoButton.addEventListener("click", async () => {

        
    });
}*/

async function remoteVideoView(remoteVideoStream, remoteRenderer) {
    remoteRenderer = new VideoStreamRenderer(remoteVideoStream);
    const view = await remoteRenderer.createView();
    remoteVideo.appendChild(view.target);
}

function handleVideoStream(remoteVideoStream, remoteRenderer) {
    remoteVideoStream.on('isAvailableChanged', async () => {
        if (remoteVideoStream.isAvailable) {
            remoteVideoView(remoteVideoStream, remoteRenderer);
        } else {
            remoteRenderer.dispose();
        }
    });

    if (remoteVideoStream.isAvailable) {
        remoteVideoView(remoteVideoStream, remoteRenderer);
    }
}

function subscribeToParticipantVideoStreams(remoteParticipant, remoteRenderer) {
    remoteParticipant.on('videoStreamsUpdated', e => {

        e.added.forEach(v => {
            handleVideoStream(v, remoteRenderer);
        })
    });

    remoteParticipant.videoStreams.forEach(v => {
        handleVideoStream(v, remoteRenderer);
    });
}

function subscribeToRemoteParticipantInCall(callInstance, remoteRenderer) {
    callInstance.on('remoteParticipantsUpdated', e => {

        e.added.forEach(p => {
            subscribeToParticipantVideoStreams(p, remoteRenderer);
        })
    });

    callInstance.remoteParticipants.forEach(p => {
        subscribeToParticipantVideoStreams(p, remoteRenderer);
    })
}

/*async function localVideoView() {
    rendererLocal = new VideoStreamRenderer(localVideoStream);
    const view = await rendererLocal.createView();
    localVideo.appendChild(view.target);
}*/
