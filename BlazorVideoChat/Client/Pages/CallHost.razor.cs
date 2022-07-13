using Azure.Communication;
using Azure.Communication.Identity;
using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.Configuration;
using Microsoft.JSInterop;
using System;
using System.Threading.Tasks;
using BlazorVideoChat.Client.Services;
using System.Net.Http;
using System.Net.Http.Json;
using BlazorVideoChat.Shared;

namespace BlazorVideoChat.Client.Pages
{
    public class CallHostBase : ComponentBase
    {
        [Inject]
        IJSRuntime _js { get; set; }

        [Inject]
        IHttpClientFactory _httpClientFactory { get; set; }

        protected ElementReference HostVideo;
        protected ElementReference ClientVideo;

        protected string CalleeInput { get; set; }

        protected CommunicationModel CommModel { get; set; } = null;

        protected bool CallInputDisabled { get; set; } = false;
        protected bool CallButtonDisabled { get; set; } = false;
        protected bool HangUpButtonDisabled { get; set; } = true;

        protected override async Task OnInitializedAsync()
        {
            var httpClient = _httpClientFactory.CreateClient("BlazorVideoChat.ServerAPI.Public");

            CommModel = await httpClient.GetFromJsonAsync<CommunicationModel>("api/commtoken/");

            await _js.InvokeVoidAsync("hostVideoChat.init", CommModel.CommunicationsToken, HostVideo, ClientVideo);

            StateHasChanged();
        }

        protected async Task Call()
        {
            Console.WriteLine(CalleeInput);
            // MAKE JS CALL
            await _js.InvokeVoidAsync("hostVideoChat.startcall", CalleeInput);

            CallInputDisabled = true;
            CallButtonDisabled = true;
            HangUpButtonDisabled = false;
            StateHasChanged();
        }

        protected async Task HangUp()
        {
            // MAKE JS CALL
            await _js.InvokeVoidAsync("hostVideoChat.stopcall");

            CallInputDisabled = false;
            CallButtonDisabled = false;
            HangUpButtonDisabled = true;
            StateHasChanged();
        }
    }
}
