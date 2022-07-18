import {
    CallClient,
    VideoStreamRenderer,
    LocalVideoStream
} from "@azure/communication-calling";

import {
    AzureCommunicationTokenCredential
} from '@azure/communication-common';



let callAgent;
let devices;
let localVideo;
let remoteVideo
let localRender;
let localStream;
let call;

window.videoChat = {
    init: async (USER_ACCESS_TOKEN, localVidDOM, remoteVideoDOM) => {
        try {
            localVideo = localVidDOM;
            remoteVideo = remoteVideoDOM;
    
            let callClient = new CallClient();
            const tokenCredential = new AzureCommunicationTokenCredential(USER_ACCESS_TOKEN);
            callAgent = await callClient.createCallAgent(tokenCredential);
            devices = await callClient.getDeviceManager();

            // Receive an incoming call
            // To handle incoming calls you need to listen to the `incomingCall` event of `callAgent`. 
            callAgent.on('incomingCall', async e => {
                localStream = await createLocalVideoStream();
                const videoOptions = localStream ? { localVideoStreams: [localStream] } : undefined;
                call = await e.incomingCall.accept({ videoOptions });

                subscribeToCall(call);
            });
        } catch (err) {
            console.log(err);
        }
    },

    startcall: async (userToCall) => {
        try {
            localStream = await createLocalVideoStream();
            const videoOptions = localStream ? { localVideoStreams: [localStream] } : undefined;
            call = callAgent.startCall(
                [{ communicationUserId: userToCall }], 
                { videoOptions }
            );
    
            subscribeToCall(call);
        } catch (err) {
            console.log(err);
        }
    },

    stopcall: async () => {
        try {
            // end the current call
            await call.hangUp();
        } catch (err) {
            console.log(err);
        }
    },
}

// Below code is built off of the following doc:
// https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/voice-video-calling/get-started-with-video-calling?pivots=platform-web

/**
 * Subscribe to a call obj.
 * Listen for property changes and collection updates.
 */
function subscribeToCall (call) {
    try {
        // Inspect the initial call.id value.
        console.log(`Call Id: ${call.id}`);
        //Subscribe to call's 'idChanged' event for value changes.
        call.on('idChanged', () => {
            console.log(`Call Id changed: ${call.id}`); 
        });

        // Inspect the initial call.state value.
        console.log(`Call state: ${call.state}`);
        // Subscribe to call's 'stateChanged' event for value changes.
        call.on('stateChanged', async () => {
            console.log(`Call state changed: ${call.state}`);
            if (call.state === 'Disconnected') {
                console.log(`Call ended, call end reason={code=${call.callEndReason.code}, subCode=${call.callEndReason.subCode}}`);
            }   
        });

        call.localVideoStreams.forEach(async (lvs) => {
            localStream = lvs;
            await displayLocalVideoStream();
        });
        call.on('localVideoStreamsUpdated', e => {
            e.added.forEach(async (lvs) => {
                localStream = lvs;
                await displayLocalVideoStream();
            });
            e.removed.forEach(lvs => {
                localRender.dispose();
            });
        });
        
        // Inspect the call's current remote participants and subscribe to them.
        call.remoteParticipants.forEach(remoteParticipant => {
            subscribeToRemoteParticipant(remoteParticipant);
        });
        // Subscribe to the call's 'remoteParticipantsUpdated' event to be
        // notified when new participants are added to the call or removed from the call.
        call.on('remoteParticipantsUpdated', e => {
            // Subscribe to new remote participants that are added to the call.
            e.added.forEach(remoteParticipant => {
                subscribeToRemoteParticipant(remoteParticipant)
            });
            // Unsubscribe from participants that are removed from the call
            e.removed.forEach(remoteParticipant => {
                console.log('Remote participant removed from the call.');
            });
        });
    } catch (error) {
        console.error(error);
    }
}


/**
 * Subscribe to a remote participant obj.
 * Listen for property changes and collection udpates.
 */
function subscribeToRemoteParticipant(remoteParticipant) {
    try {
        // Inspect the initial remoteParticipant.state value.
        console.log(`Remote participant state: ${remoteParticipant.state}`);
        // Subscribe to remoteParticipant's 'stateChanged' event for value changes.
        remoteParticipant.on('stateChanged', () => {
            console.log(`Remote participant state changed: ${remoteParticipant.state}`);
        });

        // Inspect the remoteParticipants's current videoStreams and subscribe to them.
        remoteParticipant.videoStreams.forEach(remoteVideoStream => {
            subscribeToRemoteVideoStream(remoteVideoStream)
        });
        // Subscribe to the remoteParticipant's 'videoStreamsUpdated' event to be
        // notified when the remoteParticiapant adds new videoStreams and removes video streams.
        remoteParticipant.on('videoStreamsUpdated', e => {
            // Subscribe to new remote participant's video streams that were added.
            e.added.forEach(remoteVideoStream => {
                subscribeToRemoteVideoStream(remoteVideoStream)
            });
            // Unsubscribe from remote participant's video streams that were removed.
            e.removed.forEach(remoteVideoStream => {
                console.log('Remote participant video stream was removed.');
            })
        });
    } catch (error) {
        console.error(error);
    }
}

/**
 * Subscribe to a remote participant's remote video stream obj.
 * You have to subscribe to the 'isAvailableChanged' event to render the remoteVideoStream. If the 'isAvailable' property
 * changes to 'true', a remote participant is sending a stream. Whenever availability of a remote stream changes
 * you can choose to destroy the whole 'Renderer', a specific 'RendererView' or keep them, but this will result in displaying blank video frame.
 */
async function subscribeToRemoteVideoStream(remoteVideoStream) {
    let renderer = new VideoStreamRenderer(remoteVideoStream);
    let view;
    let remoteVideoContainer = document.createElement('div');

    const createView = async () => {
        // Create a renderer view for the remote video stream.
        view = await renderer.createView();
        // Attach the renderer view to the UI.
        remoteVideoContainer.appendChild(view.target);
        remoteVideo.appendChild(remoteVideoContainer);
    }

    // Remote participant has switched video on/off
    remoteVideoStream.on('isAvailableChanged', async () => {
        try {
            if (remoteVideoStream.isAvailable) {
                await createView();
            } else {
                view.dispose();
                remoteVideo.removeChild(remoteVideoContainer);
            }
        } catch (e) {
            console.error(e);
        }
    });

    // Remote participant has video on initially.
    if (remoteVideoStream.isAvailable) {
        try {
            await createView();
        } catch (e) {
            console.error(e);
        }
    }
}

/**
 * To render a LocalVideoStream, you need to create a new instance of VideoStreamRenderer, and then
 * create a new VideoStreamRendererView instance using the asynchronous createView() method.
 * You may then attach view.target to any UI element. 
 */
async function createLocalVideoStream() {
    const camera = (await devices.getCameras())[0];
    if (camera) {
        return new LocalVideoStream(camera);
    } else {
        console.error(`No camera device found on the system`);
    }
}

/**
 * Display your local video stream preview in your UI
 */
async function displayLocalVideoStream() {
    try {
        localRender = new VideoStreamRenderer(localStream);
        const view = await localRender.createView();
        localVideo.appendChild(view.target);
    } catch (error) {
        console.error(error);
    } 
}