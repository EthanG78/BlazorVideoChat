namespace BlazorVideoChat.Client.Services
{
    public interface ICommSettingsService
    {
        string GetConnectionString();

        void SetConnectionString(string connStr);
    }
}
