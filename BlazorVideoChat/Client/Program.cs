using BlazorVideoChat.Client.Services;
using Microsoft.AspNetCore.Components.WebAssembly.Authentication;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace BlazorVideoChat.Client
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebAssemblyHostBuilder.CreateDefault(args);
            builder.RootComponents.Add<App>("#app");

            builder.Services.AddHttpClient("BlazorVideoChat.ServerAPI", client => client.BaseAddress = new Uri(builder.HostEnvironment.BaseAddress))
                .AddHttpMessageHandler<BaseAddressAuthorizationMessageHandler>();

            builder.Services.AddSingleton<ICommSettingsService, CommSettingsService>();

            // Supply HttpClient instances that include access tokens when making requests to the server project
            builder.Services.AddScoped(sp => sp.GetRequiredService<IHttpClientFactory>().CreateClient("BlazorVideoChat.ServerAPI"));

            builder.Services.AddApiAuthorization();

            var host = builder.Build();

            // Set the Azure Communications Service connection string for use in app
            var _commSettingsService = host.Services.GetRequiredService<ICommSettingsService>();
            _commSettingsService.SetConnectionString(builder.Configuration["CommunicationService:ConnectionString"]);

            await host.RunAsync();
        }
    }
}
