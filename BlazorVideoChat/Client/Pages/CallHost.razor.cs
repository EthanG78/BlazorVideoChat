using Azure.Communication;
using Azure.Communication.Identity;
using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.Configuration;
using Microsoft.JSInterop;
using System;
using System.Threading.Tasks;
using BlazorVideoChat.Client.Services;

namespace BlazorVideoChat.Client.Pages
{
    public class CallHostBase : ComponentBase
    {
        [Inject]
        IJSRuntime _js { get; set; }

        [Inject]
        ICommSettingsService _commSettingsService { get; set; }

        protected ElementReference MyVideo;
        protected ElementReference RemoteVideo;

        protected string CalleeInput { get; set; }
        protected ElementReference CallButton;
        protected ElementReference HangUpButton;
        protected ElementReference StartVidButton;
        protected ElementReference StopVidButton;

        protected CommunicationUserIdentifier CommunicationUser = null;
        protected string CommunicationsToken;
        protected DateTimeOffset ExpiresOn;



        protected override async Task OnInitializedAsync()
        {
            var connStr = _commSettingsService.GetConnectionString();

            Console.WriteLine(connStr);

            /*var client = new CommunicationIdentityClient(CommunicationsConnectionString);

            // Issue an identity and an access token with the "voip" scope for the new identity
            var identityAndTokenResponse = await client.CreateUserAndTokenAsync(
                scopes: new[] { CommunicationTokenScope.VoIP });

            CommunicationUser = identityAndTokenResponse.Value.User;
            CommunicationsToken = identityAndTokenResponse.Value.AccessToken.Token;
            ExpiresOn = identityAndTokenResponse.Value.AccessToken.ExpiresOn;

            StateHasChanged();*/
        }

       /* protected async Task InitializeCall()
        {
            if (CommunicationsToken != null)
            {
                await _js.InvokeVoidAsync("hostVideoChat.init", CommunicationsToken, MyVideo, RemoteVideo);

                StateHasChanged();
            }
        }*/
    }
}
