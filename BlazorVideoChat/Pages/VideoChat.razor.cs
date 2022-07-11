using Microsoft.AspNetCore.Components;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Azure.Communication.Identity;
using Azure.Communication;
using Microsoft.JSInterop;

namespace BlazorVideoChat.Pages
{
    public class VideoChatBase : ComponentBase, IDisposable
    {
        [Inject]
        IJSRuntime _js { get; set; }

        [Inject]
        IConfiguration _configuration { get; set; }

        protected ElementReference MyVideo;
        protected ElementReference RemoteVideo;

        protected ElementReference CalleeInput;
        protected ElementReference CallButton;
        protected ElementReference HangUpButton;
        protected ElementReference StartVidButton;
        protected ElementReference StopVidButton;

        protected CommunicationUserIdentifier CommunicationUser = null;
        protected string CommunicationsToken;
        protected DateTimeOffset ExpiresOn;

        protected bool IsInitialized { get; set; } = false;
        protected bool CallInputDisabled { get; set; } = true;
        protected bool CallButtonDisabled { get; set; } = true;


        protected override async Task OnInitializedAsync()
        {
            string CommunicationsConnectionString =
                _configuration.GetValue<string>("CommunicationService:ConnectionString");

            Console.WriteLine(CommunicationsConnectionString);

            var client = new CommunicationIdentityClient(CommunicationsConnectionString);

            // Issue an identity and an access token with the "voip" scope for the new identity
            var identityAndTokenResponse = await client.CreateUserAndTokenAsync(
                scopes: new[] { CommunicationTokenScope.VoIP });

            CommunicationUser = identityAndTokenResponse.Value.User;
            CommunicationsToken = identityAndTokenResponse.Value.AccessToken.Token;
            ExpiresOn = identityAndTokenResponse.Value.AccessToken.ExpiresOn;

            StateHasChanged();
        }

        protected async Task InitializeCall()
        {
            if (CommunicationsToken != null)
            {
                await _js.InvokeVoidAsync("hostVideoChat.init", CommunicationsToken, MyVideo);

                CallInputDisabled = false;
                CallButtonDisabled = false;
                IsInitialized = true;

                StateHasChanged();
            }
        }

        protected async Task StartCall()
        {
            Console.WriteLine("So you want to start a call?");
        }

        public void Dispose()
        {
            // TODO:
            // MAYBE WE CAN DISPOSE OF JS RENDERERS IN HERE??
            Console.WriteLine("Dispose of fun communication stuff");
        }
    }
}
