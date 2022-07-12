namespace BlazorVideoChat.Client.Services
{
    public class CommSettingsService : ICommSettingsService
    {
        private string _connectionString;

        public CommSettingsService()
        {
        }

        public string GetConnectionString()
        {
            return _connectionString;
        }

        public void SetConnectionString(string connStr)
        {
            _connectionString = connStr;
        }
    }
}
