using Azure.Communication;
using System;

namespace BlazorVideoChat.Shared
{
    public class CommunicationModel
    {
        public CommunicationUserIdentifier CommunicationUser { get; set; }
        public string CommunicationsToken { get; set; }
        public DateTimeOffset ExpiresOn { get; set; }
    }
}
