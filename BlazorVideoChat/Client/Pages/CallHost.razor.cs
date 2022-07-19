using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System;
using System.Threading.Tasks;
using System.Net.Http;
using System.Net.Http.Json;
using BlazorVideoChat.Shared;
using System.Collections.Generic;
using Microsoft.AspNetCore.Components.Authorization;
using System.Linq;

namespace BlazorVideoChat.Client.Pages
{
    public class CallHostBase : ComponentBase
    {
        [Inject]
        IJSRuntime _js { get; set; }

        [Inject]
        IHttpClientFactory _httpClientFactory { get; set; }

        [Inject]
        AuthenticationStateProvider _authStateProvider { get; set; } 

        private HttpClient _httpClient { get; set; }

        protected ElementReference MyVideo { get; set; }
        protected ElementReference RemoteVideo { get; set; }

        protected CommunicationModel CommModel { get; set; } = null;

        protected bool CallInputDisabled { get; set; } = false;
        protected bool CallButtonDisabled { get; set; } = false;
        protected bool HangUpButtonDisabled { get; set; } = true;
        protected bool ShowDropdown { get; set; } = false;
        protected List<CallData> InProgressCalls { get; set; }
        protected string ChosenCall { get; set; } = String.Empty;

        protected override async Task OnInitializedAsync()
        {
            _httpClient = _httpClientFactory.CreateClient("BlazorVideoChat.ServerAPI.Private");

            // Must be authenticated to be on this page to begin with
            var authState = await _authStateProvider.GetAuthenticationStateAsync();
            var userId = authState.User.FindFirst(c => c.Type.Equals("sub"))?.Value;
            // Get list of in progress calls for authenticated user
            InProgressCalls = await _httpClient.GetFromJsonAsync<List<CallData>>($"api/calldata/{userId}");

            foreach(var call in InProgressCalls)
            {
                Console.WriteLine(call.AttendeeToken);
            }

            await base.OnInitializedAsync();

            StateHasChanged();
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            // We cannot use ElementReferences inside lifecycle methods unless it is OnAfterRender*
            // Therefore I must move the above call to that method.
            // Source: https://blazor-university.com/javascript-interop/calling-javascript-from-dotnet/passing-html-element-references/\
            
            if (firstRender)
            {
                CommModel = await _httpClient.GetFromJsonAsync<CommunicationModel>("api/commtoken/");

                if (CommModel is null) throw new ArgumentNullException(nameof(CommModel));

                await _js.InvokeVoidAsync("videoChat.init", CommModel.CommunicationsToken, MyVideo, RemoteVideo);

                StateHasChanged();
            }

        }

        protected async Task Call(string AttendeeToken)
        {
            Console.WriteLine(AttendeeToken);
            await _js.InvokeVoidAsync("videoChat.startcall", AttendeeToken);

            CallInputDisabled = true;
            CallButtonDisabled = true;
            HangUpButtonDisabled = false;
            StateHasChanged();
        }

        protected async Task HangUp()
        {
            await _js.InvokeVoidAsync("videoChat.stopcall");

            CallInputDisabled = false;
            CallButtonDisabled = false;
            HangUpButtonDisabled = true;

            // update the call to no longer be in progress
            CallData call = InProgressCalls.FirstOrDefault(c => c.AttendeeToken.Equals(ChosenCall));
            call.IsInProgress = false;
            await _httpClient.PutAsJsonAsync($"api/calldata/", call);

            StateHasChanged();
        }
    }
}
