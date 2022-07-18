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

        private HttpClient _httpClient { get; set; }

        protected ElementReference MyVideo { get; set; }
        protected ElementReference RemoteVideo { get; set; }

        protected string CalleeInput { get; set; }

        protected CommunicationModel CommModel { get; set; } = null;

        protected bool CallInputDisabled { get; set; } = false;
        protected bool CallButtonDisabled { get; set; } = false;
        protected bool HangUpButtonDisabled { get; set; } = true;

        protected override async Task OnInitializedAsync()
        {
            _httpClient = _httpClientFactory.CreateClient("BlazorVideoChat.ServerAPI.Public");

            await base.OnInitializedAsync();
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

        protected async Task Call()
        {
            Console.WriteLine(CalleeInput);
            await _js.InvokeVoidAsync("videoChat.startcall", CalleeInput);

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
            StateHasChanged();
        }
    }
}
