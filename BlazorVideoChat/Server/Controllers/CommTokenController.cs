using Azure.Communication.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;
using BlazorVideoChat.Shared;

namespace BlazorVideoChat.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommTokenController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public CommTokenController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // TODO: Authorize this route
        [HttpGet]
        public async Task<IActionResult> GetAccessToken()
        {
            string connectionString = _configuration["CommunicationService:ConnectionString"];
            var client = new CommunicationIdentityClient(connectionString);

            // Issue an identity and an access token with the "voip" scope for the new identity
            var identityAndTokenResponse = await client.CreateUserAndTokenAsync(
                scopes: new[] { CommunicationTokenScope.VoIP });

            var commModel = new CommunicationModel
            {
                CommunicationUser = identityAndTokenResponse.Value.User,
                CommunicationsToken = identityAndTokenResponse.Value.AccessToken.Token,
                ExpiresOn = identityAndTokenResponse.Value.AccessToken.ExpiresOn
            };

            return Ok(commModel);
        }
    }
}
